import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, generateApiKey, apiError, apiSuccess, API_HEADERS } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// GET /api/v1/me — Get current user info (API key auth)
export async function GET(request: NextRequest) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized. Provide a valid API key via Authorization: Bearer vm_...", 401);
  }

  return apiSuccess({
    id: user.id,
    email: user.email,
    name: user.name,
    balance: Math.round(user.balance * 100) / 100,
    role: user.role,
  });
}

// POST /api/v1/me — Generate or regenerate API key (session auth)
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Not authenticated. Login to the web app first.", 401);
  }

  const apiKey = generateApiKey();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKey },
  });

  return NextResponse.json(
    {
      data: {
        apiKey,
        message: "Save this key — it won't be shown again. Use it as: Authorization: Bearer " + apiKey,
      },
    },
    { status: 201, headers: API_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
