"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ClipboardList, UserCheck, LayoutDashboard } from "lucide-react";
import { CHECK_IN_ROLES, EVALUATE_ROLES } from "@/lib/roles";

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
                {EVALUATE_ROLES.includes(role) && (
                  <Link href="/evaluate" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">
                    Evaluate
                  </Link>
                )}
                {CHECK_IN_ROLES.includes(role) && (
                  <Link href="/check-in" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">
                    Check-in
                  </Link>
                )}
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
        <div className="flex items-center gap-4">
          {role === "DIRECTOR" && (
            <Link href="/director" className="text-foreground/60 hover:text-primary active:scale-90 transition-all" title="Director">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}
          {EVALUATE_ROLES.includes(role) && (
            <Link href="/evaluate" className="text-foreground/60 hover:text-primary active:scale-90 transition-all" title="Evaluate">
              <ClipboardList className="h-5 w-5" />
            </Link>
          )}
          {CHECK_IN_ROLES.includes(role) && (
            <Link href="/check-in" className="text-foreground/60 hover:text-primary active:scale-90 transition-all" title="Check-in">
              <UserCheck className="h-5 w-5" />
            </Link>
          )}
          <button
            onClick={() => signOut()}
            className="text-foreground/50"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}
