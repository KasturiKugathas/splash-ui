import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("splash_ui_session")?.value;
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith("/app") || pathname.startsWith("/repositories") || pathname.startsWith("/editor");

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    const next = request.nextUrl.searchParams.get("next") || "/app";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/repositories", "/editor", "/login"],
};
