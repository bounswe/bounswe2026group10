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

// Chainable mock for simple thenable queries (list endpoints)
const chainable = (resolved: { data: any; error: any }) => {
  const mock: any = {};
  const methods = ["select", "eq", "order"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.maybeSingle = jest.fn().mockResolvedValue(resolved);
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

const mockIngredient = { id: 1, name: "salt" };
const mockSubstitutions = [
  {
    source_amount: 1,
    source_unit: "gr",
    sub_amount: 2,
    sub_unit: "ml",
    confidence: 0.9,
    description: "Use lemon juice instead of salt.",
    substitute: { id: 2, name: "lemon juice" },
  },
];

describe("GET /ingredients/:id/substitutions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns substitutes with base amounts when no amount param given", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: mockIngredient, error: null }))
      .mockReturnValueOnce(chainable({ data: mockSubstitutions, error: null }));

    const res = await request(app).get("/ingredients/1/substitutions");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].amount).toBe(2);
    expect(res.body.data[0].unit).toBe("ml");
    expect(res.body.data[0].ingredient.name).toBe("lemon juice");
  });

  it("calculates sub amount when amount and unit are provided", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: mockIngredient, error: null }))
      .mockReturnValueOnce(chainable({ data: mockSubstitutions, error: null }));

    // 4 gr salt → (4/1) × 2 = 8 ml lemon juice
    const res = await request(app).get("/ingredients/1/substitutions?amount=4&unit=gr");

    expect(res.status).toBe(200);
    expect(res.body.data[0].amount).toBe(8);
    expect(res.body.data[0].unit).toBe("ml");
  });

  it("returns empty array when ingredient has no substitutions", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: mockIngredient, error: null }))
      .mockReturnValueOnce(chainable({ data: [], error: null }));

    const res = await request(app).get("/ingredients/1/substitutions");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 404 when ingredient does not exist", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: null, error: null }));

    const res = await request(app).get("/ingredients/999/substitutions");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for non-numeric ingredient id", async () => {
    const res = await request(app).get("/ingredients/abc/substitutions");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when amount is not a positive number", async () => {
    const res = await request(app).get("/ingredients/1/substitutions?amount=-5&unit=gr");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 on ingredient lookup DB error", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: null, error: { message: "DB connection failed" } }));

    const res = await request(app).get("/ingredients/1/substitutions");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 on substitutions DB error", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(chainable({ data: mockIngredient, error: null }))
      .mockReturnValueOnce(chainable({ data: null, error: { message: "Query failed" } }));

    const res = await request(app).get("/ingredients/1/substitutions");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
