import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has("suoac-access-token");

  const isPublicPath = publicPaths.some((path) => pathname === path);

  if (!hasToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasToken && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|favicon\\.ico|icon\\.png).*)"],
};
