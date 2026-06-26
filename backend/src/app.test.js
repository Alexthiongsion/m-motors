const request = require("supertest");
const pool = require("./db");

jest.mock("./db", () => ({
  query: jest.fn(),
}));

const app = require("./app");

describe("App monitoring and error handling", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns health status when the database is connected", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ result: 1 }] });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("m-motors-api");
    expect(response.body.database).toBe("connected");
    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
  });

  it("returns 503 when the database is disconnected", async () => {
    pool.query.mockRejectedValueOnce(new Error("Database unavailable"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("error");
    expect(response.body.database).toBe("disconnected");
  });

  it("returns a JSON 404 response for unknown routes", async () => {
    const response = await request(app).get("/api/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Route introuvable.");
  });
});
