import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
  // Admin write paths use this client (service-role bypasses RLS).
  supabaseAdmin: {
    from: jest.fn(),
  },
  createUserClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { supabaseAdmin } = require("../config/supabase.js") as {
  supabaseAdmin: { from: jest.Mock };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mock the auth lookup that requireAuth performs (auth.getUser + profiles select). */
function mockAuthAs(role: "learner" | "cook" | "expert" | "admin", profileId = "admin-prof") {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "auth-user-1", email: "x@y.com" } },
    error: null,
  });

  // First .from("profiles") in requireAuth: profile lookup.
  // Subsequent .from() calls in the route are configured per-test.
  const profileLookup = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest
          .fn()
          .mockResolvedValue({ data: { id: profileId, username: "u", role }, error: null }),
      }),
    }),
  };
  return profileLookup;
}

// ─── /admin guard ─────────────────────────────────────────────────────────────

describe("Admin guard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 403 for a non-admin caller", async () => {
    const profileLookup = mockAuthAs("expert");
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      return {};
    });

    const res = await request(app)
      .get("/admin/expert-requests")
      .set("Authorization", "Bearer t");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 401 without a Bearer token", async () => {
    const res = await request(app).get("/admin/expert-requests");
    expect(res.status).toBe(401);
  });
});

// ─── Expert request approve / reject ──────────────────────────────────────────

describe("Admin expert-requests approve/reject", () => {
  beforeEach(() => jest.clearAllMocks());

  it("approves a pending request and promotes the applicant to expert", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    // expert_requests select for status check (anon client — only reads use it).
    const mockReqSelectSingle = jest.fn().mockResolvedValue({
      data: { id: "req-1", user_id: "applicant-1", status: "pending" },
      error: null,
    });
    const mockReqSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle: mockReqSelectSingle }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") {
        return profileLookup; // requireAuth
      }
      if (table === "expert_requests") {
        return { select: mockReqSelect };
      }
      return {};
    });

    // Admin client: profile promotion (.update().eq().neq().select().maybeSingle())
    // returns the promoted row, then expert_requests .update().eq() succeeds.
    const mockPromoteMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: "applicant-1", role: "expert" }, error: null });
    const mockPromoteSelect = jest.fn().mockReturnValue({ maybeSingle: mockPromoteMaybeSingle });
    const mockPromoteNeq = jest.fn().mockReturnValue({ select: mockPromoteSelect });
    const mockPromoteEq = jest.fn().mockReturnValue({ neq: mockPromoteNeq });
    const mockProfileUpdate = jest.fn().mockReturnValue({ eq: mockPromoteEq });

    const mockReqUpdate = jest
      .fn()
      .mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return { update: mockProfileUpdate };
      if (table === "expert_requests") return { update: mockReqUpdate };
      return {};
    });

    const res = await request(app)
      .post("/admin/expert-requests/req-1/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "expert" })
    );
    expect(mockReqUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved", decided_by: "admin-1" })
    );
  });

  it("returns 409 PROMOTION_FAILED when the applicant profile no longer exists", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const mockReqSelectSingle = jest.fn().mockResolvedValue({
      data: { id: "req-x", user_id: "ghost", status: "pending" },
      error: null,
    });
    const mockReqSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle: mockReqSelectSingle }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "expert_requests") return { select: mockReqSelect };
      return {};
    });

    const mockPromoteMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockPromoteSelect = jest.fn().mockReturnValue({ maybeSingle: mockPromoteMaybeSingle });
    const mockPromoteNeq = jest.fn().mockReturnValue({ select: mockPromoteSelect });
    const mockPromoteEq = jest.fn().mockReturnValue({ neq: mockPromoteNeq });
    const mockProfileUpdate = jest.fn().mockReturnValue({ eq: mockPromoteEq });

    (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return { update: mockProfileUpdate };
      return {};
    });

    const res = await request(app)
      .post("/admin/expert-requests/req-x/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROMOTION_FAILED");
  });

  it("rejects a pending request with a decision note", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const mockReqSelectSingle = jest.fn().mockResolvedValue({
      data: { id: "req-2", user_id: "applicant-2", status: "pending" },
      error: null,
    });
    const mockReqSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle: mockReqSelectSingle }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "expert_requests") return { select: mockReqSelect };
      return {};
    });

    const mockReqUpdate = jest
      .fn()
      .mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === "expert_requests") return { update: mockReqUpdate };
      return {};
    });

    const res = await request(app)
      .post("/admin/expert-requests/req-2/reject")
      .set("Authorization", "Bearer t")
      .send({ decisionNote: "Insufficient evidence." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
    expect(mockReqUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        decision_note: "Insufficient evidence.",
      })
    );
  });

  it("returns 409 when approving an already-decided request", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const mockReqSelectSingle = jest.fn().mockResolvedValue({
      data: { id: "req-3", user_id: "applicant-3", status: "approved" },
      error: null,
    });
    const mockReqSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle: mockReqSelectSingle }),
    });

    let profilesCalls = 0;
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") {
        profilesCalls++;
        if (profilesCalls === 1) return profileLookup;
        return {};
      }
      if (table === "expert_requests") {
        return { select: mockReqSelect };
      }
      return {};
    });

    const res = await request(app)
      .post("/admin/expert-requests/req-3/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_ALREADY_DECIDED");
  });
});

// ─── User-side POST /auth/expert-requests ─────────────────────────────────────

