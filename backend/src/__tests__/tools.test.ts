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

describe("GET /tools", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns matching tools for a search query", async () => {
    const mockTools = [
      { name: "Frying Pan" },
      { name: "Saucepan" },
    ];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTools, error: null })
    );

    const res = await request(app).get("/tools?search=pan");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Frying Pan");
  });

  it("returns empty array when no tools match", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/tools?search=xyz");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns all tools when no search parameter is given", async () => {
    const all = [{ name: "Knife" }, { name: "Pot" }];
    const chain = chainable({ data: all, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/tools");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(chain.ilike).not.toHaveBeenCalled();
  });

  it("deduplicates tools with the same name", async () => {
    const mockTools = [
      { name: "Knife" },
      { name: "Knife" },
      { name: "Pot" },
    ];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockTools, error: null })
    );

    const res = await request(app).get("/tools");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/tools?search=pan");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
