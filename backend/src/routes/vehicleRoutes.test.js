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

  test("filtre les véhicules disponibles à l'achat", async () => {
    const response = await request(app).get("/api/vehicles?offerType=purchase");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.every((vehicle) => vehicle.offer_type === "purchase")).toBe(true);
  });

  test("filtre les véhicules disponibles à la location", async () => {
    const response = await request(app).get("/api/vehicles?offerType=rental");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.every((vehicle) => vehicle.offer_type === "rental")).toBe(true);
  });

  test("retourne une erreur si le type d'offre est invalide", async () => {
    const response = await request(app).get("/api/vehicles?offerType=invalid");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le type d'offre demandé est invalide.");
  });
});
