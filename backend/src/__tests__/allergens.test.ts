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
  const methods = ["select", "eq", "in", "order", "filter", "not", "single", "maybeSingle"];
  methods.forEach((m) => { mock[m] = jest.fn().mockReturnValue(mock); });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  return mock;
};

// ─── GET /allergens ───────────────────────────────────────────────────────────

describe("GET /allergens", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockAllergens = [
    { id: 1, name: "Celery" },
    { id: 2, name: "Dairy" },
    { id: 3, name: "Eggs" },
  ];

  it("returns full allergen list with 200", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockAllergens, error: null })
    );

    const res = await request(app).get("/allergens");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toMatchObject({ id: 1, name: "Celery" });
  });

  it("returns empty array when no allergens exist", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/allergens");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB failure" } })
    );

    const res = await request(app).get("/allergens");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── POST /allergens/detect ───────────────────────────────────────────────────

describe("POST /allergens/detect", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns deduplicated allergens for given ingredient IDs", async () => {
    const mockRows = [
      { allergen: { id: 1, name: "Gluten" } },
      { allergen: { id: 2, name: "Eggs" } },
      { allergen: { id: 1, name: "Gluten" } }, // duplicate — should be removed
    ];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app)
      .post("/allergens/detect")
      .send({ ingredientIds: [10, 11, 12] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((a: any) => a.name)).toEqual(
      expect.arrayContaining(["Gluten", "Eggs"])
    );
  });

  it("returns empty array when ingredients have no allergens", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app)
      .post("/allergens/detect")
      .send({ ingredientIds: [99] });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 400 when ingredientIds is missing", async () => {
    const res = await request(app)
      .post("/allergens/detect")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when ingredientIds is empty array", async () => {
    const res = await request(app)
      .post("/allergens/detect")
      .send({ ingredientIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB failure" } })
    );

    const res = await request(app)
      .post("/allergens/detect")
      .send({ ingredientIds: [1, 2] });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
