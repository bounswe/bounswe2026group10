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
