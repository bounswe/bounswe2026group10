import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: { from: mockFrom },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

const chainable = (resolved: { data: any; error: any }) => {
  const mock: any = {};
  const methods = ["select", "eq", "order", "single"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

// ─── GET /dietary-tags (existing) ────────────────────────────────────────────

describe("GET /dietary-tags", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all dietary tags with 200", async () => {
    const mockTags = [
      { id: 1, name: "Halal", category: "dietary" },
      { id: 2, name: "Vegan", category: "dietary" },
      { id: 3, name: "Gluten-Free", category: "allergen" },
    ];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTags, error: null })
    );

    const res = await request(app).get("/dietary-tags");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].name).toBe("Halal");
    expect(res.body.data[2].category).toBe("allergen");
  });

  it("returns empty array when no tags exist", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/dietary-tags");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/dietary-tags");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /dietary-tags — language fields (#412) ──────────────────────────────

describe("GET /dietary-tags — language fields (#412)", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockTagsWithLang = [
    { id: 1, name: "Halal", name_en: "Halal", name_tr: "Helal", category: "dietary" },
    { id: 2, name: "Vegan", name_en: "Vegan", name_tr: null, category: "dietary" },
  ];

  it("returns name_en and name_tr in default response", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTagsWithLang, error: null })
    );

    const res = await request(app).get("/dietary-tags");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name_en).toBe("Halal");
    expect(res.body.data[0].name_tr).toBe("Helal");
    expect(res.body.data[0].category).toBe("dietary");
  });

  it("?lang=en returns resolved EN name without _en / _tr fields", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTagsWithLang, error: null })
    );

    const res = await request(app).get("/dietary-tags?lang=en");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Halal");
    expect(res.body.data[0].name_en).toBeUndefined();
    expect(res.body.data[0].name_tr).toBeUndefined();
    expect(res.body.data[0].category).toBe("dietary");
  });

  it("?lang=tr returns resolved TR name and falls back to EN when TR is null", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTagsWithLang, error: null })
    );

    const res = await request(app).get("/dietary-tags?lang=tr");

    expect(res.status).toBe(200);
    // First tag has TR name
    expect(res.body.data[0].name).toBe("Helal");
    // Second tag has no TR name → falls back to EN
    expect(res.body.data[1].name).toBe("Vegan");
  });

  it("?lang=de returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/dietary-tags?lang=de");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
