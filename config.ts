// config.ts
// Update these env vars in .env (local) or Vercel dashboard (production)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://nonsequential-noncollapsable-hadley.ngrok-free.dev";

export const DIET_API_URL =
  process.env.EXPO_PUBLIC_DIET_API_URL ?? "http://localhost:5001";
