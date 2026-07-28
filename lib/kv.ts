// KV store wrapper — uses Vercel KV in production, in-memory Map in development.

interface KvEntry {
  value: unknown;
  expiresAt: number | null;
}

interface KvPipeline {
  set(key: string, value: unknown, opts?: { ex?: number }): KvPipeline;
  get(key: string): KvPipeline;
  exec(): Promise<unknown[]>;
}

interface KvClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  lpush(key: string, ...values: unknown[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  mget<T = unknown>(...keys: string[]): Promise<(T | null)[]>;
  pipeline(): KvPipeline;
}

type PipelineOperation =
  | { cmd: "set"; key: string; value: unknown; opts?: { ex?: number } }
  | { cmd: "get"; key: string };

class DevKVStore implements KvClient {
  private store = new Map<string, KvEntry>();
  private lists = new Map<string, unknown[]>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<string> {
    this.store.set(key, {
      value,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
    });
    return "OK";
  }

  async lpush(key: string, ...values: unknown[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.unshift(...values);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end) as string[];
  }

  async mget<T = unknown>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  pipeline(): KvPipeline {
    const operations: PipelineOperation[] = [];
    const runSet = this.set.bind(this);
    const runGet = this.get.bind(this);
    const pipeline: KvPipeline = {
      set(key, value, opts) {
        operations.push({ cmd: "set", key, value, opts });
        return pipeline;
      },
      get(key) {
        operations.push({ cmd: "get", key });
        return pipeline;
      },
      async exec() {
        const results: unknown[] = [];
        for (const operation of operations) {
          if (operation.cmd === "set") {
            await runSet(operation.key, operation.value, operation.opts);
            results.push("OK");
          } else {
            results.push(await runGet(operation.key));
          }
        }
        return results;
      },
    };
    return pipeline;
  }
}

const devStore = new DevKVStore();
let resolvedKv: KvClient | null = null;

async function resolveKv(): Promise<KvClient> {
  if (resolvedKv) return resolvedKv;

  if (process.env.KV_URL || process.env.KV_REST_API_URL) {
    try {
      const mod = await import("@vercel/kv");
      resolvedKv = mod.kv as unknown as KvClient;
      return resolvedKv;
    } catch {
      // Fall through to the in-memory development store.
    }
  }

  console.warn("[dev] Using in-memory KV — orders reset on restart");
  resolvedKv = devStore;
  return resolvedKv;
}

// Begin resolution eagerly so synchronous methods such as pipeline() are ready
// by the time a request reaches the order store.
void resolveKv();

type DynamicMethod = (...args: unknown[]) => unknown;

export const kv = new Proxy({} as KvClient, {
  get(_target, prop: string | symbol) {
    if (!resolvedKv) {
      return (...args: unknown[]) =>
        resolveKv().then((client) => {
          const member = client[prop as keyof KvClient];
          return (member as DynamicMethod).apply(client, args);
        });
    }

    const member = resolvedKv[prop as keyof KvClient];
    return typeof member === "function" ? member.bind(resolvedKv) : member;
  },
});
