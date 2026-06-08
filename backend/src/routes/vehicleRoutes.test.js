const request = require("supertest");
const app = require("../app");
const pool = require("../db");

afterAll(async () => {
  await pool.end();
});

describe("GET /api/vehicles", () => {
  test("retourne uniquement les véhicules disponibles", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(response.body.every((vehicle) => vehicle.is_available === true)).toBe(true);
  });

  test("recherche un véhicule par modèle", async () => {
    const response = await request(app).get("/api/vehicles?search=clio");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].brand).toBe("Renault");
    expect(response.body[0].model).toBe("Clio");
  });

  test("ne retourne pas un véhicule indisponible", async () => {
    const response = await request(app).get("/api/vehicles?search=audi");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
