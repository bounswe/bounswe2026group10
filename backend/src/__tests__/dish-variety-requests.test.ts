import request from "supertest";
import app from "../index.js";
import { supabase, createUserClient } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: { auth: { getUser: jest.fn() }, from: mockFrom },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

const chainable = (resolved: { data: any; error: any; count?: number | null }) => {
  const mock: any = {};
  const methods = [
    "select", "eq", "neq", "in", "not", "or", "order",
    "range", "single", "maybeSingle", "ilike", "limit", "filter",
  ];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

function mockAuthAsRole(role: "expert" | "cook" | "learner", profileId = "p1") {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "u1", email: "e@e.com" } },
    error: null,
  });
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: profileId, username: "u", role },
          error: null,
        }),
      }),
    }),
  };
}

// ─── POST /dish-varieties/requests ────────────────────────────────────────────

describe("POST /dish-varieties/requests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without a token", async () => {
    const res = await request(app).post("/dish-varieties/requests").send({ genreId: 1, nameEn: "Börek" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-expert caller", async () => {
    const profileLookup = mockAuthAsRole("cook");
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      return {};
    });

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ genreId: 1, nameEn: "Börek" });

    expect(res.status).toBe(403);
  });

  it("returns 400 when genreId is missing", async () => {
    const profileLookup = mockAuthAsRole("expert");
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      return {};
    });

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ nameEn: "Börek" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when neither nameEn nor nameTr is provided", async () => {
    const profileLookup = mockAuthAsRole("expert");
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      return {};
    });

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ genreId: 1, descriptionEn: "A pastry" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when genre does not exist", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_genres") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ genreId: 999, nameEn: "Börek" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("creates a request with 201 on success", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_genres") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const insertedRow = {
      id: 1,
      genre_id: 1,
      name_en: "Börek",
      name_tr: "Börek",
      description_en: null,
      description_tr: null,
      status: "pending",
      created_at: "2026-01-01T00:00:00Z",
    };
    const mockUserClient = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: insertedRow, error: null }),
          }),
        }),
      }),
    };
    (createUserClient as jest.Mock).mockReturnValue(mockUserClient);

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ genreId: 1, nameEn: "Börek", nameTr: "Börek" });

    expect(res.status).toBe(201);
    expect(res.body.data.nameEn).toBe("Börek");
    expect(res.body.data.genreId).toBe(1);
    expect(res.body.data.status).toBe("pending");
  });

  it("returns 500 on DB insert error", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_genres") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const mockUserClient = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
          }),
        }),
      }),
    };
    (createUserClient as jest.Mock).mockReturnValue(mockUserClient);

    const res = await request(app)
      .post("/dish-varieties/requests")
      .set("Authorization", "Bearer t")
      .send({ genreId: 1, nameEn: "Börek" });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /dish-varieties/requests/me ──────────────────────────────────────────

describe("GET /dish-varieties/requests/me", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/dish-varieties/requests/me");
    expect(res.status).toBe(401);
  });

  it("returns own requests as an array with genreId field", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    const rows = [
      {
        id: 1,
        genre_id: 2,
        name_en: "Börek",
        name_tr: "Börek",
        description_en: null,
        description_tr: null,
        status: "pending",
        decision_note: null,
        created_at: "2026-01-01T00:00:00Z",
        decided_at: null,
      },
    ];

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_variety_requests")
        return chainable({ data: rows, error: null });
      return {};
    });

    const res = await request(app)
      .get("/dish-varieties/requests/me")
      .set("Authorization", "Bearer t");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nameEn).toBe("Börek");
    expect(res.body.data[0].genreId).toBe(2);
    expect(res.body.data[0].status).toBe("pending");
    expect(res.body.data[0].decisionNote).toBeNull();
  });

  it("returns empty array when user has no requests", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_variety_requests")
        return chainable({ data: [], error: null });
      return {};
    });

    const res = await request(app)
      .get("/dish-varieties/requests/me")
      .set("Authorization", "Bearer t");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 500 on DB error", async () => {
    const profileLookup = mockAuthAsRole("expert", "expert-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "dish_variety_requests")
        return chainable({ data: null, error: { message: "fail" } });
      return {};
    });

    const res = await request(app)
      .get("/dish-varieties/requests/me")
      .set("Authorization", "Bearer t");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
