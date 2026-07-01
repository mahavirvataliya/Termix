import { it, describe } from "node:test";
import assert from "node:assert";
import { detectPlatform, parseUserAgent } from "./user-agent-parser.ts";
import type { Request } from "express";

describe("user-agent-parser", () => {
  describe("detectPlatform", () => {
    it("should return desktop when x-electron-app header is true", () => {
      const req = {
        headers: {
          "x-electron-app": "true",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      } as unknown as Request;
      assert.strictEqual(detectPlatform(req), "desktop");
    });

    it("should return desktop when User-Agent includes Termix-Desktop", () => {
      const req = {
        headers: {
          "user-agent": "Termix-Desktop/1.0.0 (Windows)"
        }
      } as unknown as Request;
      assert.strictEqual(detectPlatform(req), "desktop");
    });

    it("should return mobile when User-Agent includes Termix-Mobile", () => {
      const req = {
        headers: {
          "user-agent": "Termix-Mobile/Android 1.0.0"
        }
      } as unknown as Request;
      assert.strictEqual(detectPlatform(req), "mobile");
    });

    it("should return mobile when User-Agent includes Android", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
        }
      } as unknown as Request;
      assert.strictEqual(detectPlatform(req), "mobile");
    });

    it("should return web by default", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      } as unknown as Request;
      assert.strictEqual(detectPlatform(req), "web");
    });

    it("should handle missing user-agent and return web", () => {
        const req = {
          headers: {}
        } as unknown as Request;
        assert.strictEqual(detectPlatform(req), "web");
      });
  });

  describe("parseUserAgent", () => {
    describe("Desktop", () => {
      it("should parse custom Termix-Desktop User-Agent", () => {
        const req = {
          headers: {
            "user-agent": "Termix-Desktop/1.2.3 (macOS 15)"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "desktop");
        assert.strictEqual(result.version, "1.2.3");
        assert.strictEqual(result.os, "macOS 15");
        assert.strictEqual(result.browser, "Termix Desktop");
      });

      it("should parse Electron on Windows", () => {
        const req = {
          headers: {
            "x-electron-app": "true",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Termix-Desktop/1.0.0 Chrome/120.0.6099.144 Electron/30.0.0 Safari/537.36"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "desktop");
        assert.strictEqual(result.version, "30.0.0");
        assert.strictEqual(result.os, "Windows 10/11");
        assert.strictEqual(result.browser, "Termix Desktop");
      });

      it("should parse Electron on Mac OS X", () => {
          const req = {
            headers: {
              "x-electron-app": "true",
              "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Termix-Desktop/1.0.0 Chrome/120.0.6099.144 Electron/30.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.type, "desktop");
          assert.strictEqual(result.version, "30.0.0");
          assert.strictEqual(result.os, "macOS 10.15");
      });

      it("should parse Electron on Linux", () => {
          const req = {
            headers: {
              "x-electron-app": "true",
              "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Termix-Desktop/1.0.0 Chrome/120.0.6099.144 Electron/30.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.type, "desktop");
          assert.strictEqual(result.os, "Linux");
      });
    });

    describe("Mobile", () => {
      it("should parse custom Termix-Mobile Android UA", () => {
        const req = {
          headers: {
            "user-agent": "Termix-Mobile/Android 1.5.0 (Android 14)"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "mobile");
        assert.strictEqual(result.version, "1.5.0");
        assert.strictEqual(result.os, "Android 14");
      });

      it("should parse custom Termix-Mobile iOS UA", () => {
          const req = {
            headers: {
              "user-agent": "Termix-Mobile/iOS 1.5.0 (OS 16_5)"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.type, "mobile");
          assert.strictEqual(result.version, "1.5.0");
          assert.strictEqual(result.os, "iOS 16.5");
      });

      it("should parse generic iPhone User-Agent", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "mobile");
        assert.strictEqual(result.os, "iOS 16.5");
      });

      it("should parse generic Android User-Agent", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.type, "mobile");
          assert.strictEqual(result.os, "Android 14");
      });
    });

    describe("Web", () => {
      it("should parse Chrome on Linux", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "web");
        assert.strictEqual(result.browser, "Chrome");
        assert.strictEqual(result.version, "120.0");
        assert.strictEqual(result.os, "Linux");
      });

      it("should parse Edge on Windows 8.1", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "web");
        assert.strictEqual(result.browser, "Edge");
        assert.strictEqual(result.version, "120.0");
        assert.strictEqual(result.os, "Windows 8.1");
      });

      it("should parse Firefox on macOS Mojave", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:109.0) Gecko/20100101 Firefox/115.0"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "web");
        assert.strictEqual(result.browser, "Firefox");
        assert.strictEqual(result.version, "115.0");
        assert.strictEqual(result.os, "macOS Mojave");
      });

      it("should parse Safari on macOS 10.15", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "web");
        assert.strictEqual(result.browser, "Safari");
        assert.strictEqual(result.version, "16.5");
        assert.strictEqual(result.os, "macOS 10.15");
      });

      it("should parse Opera on Windows 7", () => {
        const req = {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0"
          }
        } as unknown as Request;
        const result = parseUserAgent(req);
        assert.strictEqual(result.type, "web");
        assert.strictEqual(result.browser, "Opera");
        assert.strictEqual(result.version, "106.0");
        assert.strictEqual(result.os, "Windows 7");
      });

      it("should parse Windows 10/11", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "Windows 10/11");
      });

      it("should parse Windows 8", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "Windows 8");
      });

      it("should parse Windows Vista", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Windows NT 6.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "Windows Vista");
      });

      it("should parse Windows XP", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "Windows XP");
      });

      it("should parse macOS High Sierra", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:109.0) Gecko/20100101 Firefox/115.0"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "macOS High Sierra");
      });

      it("should parse macOS Sierra", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:109.0) Gecko/20100101 Firefox/115.0"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "macOS Sierra");
      });

      it("should parse macOS 11+", () => {
          const req = {
            headers: {
              "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          } as unknown as Request;
          const result = parseUserAgent(req);
          assert.strictEqual(result.os, "macOS 11");
      });
    });
  });
});
