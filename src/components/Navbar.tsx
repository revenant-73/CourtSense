"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ClipboardList, UserCheck, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const role = session.user.role;

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden sm:block glass-card sticky top-0 z-30 border-b-0 m-4 rounded-2xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="font-black text-primary tracking-tighter text-2xl hover:drop-shadow-glow transition-all">
                COURTSENSE
              </Link>
              <div className="flex space-x-6">
                {role === "DIRECTOR" && (
                  <Link href="/director" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">
                    Director
                  </Link>
                )}
                <Link href="/evaluate" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">
                  Evaluate
                </Link>
                <Link href="/check-in" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">
                  Check-in
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => signOut()}
                className="p-2 text-foreground/50 hover:text-warning transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Top Header */}
      <div className="sm:hidden flex justify-between items-center px-6 py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <Link href="/" className="font-black text-primary tracking-tighter text-xl">
          COURTSENSE
        </Link>
        <button
          onClick={() => signOut()}
          className="text-foreground/50"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Floating Dock */}
      <div className="sm:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="glass-card rounded-3xl flex justify-around items-center py-4 shadow-2xl border border-white/5">
          {role === "DIRECTOR" && (
            <Link href="/director" className="flex flex-col items-center text-foreground/60 hover:text-primary active:scale-90 transition-all">
              <LayoutDashboard className="h-6 w-6" />
            </Link>
          )}
          <Link href="/evaluate" className="flex flex-col items-center text-primary active:scale-90 transition-all">
            <ClipboardList className="h-7 w-7 drop-shadow-glow" />
          </Link>
          <Link href="/check-in" className="flex flex-col items-center text-foreground/60 hover:text-primary active:scale-90 transition-all">
            <UserCheck className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </>
  );
}
