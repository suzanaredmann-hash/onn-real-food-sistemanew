import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rotas restritas à administradora (hoje: fichas técnicas com CMV/margem;
// financeiro entra aqui quando existir).
const ADMIN_ONLY_PREFIXES = ["/fichas-tecnicas"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );
  if (isAdminOnlyRoute && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
