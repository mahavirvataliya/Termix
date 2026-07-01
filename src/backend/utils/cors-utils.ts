import type { CorsOptions } from "cors";

/**
 * Default allowed origins for local development
 */
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

/**
 * Gets the list of allowed origins from environment variables and defaults
 */
export const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  if (envOrigins === "*") {
    return ["*"];
  }

  const origins = envOrigins.split(",").map((o) => o.trim());
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...origins])];
};

/**
 * Reusable CORS configuration
 */
export const getCorsOptions = (
  allowedHeaders: string[] = [
    "Content-Type",
    "Authorization",
    "User-Agent",
    "X-Electron-App",
    "Accept",
    "Origin",
  ],
): CorsOptions => {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = getAllowedOrigins();

      if (allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders,
  };
};
