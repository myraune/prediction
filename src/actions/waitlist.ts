"use server";

import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validations";

export async function joinWaitlist(data: { email: string; name?: string; source?: string }) {
  const parsed = waitlistSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const name = parsed.data.name?.trim() || null;

  try {
    // Check if already signed up
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email },
    });

    if (existing) {
      const position = await prisma.waitlistEntry.count({
        where: { createdAt: { lte: existing.createdAt } },
      });
      return { success: true, position, alreadyExists: true };
    }

    // Create new entry
    const entry = await prisma.waitlistEntry.create({
      data: { email, name, source: data.source ?? "waitlist" },
    });

    const position = await prisma.waitlistEntry.count({
      where: { createdAt: { lte: entry.createdAt } },
    });

    return { success: true, position, alreadyExists: false };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
