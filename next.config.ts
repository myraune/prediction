import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/adapter-libsql",
    "@libsql/client",
    "@libsql/hrana-client",
    "@libsql/isomorphic-ws",
    "@libsql/isomorphic-fetch",
    "libsql",
  ],
};

export default nextConfig;
