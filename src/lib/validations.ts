import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const marketSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.enum(["POLITICS", "SPORTS", "CRYPTO", "CLIMATE", "ECONOMICS", "CULTURE", "COMPANIES", "FINANCIALS", "TECH_SCIENCE", "ENTERTAINMENT"]),
  closesAt: z.coerce.date({ error: "Closing date is required" }),
  featured: z.boolean().default(false),
});

export type MarketFormData = z.infer<typeof marketSchema>;

export const tradeSchema = z.object({
  marketId: z.string().min(1, "Market is required"),
  side: z.enum(["YES", "NO"]),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be positive")
    .max(500, "Maximum trade is 500 points"),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

export const resolveMarketSchema = z.object({
  marketId: z.string().min(1),
  resolution: z.enum(["YES", "NO"]),
  resolutionNote: z.string().max(500).optional(),
});

export type ResolveMarketData = z.infer<typeof resolveMarketSchema>;
