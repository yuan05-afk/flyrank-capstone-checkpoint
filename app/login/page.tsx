"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLockup } from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [apiKey, setApiKey] = useState("tenant_a_key_demo_001");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen hero-mesh flex flex-col relative overflow-hidden">
      <div className="hero-orb hero-orb-a" aria-hidden="true" />
      <div className="hero-orb hero-orb-b" aria-hidden="true" />
      <header className="relative z-10 px-6 py-5 max-w-6xl mx-auto w-full">
        <BrandLockup />
      </header>
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <motion.form
          onSubmit={onSubmit}
          className="surface w-full max-w-md p-7"
          initial={shouldReduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-2xl font-semibold mb-1">
            Sign in to your workspace
          </h1>
          <p className="text-sm text-muted mb-6">
            Use your tenant API key. Demo keys are prefilled below.
          </p>
          <label className="block text-sm font-medium mb-5">
            <span className="text-muted">API key</span>
            <input
              className="input-field font-mono text-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {error && (
            <p className="badge badge-danger mb-4 !normal-case !tracking-normal !text-xs !font-medium">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
          <p className="mt-4 text-xs text-muted">
            Demo: tenant_a_key_demo_001 · tenant_b_key_demo_002
          </p>
          <p className="mt-3 text-xs">
            <Link href="/" className="text-signal hover:underline">
              ← Back to home
            </Link>
          </p>
        </motion.form>
      </div>
    </main>
  );
}
