import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      auth: { getUser: jest.fn() },
      from: mockFrom,
    },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const chainable = (resolved: { data: any; error: any }) => {
  const mock: any = {};
  const methods = ["select", "ilike", "or", "order"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

const setupCookAuth = (role = "cook") => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "auth-user-1" } },
    error: null,
  });

  let ingredientsCalls = 0;

  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === "profiles") {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.single = jest.fn().mockResolvedValue({
        data: { id: "profile-1", username: "cook1", role },
        error: null,
      });
      return chain;
    }
    if (table === "ingredients") {
      ingredientsCalls++;
      if (ingredientsCalls === 1) {
        // Duplicate check: .select().ilike().maybeSingle()
        const check: any = {};
        check.select = jest.fn().mockReturnValue(check);
        check.ilike = jest.fn().mockReturnValue(check);
        check.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        return check;
      }
      // Insert: .insert().select().single()
      const insert: any = {};
      insert.insert = jest.fn().mockReturnValue(insert);
      insert.select = jest.fn().mockReturnValue(insert);
      insert.single = jest.fn().mockResolvedValue({
        data: { id: 1, name: "salt", name_en: "Salt", name_tr: null },
        error: null,
      });
      return insert;
    }
    return {};
  });
};

const setupCookAuthWithDuplicate = () => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "auth-user-1" } },
    error: null,
  });

  let ingredientsCalls = 0;
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === "profiles") {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.single = jest.fn().mockResolvedValue({
        data: { id: "profile-1", username: "cook1", role: "cook" },
        error: null,
      });
      return chain;
    }
    if (table === "ingredients") {
      ingredientsCalls++;
      if (ingredientsCalls === 1) {
        const check: any = {};
        check.select = jest.fn().mockReturnValue(check);
        check.ilike = jest.fn().mockReturnValue(check);
        check.maybeSingle = jest.fn().mockResolvedValue({ data: { id: 1 }, error: null });
        return check;
      }
      return {};
    }
    return {};
  });
};

// ─── GET /ingredients (existing) ─────────────────────────────────────────────

