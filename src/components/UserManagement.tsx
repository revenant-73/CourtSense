"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, deleteUser, resetUserPassword } from "@/app/actions/user";
import { signOut } from "next-auth/react";
import { UserPlus, Trash2 } from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

const ROLES = [
  { value: "DIRECTOR", label: "Director" },
  { value: "EVALUATOR", label: "Evaluator" },
  { value: "CHECK_IN", label: "Check-in Staff" },
];

export default function UserManagement({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("EVALUATOR");
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createUser({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        role,
      });
      form.reset();
      setRole("EVALUATOR");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, name: string | null) => {
    if (!confirm(`Remove ${name || "this user"}'s account?`)) return;
    try {
      await deleteUser(userId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <div className="space-y-10">
      <p className="text-sm text-foreground/70">Production rejects the known demo passwords. Reset demo accounts to private passwords before the event. Password resets preserve evaluation history and sign the account out on its next request.</p>
      <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] border-white/5 p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-primary" />
          Add User
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/60">Full Name</label>
            <input
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/60">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/60">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/60">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-card">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="text-xs font-bold text-warning text-center px-4 py-2 bg-warning/10 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-glow text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      {resettingUser && <form className="glass-card rounded-2xl p-6 space-y-3" onSubmit={async event => {
        event.preventDefault();
        setResetting(true);
        setResetMessage("");
        try {
          await resetUserPassword(resettingUser, newPassword);
          setNewPassword("");
          setResetMessage("Password changed. Existing sessions have been revoked.");
          if (resettingUser === currentUserId) await signOut({ callbackUrl: "/login" });
          setResettingUser(null);
        } catch { setResetMessage("Could not reset the password. Please try again."); }
        finally { setResetting(false); }
      }}>
        <label htmlFor="reset-password" className="block text-sm">New password for {users.find(user => user.id === resettingUser)?.email}</label>
        <input id="reset-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="w-full rounded-xl bg-background/50 p-3" />
        <button disabled={resetting} className="bg-primary text-white rounded-xl px-4 py-3 disabled:opacity-50">{resetting ? "Changing…" : "Change password"}</button>
        <button type="button" disabled={resetting} onClick={() => { setResettingUser(null); setNewPassword(""); }} className="ml-3">Cancel</button>
      </form>}
      {resetMessage && <p role="status" className="text-sm text-foreground/70">{resetMessage}</p>}

      <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-foreground">{users.length} Accounts</h2>
        </div>
        <ul className="divide-y divide-white/5">
          {users.map((u) => (
            <li key={u.id} className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 break-all">
                <p className="text-sm font-semibold text-foreground">
                  {u.name} {u.id === currentUserId && <span className="text-foreground/30 font-normal">(you)</span>}
                </p>
                <p className="text-xs text-foreground/40">{u.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => { setResettingUser(u.id); setNewPassword(""); setResetMessage(""); }} className="text-xs text-primary py-2">Reset password</button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {ROLES.find((r) => r.value === u.role)?.label || u.role}
                </span>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-foreground/30 hover:text-warning transition-colors"
                    title="Remove account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
