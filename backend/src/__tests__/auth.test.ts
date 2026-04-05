import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
      admin: {
        deleteUser: jest.fn().mockResolvedValue({}),
      },
    },
    from: jest.fn(),
  },
}));

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    const validPayload = {
      email: "test@example.com",
      password: "password123",
      username: "testuser",
      role: "learner",
    };

    it("should return 400 for invalid validation payload", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "not-an-email",
        password: "short",
        username: "tu",
        role: "invalid-role",
      });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 409 if username is taken", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: "123" } });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const response = await request(app).post("/auth/register").send(validPayload);
      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain("Username is already taken");
    });

    it("should return 201 on successful registration", async () => {
      // Mock existing profile check
      const mockSingle = jest.fn().mockResolvedValue({ data: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      
      // Mock profile insert
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          return { select: mockSelect, insert: mockInsert };
        }
        return {};
      });

      // Mock auth.signUp
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: "user-123", email: validPayload.email },
          session: { access_token: "access_123", refresh_token: "refresh_123" },
        },
        error: null,
      });

      const response = await request(app).post("/auth/register").send(validPayload);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(validPayload.username);
      expect(response.body.data.role).toBe(validPayload.role);
    });
  });

  describe("POST /auth/login", () => {
    it("should return 200 on successful login", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: { id: "user-123" },
          session: { access_token: "access_123", refresh_token: "refresh_123" },
        },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { username: "testuser", role: "cook" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe("access_123");
    });

    it("should return 401 on invalid credentials", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrong",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return 200 with new tokens", async () => {
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: {
          session: { access_token: "new_access", refresh_token: "new_refresh" },
        },
        error: null,
      });

      const response = await request(app).post("/auth/refresh").send({
        refreshToken: "old_refresh",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBe("new_access");
    });
  });

  describe("GET /auth/me", () => {
    it("should return user info when authenticated", async () => {
      // Mock auth middleware parts
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "prof-1", username: "testuser", role: "expert" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("expert");
      expect(response.body.data.username).toBe("testuser");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/auth/me");
      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /auth/profile ────────────────────────────────────────────────────

  describe("PATCH /auth/profile", () => {
    const setupAuthMiddleware = (callCount: { value: number }) => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });
      callCount.value = 0;
    };

    const authMiddlewareMock = () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "profile-123", username: "testuser", role: "cook" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
    };

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).patch("/auth/profile").send({ bio: "Hello" });
      expect(res.status).toBe(401);
    });

    it("returns 400 when body is empty", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });
      (supabase.from as jest.Mock).mockImplementation(() => authMiddlewareMock());

      const res = await request(app)
        .patch("/auth/profile")
        .set("Authorization", "Bearer valid_token")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 if new username is already taken", async () => {
      const callCount = { value: 0 };
      setupAuthMiddleware(callCount);

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          callCount.value++;
          if (callCount.value === 1) return authMiddlewareMock();
          // username conflict check — taken
          const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: "other-profile" }, error: null });
          const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
          return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
        }
        return {};
      });

      const res = await request(app)
        .patch("/auth/profile")
        .set("Authorization", "Bearer valid_token")
        .send({ username: "takenuser" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("returns 200 on success (no username change)", async () => {
      const callCount = { value: 0 };
      setupAuthMiddleware(callCount);

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          callCount.value++;
          if (callCount.value === 1) return authMiddlewareMock();
          // update call
          const mockSingle = jest.fn().mockResolvedValue({
            data: { id: "profile-123", username: "testuser", bio: "Hello world", avatar_url: null, preferred_language: null, region: null, updated_at: "2024-01-01" },
            error: null,
          });
          const mockEq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
          return { update: jest.fn().mockReturnValue({ eq: mockEq }) };
        }
        return {};
      });

      const res = await request(app)
        .patch("/auth/profile")
        .set("Authorization", "Bearer valid_token")
        .send({ bio: "Hello world" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe("Hello world");
    });

    it("returns 200 when updating username (not taken)", async () => {
      const callCount = { value: 0 };
      setupAuthMiddleware(callCount);

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          callCount.value++;
          if (callCount.value === 1) return authMiddlewareMock();
          if (callCount.value === 2) {
            // username conflict check — not taken
            const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
          }
          // update call
          const mockSingle = jest.fn().mockResolvedValue({
            data: { id: "profile-123", username: "newusername", bio: null, avatar_url: null, preferred_language: null, region: null, updated_at: "2024-01-01" },
            error: null,
          });
          const mockEq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
          return { update: jest.fn().mockReturnValue({ eq: mockEq }) };
        }
        return {};
      });

      const res = await request(app)
        .patch("/auth/profile")
        .set("Authorization", "Bearer valid_token")
        .send({ username: "newusername" });
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe("newusername");
    });

    it("returns 500 on db error during update", async () => {
      const callCount = { value: 0 };
      setupAuthMiddleware(callCount);

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "profiles") {
          callCount.value++;
          if (callCount.value === 1) return authMiddlewareMock();
          // update fails
          const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: "DB timeout" } });
          const mockEq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
          return { update: jest.fn().mockReturnValue({ eq: mockEq }) };
        }
        return {};
      });

      const res = await request(app)
        .patch("/auth/profile")
        .set("Authorization", "Bearer valid_token")
        .send({ bio: "Hello" });
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });
  });
});
