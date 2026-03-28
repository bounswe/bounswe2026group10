import request from "supertest";
import app from "../index.js";
import { supabase, createUserClient } from "../config/supabase.js";

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockStorageFrom = jest.fn();

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  const mockStorageFrom = jest.fn();

  return {
    supabase: {
      auth: { getUser: jest.fn() },
      from: mockFrom,
    },
    createUserClient: jest.fn(() => ({
      from: mockFrom,
      storage: { from: mockStorageFrom },
    })),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setupAuth = (role: string, profileId = "profile-123") => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  });

  (supabase.from as jest.Mock).mockImplementation((table) => {
    if (table === "profiles") {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: profileId, username: "tester", role },
        error: null,
      });
      return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingle }) }) };
    }
    return {};
  });
};

const setupStorage = (uploadError: any = null) => {
  const mockGetPublicUrl = jest.fn().mockReturnValue({
    data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/media/images/test.jpg" },
  });
  const mockUpload = jest.fn().mockResolvedValue({ error: uploadError });
  mockStorageFrom.mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl });

  // Apply to the createUserClient mock's storage
  (createUserClient as jest.Mock).mockImplementation(() => ({
    from: supabase.from,
    storage: { from: mockStorageFrom },
  }));

  return { mockUpload, mockGetPublicUrl };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Media Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /media/upload ──────────────────────────────────────────────────────

  describe("POST /media/upload", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/media/upload");
      expect(response.status).toBe(401);
    });

    it("should return 403 if user is a learner", async () => {
      setupAuth("learner");
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token");
      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain("roles: cook, expert");
    });

    it("should return 400 if no file is provided", async () => {
      setupAuth("cook");
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token");
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("MISSING_FILE");
    });

    it("should return 400 for invalid file type", async () => {
      setupAuth("cook");
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token")
        .attach("file", Buffer.from("fake pdf content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("should return 400 if image exceeds 10MB", async () => {
      setupAuth("cook");
      const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token")
        .attach("file", oversizedBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg",
        });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("FILE_TOO_LARGE");
    });

    it("should return 201 on successful image upload", async () => {
      setupAuth("cook");
      setupStorage();
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token")
        .attach("file", Buffer.from("fake image data"), {
          filename: "photo.jpg",
          contentType: "image/jpeg",
        });
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe("image");
      expect(response.body.data.url).toContain("supabase.co");
    });

    it("should return 201 on successful video upload", async () => {
      setupAuth("expert");
      setupStorage();
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token")
        .attach("file", Buffer.from("fake video data"), {
          filename: "video.mp4",
          contentType: "video/mp4",
        });
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe("video");
    });

    it("should return 500 if Supabase Storage upload fails", async () => {
      setupAuth("cook");
      setupStorage({ message: "Storage error" });
      const response = await request(app)
        .post("/media/upload")
        .set("Authorization", "Bearer valid_token")
        .attach("file", Buffer.from("fake image"), {
          filename: "photo.jpg",
          contentType: "image/jpeg",
        });
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("UPLOAD_FAILED");
    });
  });

  // ── POST /recipes/:id/media ─────────────────────────────────────────────────

  describe("POST /recipes/:id/media", () => {
    const validBody = {
      url: "https://example.supabase.co/storage/v1/object/public/media/images/test.jpg",
      type: "image",
    };

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/recipes/recipe-1/media").send(validBody);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid body", async () => {
      setupAuth("cook");
      const response = await request(app)
        .post("/recipes/recipe-1/media")
        .set("Authorization", "Bearer valid_token")
        .send({ url: "not-a-url", type: "image" });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 if recipe not found", async () => {
      setupAuth("cook");
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "profile-123", username: "tester", role: "cook" }, error: null }) }) }) };
        }
        if (table === "recipes") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }) }) }) };
        }
        return {};
      });
      const response = await request(app)
        .post("/recipes/nonexistent/media")
        .set("Authorization", "Bearer valid_token")
        .send(validBody);
      expect(response.status).toBe(404);
    });

    it("should return 403 if not the recipe creator", async () => {
      setupAuth("cook", "profile-123");
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "profile-123", username: "tester", role: "cook" }, error: null }) }) }) };
        }
        if (table === "recipes") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "recipe-1", creator_id: "profile-999" }, error: null }) }) }) };
        }
        return {};
      });
      const response = await request(app)
        .post("/recipes/recipe-1/media")
        .set("Authorization", "Bearer valid_token")
        .send(validBody);
      expect(response.status).toBe(403);
    });

    it("should return 201 on successful media attachment", async () => {
      // recipes SELECT chain: select().eq().single()
      const mockRecipeSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-1", creator_id: "profile-123" }, error: null,
      });
      const mockRecipeSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: mockRecipeSingle }),
      });

      // recipe_media INSERT chain: insert().select().single()
      const mockMediaSingle = jest.fn().mockResolvedValue({
        data: { id: 1, url: validBody.url, type: "image", created_at: "2026-01-01" }, error: null,
      });
      const mockMediaInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: mockMediaSingle }),
      });

      setupAuth("cook", "profile-123");
      (createUserClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          if (table === "recipes") return { select: mockRecipeSelect };
          if (table === "recipe_media") return { insert: mockMediaInsert };
          return {};
        }),
        storage: { from: mockStorageFrom },
      });

      const response = await request(app)
        .post("/recipes/recipe-1/media")
        .set("Authorization", "Bearer valid_token")
        .send(validBody);
      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe("image");
    });
  });

  // ── GET /recipes/:id/media ──────────────────────────────────────────────────

  describe("GET /recipes/:id/media", () => {
    it("should return 200 with media array (public endpoint)", async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: [
          { id: 1, url: "https://example.com/photo.jpg", type: "image", created_at: "2026-01-01" },
        ],
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const response = await request(app).get("/recipes/recipe-1/media");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 200 with empty array if no media", async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const response = await request(app).get("/recipes/recipe-1/media");
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ── DELETE /recipes/:id/media/:mediaId ──────────────────────────────────────

  describe("DELETE /recipes/:id/media/:mediaId", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).delete("/recipes/recipe-1/media/1");
      expect(response.status).toBe(401);
    });

    it("should return 404 if recipe not found", async () => {
      setupAuth("cook");
      (createUserClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          if (table === "recipes") {
            return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }) }) }) };
          }
          return {};
        }),
        storage: { from: mockStorageFrom },
      });
      const response = await request(app)
        .delete("/recipes/nonexistent/media/1")
        .set("Authorization", "Bearer valid_token");
      expect(response.status).toBe(404);
    });

    it("should return 403 if not the recipe creator", async () => {
      setupAuth("cook", "profile-123");
      (createUserClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          if (table === "recipes") {
            return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "recipe-1", creator_id: "profile-999" }, error: null }) }) }) };
          }
          return {};
        }),
        storage: { from: mockStorageFrom },
      });
      const response = await request(app)
        .delete("/recipes/recipe-1/media/1")
        .set("Authorization", "Bearer valid_token");
      expect(response.status).toBe(403);
    });

    it("should return 204 on successful delete", async () => {
      setupAuth("cook", "profile-123");
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockEqForDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEqForDelete });

      (createUserClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          if (table === "recipes") {
            return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null }) }) }) };
          }
          if (table === "recipe_media") return { delete: mockDelete };
          return {};
        }),
        storage: { from: mockStorageFrom },
      });

      const response = await request(app)
        .delete("/recipes/recipe-1/media/1")
        .set("Authorization", "Bearer valid_token");
      expect(response.status).toBe(204);
    });
  });
});
