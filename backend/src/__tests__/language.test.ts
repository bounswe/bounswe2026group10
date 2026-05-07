/**
 * Tests for detectLanguage middleware (src/middleware/language.ts).
 *
 * Strategy: mount the middleware on a minimal Express app with a probe route
 * that echoes req.lang back as JSON, then assert the resolved value.
 */

import express from "express";
import request from "supertest";
import { detectLanguage } from "../middleware/language.js";

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = express();
app.use(detectLanguage);
app.get("/probe", (req, res) => {
  res.json({ lang: (req as any).lang });
});

// ─── ?lang= query param ───────────────────────────────────────────────────────

describe("detectLanguage middleware — ?lang= query param", () => {
  it("sets req.lang to 'tr' for ?lang=tr", async () => {
    const res = await request(app).get("/probe?lang=tr");
    expect(res.body.lang).toBe("tr");
  });

  it("sets req.lang to 'en' for ?lang=en", async () => {
    const res = await request(app).get("/probe?lang=en");
    expect(res.body.lang).toBe("en");
  });

  it("accepts uppercase ?lang=TR and normalises to 'tr'", async () => {
    const res = await request(app).get("/probe?lang=TR");
    expect(res.body.lang).toBe("tr");
  });

  it("accepts uppercase ?lang=EN and normalises to 'en'", async () => {
    const res = await request(app).get("/probe?lang=EN");
    expect(res.body.lang).toBe("en");
  });

  it("defaults to 'en' for an invalid ?lang= value", async () => {
    const res = await request(app).get("/probe?lang=de");
    expect(res.body.lang).toBe("en");
  });

  it("defaults to 'en' for ?lang=xyz (arbitrary string)", async () => {
    const res = await request(app).get("/probe?lang=xyz");
    expect(res.body.lang).toBe("en");
  });

  it("?lang= takes priority over Accept-Language header", async () => {
    const res = await request(app)
      .get("/probe?lang=en")
      .set("Accept-Language", "tr-TR,tr;q=0.9");
    expect(res.body.lang).toBe("en");
  });
});

// ─── Accept-Language header ───────────────────────────────────────────────────

describe("detectLanguage middleware — Accept-Language header", () => {
  it("sets req.lang to 'tr' for Accept-Language: tr", async () => {
    const res = await request(app).get("/probe").set("Accept-Language", "tr");
    expect(res.body.lang).toBe("tr");
  });

  it("sets req.lang to 'tr' for Accept-Language: tr-TR,tr;q=0.9", async () => {
    const res = await request(app).get("/probe").set("Accept-Language", "tr-TR,tr;q=0.9");
    expect(res.body.lang).toBe("tr");
  });

  it("sets req.lang to 'en' for Accept-Language: en-US", async () => {
    const res = await request(app).get("/probe").set("Accept-Language", "en-US,en;q=0.9");
    expect(res.body.lang).toBe("en");
  });

  it("defaults to 'en' for unsupported Accept-Language (de-DE)", async () => {
    const res = await request(app).get("/probe").set("Accept-Language", "de-DE,de;q=0.9");
    expect(res.body.lang).toBe("en");
  });

  it("defaults to 'en' for Accept-Language: fr", async () => {
    const res = await request(app).get("/probe").set("Accept-Language", "fr");
    expect(res.body.lang).toBe("en");
  });
});

// ─── No language preference ───────────────────────────────────────────────────

describe("detectLanguage middleware — no language preference", () => {
  it("sets req.lang to null when neither ?lang= nor Accept-Language is provided", async () => {
    const res = await request(app).get("/probe");
    expect(res.body.lang).toBeNull();
  });
});
