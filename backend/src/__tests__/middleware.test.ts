import type { Request, Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

// Mock Supabase
jest.mock("../config/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should return 401 if missing Authorization header", async () => {
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if Invalid Token", async () => {
      mockReq.headers = { authorization: "Bearer invalid" };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: "invalid token" },
      });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user profile not found", async () => {
      mockReq.headers = { authorization: "Bearer valid_token" };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
        error: null,
      });

      // Chain mock for supabase.from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next() and populate req.user on success", async () => {
      mockReq.headers = { authorization: "Bearer valid_token" };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "prof-1", username: "testuser", role: "learner" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);
      
      const reqAssigned = mockReq as any;
      expect(reqAssigned.user).toBeDefined();
      expect(reqAssigned.user.userId).toBe("user-123");
      expect(reqAssigned.user.role).toBe("learner");
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should return 403 if user role is not allowed", () => {
      const req = { user: { role: "learner" } } as any;
      const mw = requireRole("cook", "expert");
      
      mw(req, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next() if user role is allowed", () => {
      const req = { user: { role: "cook" } } as any;
      const mw = requireRole("cook", "expert");
      
      mw(req, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
