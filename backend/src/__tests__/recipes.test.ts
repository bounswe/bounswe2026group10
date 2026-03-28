import request from "supertest";
import app from "../index.js";
import { supabase, createUserClient } from "../config/supabase.js";

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

describe("Recipe Endpoints (Creation & Publishing)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCommunityPayload = {
    dishVarietyId: 1,
    title: "Test Recipe",
    servingSize: 4,
    type: "community",
    ingredients: [{ ingredientId: 1, quantity: 1, unit: "cup" }],
    steps: [{ stepOrder: 1, description: "Mix" }],
  };

  const validCulturalPayload = {
    ...validCommunityPayload,
    type: "cultural",
  };

  const validIncompletePayload = {
    title: "Just a draft",
    type: "community",
  };

  // Centralized mock to handle profiles seamlessly.
  const setupMocks = (
    role: string,
    profileId = "profile-123",
    recipeFromMock?: (table: string) => any
  ) => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      // Always handle profiles
      if (table === "profiles") {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { id: profileId, username: "tester", role },
          error: null,
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      // Delegate to custom mock for other tables
      if (recipeFromMock) {
        return recipeFromMock(table);
      }
      return { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
    });
  };

  describe("POST /recipes", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/recipes").send(validCommunityPayload);
      expect(response.status).toBe(401);
    });

    it("should return 403 if user is a learner", async () => {
      setupMocks("learner");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCommunityPayload);
      
      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain("roles: cook, expert");
    });

    it("should return 403 if a cook tries to create a cultural recipe", async () => {
      setupMocks("cook");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCulturalPayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe("Cooks can only create community recipes.");
    });

    it("should return 400 for validation errors", async () => {
      setupMocks("cook");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send({ title: "hi" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 201 for valid expert creating cultural recipe", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCulturalPayload);

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe("cultural");
      expect(response.body.data.id).toBe("recipe-1");
    });

    it("should return 201 for valid incomplete draft", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-draft-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validIncompletePayload);

      expect(response.status).toBe(201);
      expect(response.body.data.dishVarietyId).toBeNull();
      expect(response.body.data.id).toBe("recipe-draft-1");
    });
  });

  describe("POST /recipes/:id/publish", () => {
    it("should return 404 if recipe not found", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(404);
    });

    it("should return 403 if not the creator", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { creator_id: "profile-999" }, // Recipe belongs to 999
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-222", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(403);
    });

    it("should return 400 if incomplete (no ingredients)", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: 1,
          serving_size: 4,
          recipe_ingredients: [], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain("1 ingredient");
    });

    it("should return 400 if incomplete (missing dishVarietyId)", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: null,
          serving_size: 4,
          recipe_ingredients: [{id: 1}], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain("dish variety");
    });

    it("should return 200 on successful publish", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: 1,
          serving_size: 4,
          recipe_ingredients: [{id: 1}], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEqForSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqForSelect });

      const mockEqForUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqForUpdate });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") {
          return { select: mockSelect, update: mockUpdate };
        }
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_published: true });
    });
  });

  describe("PATCH /recipes/:id", () => {
    it("should return 401 if unauthenticated", async () => {
      const response = await request(app).patch("/recipes/123").send({ title: "Updated" });
      expect(response.status).toBe(401);
    });

    it("should return 404 if recipe not found", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .patch("/recipes/123")
        .set("Authorization", "Bearer valid")
        .send({ title: "Updated" });

      expect(response.status).toBe(404);
    });

    it("should return 200 on successful update", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { creator_id: "profile-123", type: "community" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      // For delete
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // For insert
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect, update: mockUpdate };
        return { delete: mockDelete, insert: mockInsert };
      });

      const response = await request(app)
        .patch("/recipes/123")
        .set("Authorization", "Bearer valid")
        .send({ title: "Successfully Updated" });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain("updated successfully");
    });
  });
});
