"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// Ordem definida pela Suzana: Dashboard, Eventos, Caixa evento, Pedidos,
// Estoque, Produção, Receitas, Fornecedores, Fichas Técnicas, Financeiro.
// Eventos/Caixa evento/Pedidos/Estoque/Produção ainda não existem (Milestones
// 2 e 3) — quando forem criados, entram aqui nessa posição, antes de Receitas.
const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/receitas", label: "Receitas" },
  { href: "/fornecedores", label: "Fornecedores" },
];

// Financeiro (Milestone 4) entra aqui quando existir, junto com Fichas Técnicas.
const adminLinks = [{ href: "/fichas-tecnicas", label: "Fichas Técnicas" }];

export function NavBar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const pathname = usePathname();
  const initials = userName.slice(0, 1).toUpperCase() || "?";
  const visibleLinks = role === "ADMIN" ? [...links, ...adminLinks] : links;

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full bg-white/85 py-2 pl-2 pr-3 shadow-[0_2px_4px_rgba(20,22,46,0.05),0_10px_28px_rgba(20,22,46,0.09)] backdrop-blur-md">
        <div className="flex items-center gap-1">
          <span className="mr-1 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-[#14162e]">
            ONN
          </span>
          <nav className="flex items-center gap-1">
            {visibleLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "onn-pill font-medium",
                    active
                      ? "bg-[#14162e] text-[#FEFEF2] shadow-[0_2px_6px_rgba(20,22,46,0.35)]"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-[#14162e]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-onn-support/40 px-1 py-1 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-onn-primary text-xs font-semibold text-[#FEFEF2]">
              {initials}
            </span>
            <span className="hidden text-sm font-medium text-[#14162e] sm:inline">
              {userName}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-[#14162e]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
