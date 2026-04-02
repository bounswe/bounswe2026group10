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
  const methods = ["select", "ilike", "order"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

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
});
