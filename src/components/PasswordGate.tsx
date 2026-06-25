"use client";

import { useState, useEffect } from "react";

const COOKIE_NAME = "poodle-diary-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;

  useEffect(() => {
    if (!appPassword) {
      // No password configured, skip gate
      setAuthenticated(true);
      setChecking(false);
      return;
    }
    const saved = getCookie(COOKIE_NAME);
    if (saved === appPassword) {
      setAuthenticated(true);
    }
    setChecking(false);
  }, [appPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === appPassword) {
      setCookie(COOKIE_NAME, input, COOKIE_MAX_AGE);
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (checking) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 text-center">
        <div className="text-4xl">🐶</div>
        <h1 className="text-xl font-bold text-stone-800">Poodle&apos;s Diary</h1>
        <p className="text-sm text-stone-500">Enter password to continue</p>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-stone-800 outline-none transition-colors ${
            error ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-amber-400"
          }`}
        />
        {error && <p className="text-xs text-red-500">Wrong password</p>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
