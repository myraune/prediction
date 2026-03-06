import { createTokenHandler } from "@21st-sdk/nextjs/server";

export const POST = createTokenHandler({
  apiKey: process.env.AN_API_KEY!,
});
