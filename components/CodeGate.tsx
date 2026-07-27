"use client";

import { useState } from "react";

interface CodeGateProps {
  onValidCode: (code: string) => void;
}

export default function CodeGate({ onValidCode }: CodeGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.toUpperCase().trim();
    if (trimmed.length !== 6) {
      setError("Enter a 6-character code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (data.valid) {
        sessionStorage.setItem("lemonade_code", trimmed);
        onValidCode(trimmed);
      } else {
        setError(data.reason || "Invalid code");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-stone-800 border-2 border-amber-500 rounded-xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🍋</div>
        <h1 className="text-2xl font-bold text-amber-400 font-mono mb-2">
          Gourmet Lemonade
        </h1>
        <p className="text-stone-400 text-sm mb-6">
          Enter your one-time access code to place your order
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            maxLength={6}
            placeholder="ABC123"
            className="w-full bg-stone-700 border border-stone-600 text-white text-center text-2xl tracking-widest font-mono py-3 rounded-lg focus:border-amber-500 focus:outline-none uppercase"
            autoFocus
            autoComplete="off"
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
