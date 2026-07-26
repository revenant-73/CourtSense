"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ClipboardList, UserCheck, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const role = session.user.role;

  return (
    <nav className="bg-white border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center font-black text-indigo-600 tracking-tighter text-xl">
              COURTSENSE
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {role === "DIRECTOR" && (
                <Link href="/director" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                  Director
                </Link>
              )}
              <Link href="/evaluate" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Evaluate
              </Link>
              <Link href="/check-in" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Check-in
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 px-2 z-40 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        {role === "DIRECTOR" && (
          <Link href="/director" className="flex flex-col items-center text-gray-500">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-[10px] mt-1">Director</span>
          </Link>
        )}
        <Link href="/evaluate" className="flex flex-col items-center text-indigo-600">
          <ClipboardList className="h-6 w-6" />
          <span className="text-[10px] mt-1">Evaluate</span>
        </Link>
        <Link href="/check-in" className="flex flex-col items-center text-gray-500">
          <UserCheck className="h-6 w-6" />
          <span className="text-[10px] mt-1">Check-in</span>
        </Link>
      </div>
    </nav>
  );
}
