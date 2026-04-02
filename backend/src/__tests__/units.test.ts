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

describe("GET /units", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns matching units for a search query", async () => {
    const mockUnits = [{ unit: "gram" }, { unit: "grains" }];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockUnits, error: null })
    );

    const res = await request(app).get("/units?search=gr");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].unit).toBe("gram");
  });

  it("returns empty array when no units match", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/units?search=xyz");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns all units when no search parameter is given", async () => {
    const all = [{ unit: "cup" }, { unit: "gram" }];
    const chain = chainable({ data: all, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/units");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(chain.ilike).not.toHaveBeenCalled();
  });

  it("deduplicates units with the same value", async () => {
    const mockUnits = [{ unit: "gram" }, { unit: "gram" }, { unit: "kg" }];

    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockUnits, error: null })
    );

    const res = await request(app).get("/units");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/units?search=gr");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
