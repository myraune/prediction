"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { STARTING_BALANCE } from "@/lib/constants";

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      balance: STARTING_BALANCE,
    },
  });

  return { success: true };
}
