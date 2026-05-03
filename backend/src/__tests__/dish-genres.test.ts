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
  const methods = ["select", "eq", "order"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockGenres = [
  {
    id: 1,
    name: "Kebap",
    name_en: "Kebab",
    name_tr: "Kebap",
    description: "Grilled meat dishes",
    description_en: "Grilled meat dishes",
    description_tr: "Izgara et yemekleri",
  },
  {
    id: 2,
    name: "Çorba",
    name_en: "Soup",
    name_tr: "Çorba",
    description: "Soup dishes",
    description_en: "Soup dishes",
    description_tr: null,
  },
];

const mockVarieties = [
  { id: 1, genre_id: 1, name: "Adana Kebap", name_en: "Adana Kebab", name_tr: "Adana Kebap" },
  { id: 2, genre_id: 2, name: "Mercimek", name_en: "Lentil Soup", name_tr: null },
];

const setupGenreMock = (genreData: any, varietyData: any) => {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === "dish_genres") return chainable({ data: genreData, error: null });
    if (table === "dish_varieties") return chainable({ data: varietyData, error: null });
    return chainable({ data: null, error: null });
  });
};

// ─── GET /dish-genres ─────────────────────────────────────────────────────────

describe("GET /dish-genres", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all genres with nested varieties", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].varieties).toHaveLength(1);
    expect(res.body.data[0].varieties[0].name).toBe("Adana Kebap");
    expect(res.body.data[1].varieties).toHaveLength(1);
  });

  it("returns name_en, name_tr, description_en, description_tr per genre", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    const genre = res.body.data[0];
    expect(genre.name_en).toBe("Kebab");
    expect(genre.name_tr).toBe("Kebap");
    expect(genre.description_en).toBe("Grilled meat dishes");
    expect(genre.description_tr).toBe("Izgara et yemekleri");
  });

  it("nested varieties include name_en and name_tr", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    const variety = res.body.data[0].varieties[0];
    expect(variety.name_en).toBe("Adana Kebab");
    expect(variety.name_tr).toBe("Adana Kebap");
  });

  it("returns empty varieties array when genre has none", async () => {
    setupGenreMock(mockGenres, []);

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    expect(res.body.data[0].varieties).toHaveLength(0);
  });

  it("returns 500 when genre query fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "dish_genres") return chainable({ data: null, error: { message: "DB error" } });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 when variety query fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "dish_genres") return chainable({ data: mockGenres, error: null });
      if (table === "dish_varieties") return chainable({ data: null, error: { message: "DB error" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /dish-genres — language fields (#412) ───────────────────────────────

describe("GET /dish-genres — language fields (#412)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("?lang=en returns resolved EN names and descriptions", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres?lang=en");

    expect(res.status).toBe(200);
    const genre = res.body.data[0];
    expect(genre.name).toBe("Kebab");
    expect(genre.description).toBe("Grilled meat dishes");
    expect(genre.name_en).toBeUndefined();
    expect(genre.name_tr).toBeUndefined();
    expect(genre.varieties[0].name).toBe("Adana Kebab");
    expect(genre.varieties[0].name_en).toBeUndefined();
  });

  it("?lang=tr returns resolved TR names and descriptions", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres?lang=tr");

    expect(res.status).toBe(200);
    const genre = res.body.data[0];
    expect(genre.name).toBe("Kebap");
    expect(genre.description).toBe("Izgara et yemekleri");
    expect(genre.varieties[0].name).toBe("Adana Kebap");
  });

  it("?lang=tr falls back to EN when TR fields are null", async () => {
    setupGenreMock(mockGenres, mockVarieties);

    const res = await request(app).get("/dish-genres?lang=tr");

    expect(res.status).toBe(200);
    // Soup genre: description_tr is null → falls back to description_en
    const soup = res.body.data[1];
    expect(soup.description).toBe("Soup dishes");
    // Mercimek variety: name_tr is null → falls back to name_en
    expect(soup.varieties[0].name).toBe("Lentil Soup");
  });

  it("?lang=de returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/dish-genres?lang=de");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
