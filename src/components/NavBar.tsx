"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/produtos", label: "Produtos" },
  { href: "/fornecedores", label: "Fornecedores" },
];

export function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-zinc-900">
            ONN Real Food
          </span>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm text-zinc-500 hover:text-zinc-900",
                  pathname.startsWith(link.href) &&
                    "font-medium text-zinc-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
