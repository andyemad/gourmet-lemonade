// KV store wrapper — uses Vercel KV in production, in-memory Map in development.

interface KvEntry {
  value: any;
  expiresAt: number | null;
}

class DevKVStore {
  private store = new Map<string, KvEntry>();
  private lists = new Map<string, any[]>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<string> {
    this.store.set(key, {
      value,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
    });
    return "OK";
  }

  async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.unshift(...values);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async mget<T = any>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((k) => this.get<T>(k)));
  }

  pipeline() {
    const ops: { cmd: string; args: any[] }[] = [];
    const self = this;
    return {
      set(key: string, value: any, opts?: { ex?: number }) {
        ops.push({ cmd: "set", args: [key, value, opts] });
        return this as any;
      },
      get(key: string) {
        ops.push({ cmd: "get", args: [key] });
        return this as any;
      },
      async exec(): Promise<any[]> {
        const results: any[] = [];
        for (const op of ops) {
          if (op.cmd === "set") {
            await self.set(op.args[0], op.args[1], op.args[2]);
            results.push("OK");
          } else if (op.cmd === "get") {
            results.push(await self.get(op.args[0]));
          }
        }
        return results;
      },
    };
  }
}

// Singleton instance
const devStore = new DevKVStore();

// Import real KV if configured, otherwise use dev store
let _kv: any = null;

async function resolveKv(): Promise<any> {
  if (_kv) return _kv;

  if (process.env.KV_URL || process.env.KV_REST_API_URL) {
    try {
      const mod = await import("@vercel/kv");
      _kv = mod.kv;
      return _kv;
    } catch {
      // Fall through to dev store
    }
  }

  console.warn("[dev] Using in-memory KV — orders reset on restart");
  _kv = devStore;
  return _kv;
}

// Eager init for simplicity (won't fail if @vercel/kv is missing)
resolveKv();

// Export a proxy that delegates to the resolved store
export const kv = new Proxy({} as any, {
  get(_target, prop: string) {
    if (!_kv) {
      // Return async functions that resolve KV first
      return (...args: any[]) =>
        resolveKv().then((real) => real[prop](...args));
    }
    const val = _kv[prop];
    if (typeof val === "function") {
      return val.bind(_kv);
    }
    return val;
  },
});
