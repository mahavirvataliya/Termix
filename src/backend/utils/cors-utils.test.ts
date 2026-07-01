import { getAllowedOrigins, getCorsOptions } from "./cors-utils.ts";
import assert from "node:assert";
import { test } from "node:test";

test("getAllowedOrigins returns default origins when env is not set", () => {
  const originalEnv = process.env.ALLOWED_ORIGINS;
  delete process.env.ALLOWED_ORIGINS;

  const origins = getAllowedOrigins();
  assert.ok(origins.includes("http://localhost:5173"));
  assert.ok(origins.includes("http://localhost:3000"));

  process.env.ALLOWED_ORIGINS = originalEnv;
});

test("getAllowedOrigins includes env origins", () => {
  const originalEnv = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "https://myapp.com,https://another.com";

  const origins = getAllowedOrigins();
  assert.ok(origins.includes("https://myapp.com"));
  assert.ok(origins.includes("https://another.com"));
  assert.ok(origins.includes("http://localhost:5173"));

  process.env.ALLOWED_ORIGINS = originalEnv;
});

test("getAllowedOrigins handles wildcard", () => {
  const originalEnv = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "*";

  const origins = getAllowedOrigins();
  assert.deepStrictEqual(origins, ["*"]);

  process.env.ALLOWED_ORIGINS = originalEnv;
});

test("getCorsOptions validates origins correctly", () => {
  const options = getCorsOptions();
  const originCallback = options.origin as (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;

  // Should allow undefined origin (non-browser requests)
  originCallback(undefined, (err, allow) => {
    assert.strictEqual(err, null);
    assert.strictEqual(allow, true);
  });

  // Should allow default origins
  originCallback("http://localhost:5173", (err, allow) => {
    assert.strictEqual(err, null);
    assert.strictEqual(allow, true);
  });

  // Should NOT allow permissive prefix matches
  originCallback("https://evil.com", (err, allow) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, "Not allowed by CORS");
  });

  originCallback("http://malicious.org", (err, allow) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, "Not allowed by CORS");
  });
});
