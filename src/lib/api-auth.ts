import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export function generateApiKey(): string {
  return `vm_${crypto.randomBytes(24).toString("hex")}`;
}

export async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey || !apiKey.startsWith("vm_")) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true, email: true, name: true, role: true, balance: true },
  });

  return user;
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status, headers: API_HEADERS });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status, headers: API_HEADERS });
}

export const API_HEADERS = {
  "X-Powered-By": "Viking Market API v1",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};
