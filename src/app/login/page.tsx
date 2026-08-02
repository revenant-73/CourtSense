"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "DIRECTOR", email: "admin@tvvc.org", password: "admin123", redirectTo: "/director" },
  { label: "EVALUATOR", email: "evaluator@tvvc.org", password: "admin123", redirectTo: "/evaluate" },
  { label: "STAFF", email: "checkin@tvvc.org", password: "admin123", redirectTo: "/check-in" },
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRedirect, setDemoRedirect] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (demoRedirect) {
      window.location.href = demoRedirect;
    }
  }, [demoRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email: account.email,
        password: account.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Demo login failed");
      } else {
        setDemoRedirect(account.redirectTo);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-10 z-10">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-primary drop-shadow-glow">
            COURTSENSE
          </h1>
          <p className="mt-4 text-sm font-medium text-foreground/50 uppercase tracking-[0.2em]">
            Precision Evaluation Engine
          </p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl border-white/5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/50 ml-4 mb-2 block uppercase tracking-wider">Email Address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-2xl border-0 bg-background/50 py-3 px-4 text-foreground ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder="coach@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/50 ml-4 mb-2 block uppercase tracking-wider">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-2xl border-0 bg-background/50 py-3 px-4 text-foreground ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs font-bold text-warning text-center px-4 py-2 bg-warning/10 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-glow text-sm font-black uppercase tracking-widest text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "Authenticating..." : "Access System"}
            </button>
          </form>

          {process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true" && (
            <div className="mt-10 pt-8 border-t border-white/5 space-y-3">
              <p className="text-center text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-4">
                Demo Access
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    className="py-3 px-1 rounded-xl text-[10px] font-bold text-foreground/60 bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