describe("GET /ingredients", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns matching ingredients for a search query", async () => {
    const mockIngredients = [
      { id: 1, name: "Paprika" },
      { id: 2, name: "Parsley" },
    ];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockIngredients, error: null })
    );

    const res = await request(app).get("/ingredients?search=pa");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Paprika");
  });

  it("returns empty array when no ingredients match", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/ingredients?search=xyz");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns all ingredients when no search parameter is given", async () => {
    const all = [
      { id: 1, name: "Butter" },
      { id: 2, name: "Paprika" },
    ];
    const chain = chainable({ data: all, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/ingredients");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(chain.ilike).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/ingredients?search=pa");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  // Issue #402 — Turkish character handling in search.
  it("expands Turkish search input across name/name_en/name_tr with folded variants", async () => {
    const chain = chainable({
      data: [{ id: 1, name: "biber", name_en: "Pepper", name_tr: "Biber" }],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    // "biber" (no accents) should still match "Biber" via Turkish-aware ilike.
    const res = await request(app).get("/ingredients?search=biber");

    expect(res.status).toBe(200);
    expect(chain.or).toHaveBeenCalled();
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    // OR clause covers all three name columns and includes the lowercased input.
    expect(orArg).toContain("name.ilike.%biber%");
    expect(orArg).toContain("name_en.ilike.%biber%");
    expect(orArg).toContain("name_tr.ilike.%biber%");
  });

  it("handles Turkish dotted-i: 'ISTANBUL' search expands to both 'istanbul' and 'ıstanbul'", async () => {
    const chain = chainable({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/ingredients?search=ISTANBUL");

    expect(res.status).toBe(200);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    // Turkish-locale lowercase: I → ı; default lowercase: I → i. Both should appear.
    expect(orArg).toContain("ıstanbul");
    expect(orArg).toContain("istanbul");
  });
});

// ─── GET /ingredients — language fields (#412) ───────────────────────────────

describe("GET /ingredients — language fields (#412)", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockWithLangFields = [
    { id: 1, name: "salt", name_en: "Salt", name_tr: "Tuz" },
    { id: 2, name: "pepper", name_en: "Pepper", name_tr: "Biber" },
  ];

  it("returns name_en and name_tr fields in default response", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLangFields, error: null })
    );

    const res = await request(app).get("/ingredients");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name_en).toBe("Salt");
    expect(res.body.data[0].name_tr).toBe("Tuz");
  });

  it("?lang=en returns resolved name without name_en / name_tr fields", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLangFields, error: null })
    );

    const res = await request(app).get("/ingredients?lang=en");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Salt");
    expect(res.body.data[0].name_en).toBeUndefined();
    expect(res.body.data[0].name_tr).toBeUndefined();
  });

  it("?lang=tr returns resolved TR name", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLangFields, error: null })
    );

    const res = await request(app).get("/ingredients?lang=tr");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Tuz");
    expect(res.body.data[0].name_en).toBeUndefined();
  });

  it("?lang=tr falls back to name_en when name_tr is null", async () => {
    const noTr = [{ id: 1, name: "salt", name_en: "Salt", name_tr: null }];
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: noTr, error: null }));

    const res = await request(app).get("/ingredients?lang=tr");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Salt");
  });

  it("?lang=de returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/ingredients?lang=de");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─── POST /ingredients (#412) ────────────────────────────────────────────────

describe("POST /ingredients (#412)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when no token provided", async () => {
    const res = await request(app)
      .post("/ingredients")
      .send({ name_en: "Salt" });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has learner role", async () => {
    setupCookAuth("learner");

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({ name_en: "Salt" });

    expect(res.status).toBe(403);
  });

  it("returns 400 when neither name_en nor name_tr is provided", async () => {
    setupCookAuth();

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates ingredient with name_en only and returns 201", async () => {
    setupCookAuth();

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({ name_en: "Salt" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name_en).toBe("Salt");
  });

  it("creates ingredient with name_tr only and returns 201", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });

    let ingredientsCalls = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") {
        const chain: any = {};
        chain.select = jest.fn().mockReturnValue(chain);
        chain.eq = jest.fn().mockReturnValue(chain);
        chain.single = jest.fn().mockResolvedValue({
          data: { id: "profile-1", username: "cook1", role: "cook" },
          error: null,
        });
        return chain;
      }
      if (table === "ingredients") {
        ingredientsCalls++;
        if (ingredientsCalls === 1) {
          const check: any = {};
          check.select = jest.fn().mockReturnValue(check);
          check.ilike = jest.fn().mockReturnValue(check);
          check.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
          return check;
        }
        const insert: any = {};
        insert.insert = jest.fn().mockReturnValue(insert);
        insert.select = jest.fn().mockReturnValue(insert);
        insert.single = jest.fn().mockResolvedValue({
          data: { id: 2, name: "tuz", name_en: null, name_tr: "Tuz" },
          error: null,
        });
        return insert;
      }
      return {};
    });

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({ name_tr: "Tuz" });

    expect(res.status).toBe(201);
    expect(res.body.data.name_tr).toBe("Tuz");
  });

  it("creates ingredient with both name_en and name_tr and returns 201", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });

    let ingredientsCalls = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") {
        const chain: any = {};
        chain.select = jest.fn().mockReturnValue(chain);
        chain.eq = jest.fn().mockReturnValue(chain);
        chain.single = jest.fn().mockResolvedValue({
          data: { id: "profile-1", username: "cook1", role: "cook" },
          error: null,
        });
        return chain;
      }
      if (table === "ingredients") {
        ingredientsCalls++;
        if (ingredientsCalls === 1) {
          const check: any = {};
          check.select = jest.fn().mockReturnValue(check);
          check.ilike = jest.fn().mockReturnValue(check);
          check.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
          return check;
        }
        const insert: any = {};
        insert.insert = jest.fn().mockReturnValue(insert);
        insert.select = jest.fn().mockReturnValue(insert);
        insert.single = jest.fn().mockResolvedValue({
          data: { id: 3, name: "salt", name_en: "Salt", name_tr: "Tuz" },
          error: null,
        });
        return insert;
      }
      return {};
    });

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({ name_en: "Salt", name_tr: "Tuz" });

    expect(res.status).toBe(201);
    expect(res.body.data.name_en).toBe("Salt");
    expect(res.body.data.name_tr).toBe("Tuz");
  });

  it("returns 409 when ingredient with same name already exists", async () => {
    setupCookAuthWithDuplicate();

    const res = await request(app)
      .post("/ingredients")
      .set("Authorization", "Bearer test-token")
      .send({ name_en: "Salt" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });
});
