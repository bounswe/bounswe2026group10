import request from "supertest";
import app from "../index.js";

describe("Health Check API", () => {
  it("should return 200 OK with status and timestamp", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });

  it("should return regions from /meta/regions", async () => {
    const response = await request(app).get("/meta/regions");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toContain("Turkey");
  });
});
