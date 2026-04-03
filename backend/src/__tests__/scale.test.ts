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

// ─── GET /recipes/:id/scale ───────────────────────────────────────────────────

describe("GET /recipes/:id/scale", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipeData = {
    id: "recipe-uuid-1",
    serving_size: 4,
    recipe_ingredients: [
      {
        id: 1,
        quantity: 500,
        unit: "g",
        ingredient: {
          id: 2,
          name: "Minced Meat",
          ingredient_allergens: [],
        },
      },
      {
        id: 2,
        quantity: 200,
        unit: "ml",
        ingredient: {
          id: 3,
          name: "Olive Oil",
          ingredient_allergens: [],
        },
      },
    ],
  };

  const setupMock = (data: any, error: any) => {
    const mockSingle = jest.fn().mockResolvedValue({ data, error });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes") return { select: mockSelect };
      return {};
    });
  };

  // ─── Happy path ───────────────────────────────────────────────────────────

  it("returns 200 with scaled quantities when doubling servings", async () => {
    setupMock(mockRecipeData, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=8");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipeId).toBe("recipe-uuid-1");
    expect(res.body.data.baseServings).toBe(4);
    expect(res.body.data.requestedServings).toBe(8);
    expect(res.body.data.ingredients[0].quantity).toBe(1000);
    expect(res.body.data.ingredients[1].quantity).toBe(400);
  });

  it("returns unchanged quantities when requested servings equal base servings", async () => {
    setupMock(mockRecipeData, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=4");

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].quantity).toBe(500);
    expect(res.body.data.ingredients[1].quantity).toBe(200);
  });

  it("returns halved quantities when halving servings", async () => {
    setupMock(mockRecipeData, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=2");

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].quantity).toBe(250);
    expect(res.body.data.ingredients[1].quantity).toBe(100);
  });

  it("returns quantity rounded to 2 decimal places", async () => {
    setupMock(
      {
        ...mockRecipeData,
        recipe_ingredients: [
          {
            id: 1,
            quantity: 100,
            unit: "g",
            ingredient: { id: 2, name: "Flour", ingredient_allergens: [] },
          },
        ],
      },
      null
    );

    // 100 * 3 / 4 = 75 (exact)
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=3");

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].quantity).toBe(75);
  });

  it("rounds non-integer scaled quantity to 2 decimal places", async () => {
    setupMock(
      {
        ...mockRecipeData,
        serving_size: 3,
        recipe_ingredients: [
          {
            id: 1,
            quantity: 100,
            unit: "g",
            ingredient: { id: 2, name: "Sugar", ingredient_allergens: [] },
          },
        ],
      },
      null
    );

    // 100 * 2 / 3 = 66.6666... → 66.67
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=2");

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].quantity).toBe(66.67);
  });

  it("preserves ingredient metadata (id, ingredientId, ingredientName, unit, allergens)", async () => {
    const dataWithAllergens = {
      ...mockRecipeData,
      recipe_ingredients: [
        {
          id: 5,
          quantity: 200,
          unit: "g",
          ingredient: {
            id: 7,
            name: "Wheat",
            ingredient_allergens: [{ allergen: { name: "gluten" } }],
          },
        },
      ],
    };
    setupMock(dataWithAllergens, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=8");

    expect(res.status).toBe(200);
    const ing = res.body.data.ingredients[0];
    expect(ing.id).toBe(5);
    expect(ing.ingredientId).toBe(7);
    expect(ing.ingredientName).toBe("Wheat");
    expect(ing.unit).toBe("g");
    expect(ing.allergens).toEqual(["gluten"]);
    expect(ing.quantity).toBe(400);
  });

  it("returns empty ingredients array when recipe has no ingredients", async () => {
    setupMock({ ...mockRecipeData, recipe_ingredients: [] }, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=8");

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients).toHaveLength(0);
  });

  it("handles null ingredient (freetext ingredient with no linked ingredient row)", async () => {
    setupMock(
      {
        ...mockRecipeData,
        recipe_ingredients: [
          {
            id: 9,
            quantity: 100,
            unit: "g",
            ingredient: null,
          },
        ],
      },
      null
    );

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=8");

    expect(res.status).toBe(200);
    const ing = res.body.data.ingredients[0];
    expect(ing.ingredientId).toBeNull();
    expect(ing.ingredientName).toBeNull();
    expect(ing.allergens).toEqual([]);
    expect(ing.quantity).toBe(200);
  });

  // ─── Validation errors ────────────────────────────────────────────────────

  it("returns 400 when servings param is missing", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is 0", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=0");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is negative", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=-2");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is a float", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=2.5");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is a non-numeric string", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings exceeds 1000", async () => {
    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=1001");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 NO_SERVING_SIZE when recipe has no base serving size", async () => {
    setupMock({ ...mockRecipeData, serving_size: null }, null);

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=4");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_SERVING_SIZE");
  });

  // ─── Not found / DB errors ────────────────────────────────────────────────

  it("returns 404 when recipe does not exist", async () => {
    setupMock(null, { code: "PGRST116", message: "Not found" });

    const res = await request(app).get("/recipes/nonexistent-uuid/scale?servings=4");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 on database error", async () => {
    setupMock(null, { code: "500", message: "DB timeout" });

    const res = await request(app).get("/recipes/recipe-uuid-1/scale?servings=4");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
