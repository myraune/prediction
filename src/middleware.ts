import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Auth gates removed during development — all pages freely browsable
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
