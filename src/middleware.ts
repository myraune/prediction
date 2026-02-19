export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/markets/:path*", "/portfolio/:path*", "/leaderboard/:path*", "/profile/:path*", "/admin/:path*"],
};