describe("POST /auth/expert-requests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an already-expert caller with 409", async () => {
    const profileLookup = mockAuthAs("expert", "p-1");
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      return {};
    });

    const res = await request(app)
      .post("/auth/expert-requests")
      .set("Authorization", "Bearer t")
      .send({ reason: "I want to upgrade" });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already an expert/i);
  });

  it("creates a new pending request for a learner", async () => {
    const profileLookup = mockAuthAs("learner", "p-2");

    // No existing pending request.
    const mockReqExistsMaybeSingle = jest.fn().mockResolvedValue({ data: null });
    const mockReqExistsEq2 = jest
      .fn()
      .mockReturnValue({ maybeSingle: mockReqExistsMaybeSingle });
    const mockReqExistsEq1 = jest.fn().mockReturnValue({ eq: mockReqExistsEq2 });
    const mockReqExistsSelect = jest.fn().mockReturnValue({ eq: mockReqExistsEq1 });

    // Insert returns the row.
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: {
        id: "new-req",
        user_id: "p-2",
        reason: "I cooked for 20 years",
        status: "pending",
        created_at: "2026-05-09T00:00:00Z",
      },
      error: null,
    });
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockReqInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    let profilesCalls = 0;
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") {
        profilesCalls++;
        if (profilesCalls === 1) return profileLookup;
        return {};
      }
      if (table === "expert_requests") {
        return { select: mockReqExistsSelect, insert: mockReqInsert };
      }
      return {};
    });

    const res = await request(app)
      .post("/auth/expert-requests")
      .set("Authorization", "Bearer t")
      .send({ reason: "I cooked for 20 years" });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.userId).toBe("p-2");
  });
});

// ─── GET /admin/cultural-tag-requests ────────────────────────────────────────

describe("GET /admin/cultural-tag-requests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists pending requests with 200", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const rows = [
      {
        id: 1,
        label_en: "Holiday Meal",
        label_tr: "Bayram Yemeği",
        country: "Turkey",
        status: "pending",
        decision_note: null,
        decided_by: null,
        created_at: "2026-01-01T00:00:00Z",
        decided_at: null,
        requester: { id: "p1", username: "expert_user" },
      },
    ];

    const mockChain: any = {};
    ["select", "order", "range", "eq"].forEach((m) => {
      mockChain[m] = jest.fn().mockReturnValue(mockChain);
    });
    mockChain.then = (resolve: any) =>
      Promise.resolve({ data: rows, error: null, count: 1 }).then(resolve);

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") return mockChain;
      return {};
    });

    const res = await request(app)
      .get("/admin/cultural-tag-requests")
      .set("Authorization", "Bearer t");

    expect(res.status).toBe(200);
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.requests[0].labelEn).toBe("Holiday Meal");
    expect(res.body.data.requests[0].requester.username).toBe("expert_user");
    expect(res.body.data.pagination).toBeDefined();
  });
});

// ─── POST /admin/cultural-tag-requests/:id/approve ────────────────────────────

describe("POST /admin/cultural-tag-requests/:id/approve", () => {
  beforeEach(() => jest.clearAllMocks());

  function mockTagRequest(status: string) {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 1, label_en: "Holiday Meal", label_tr: "Bayram Yemeği", country: "Turkey", status },
            error: null,
          }),
        }),
      }),
    };
  }

  it("approves a pending request and inserts the tag", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    // unique key check returns null (no conflict)
    const mockKeyCheck = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") return mockTagRequest("pending");
      if (table === "cultural_tags") return mockKeyCheck;
      return {};
    });

    const newTag = { id: 11, key: "holiday-meal", label_en: "Holiday Meal", label_tr: "Bayram Yemeği", country: "Turkey" };
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: newTag, error: null }),
      }),
    });
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === "cultural_tags") return { insert: mockInsert };
      if (table === "cultural_tag_requests") return { update: mockUpdate };
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/approve")
      .set("Authorization", "Bearer t")
      .send({ decisionNote: "Looks good." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
    expect(res.body.data.createdTag.key).toBe("holiday-meal");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "holiday-meal", label_en: "Holiday Meal" })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved", decided_by: "admin-1" })
    );
  });

  it("returns 404 when request does not exist", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/999/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 409 when request is already decided", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") return mockTagRequest("approved");
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_ALREADY_DECIDED");
  });

  it("returns 409 when generated key already exists", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const mockKeyConflict = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 5 }, error: null }),
        }),
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") return mockTagRequest("pending");
      if (table === "cultural_tags") return mockKeyConflict;
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("returns 400 when labelEn cannot be resolved", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    // Request has no label_en and admin sends no override
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 1, label_en: null, label_tr: "Test", country: null, status: "pending" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/approve")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─── POST /admin/cultural-tag-requests/:id/reject ────────────────────────────

describe("POST /admin/cultural-tag-requests/:id/reject", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a pending request with 200", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    const mockReqLoad = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 1, status: "pending" },
            error: null,
          }),
        }),
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") return mockReqLoad;
      return {};
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === "cultural_tag_requests") return { update: mockUpdate };
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/reject")
      .set("Authorization", "Bearer t")
      .send({ decisionNote: "Not needed." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", decision_note: "Not needed.", decided_by: "admin-1" })
    );
  });

  it("returns 404 when request does not exist", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/999/reject")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(404);
  });

  it("returns 409 when request is already decided", async () => {
    const profileLookup = mockAuthAs("admin", "admin-1");

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") return profileLookup;
      if (table === "cultural_tag_requests") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 1, status: "rejected" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app)
      .post("/admin/cultural-tag-requests/1/reject")
      .set("Authorization", "Bearer t")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_ALREADY_DECIDED");
  });
});
