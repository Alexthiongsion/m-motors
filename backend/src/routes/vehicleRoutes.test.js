const request = require("supertest");
const app = require("../app");
const pool = require("../db");

let adminUserId;
let clientUserId;
let createdVehicleId;

beforeAll(async () => {
  await pool.query(`
    DELETE FROM vehicles
    WHERE brand = 'AdminVehicle'
  `);

  const adminResult = await pool.query(
    `
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Admin', 'Vehicle', 'admin.vehicle@test.com', 'fake_hash', 'admin')
      ON CONFLICT (email)
      DO UPDATE SET role = 'admin'
      RETURNING id
    `
  );

  const clientResult = await pool.query(
    `
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Client', 'Vehicle', 'client.vehicle@test.com', 'fake_hash', 'client')
      ON CONFLICT (email)
      DO UPDATE SET role = 'client'
      RETURNING id
    `
  );

  adminUserId = adminResult.rows[0].id;
  clientUserId = clientResult.rows[0].id;
});

afterAll(async () => {
  await pool.query(`
    DELETE FROM vehicles
    WHERE brand = 'AdminVehicle'
  `);

  await pool.query(`
    DELETE FROM users
    WHERE email IN ('admin.vehicle@test.com', 'client.vehicle@test.com')
  `);

  await pool.end();
});

describe("GET /api/vehicles", () => {
  test("retourne uniquement les véhicules disponibles", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
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
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((vehicle) =>
        ["purchase", "both"].includes(vehicle.offer_type)
      )
    ).toBe(true);
  });

  test("filtre les véhicules disponibles à la location", async () => {
    const response = await request(app).get("/api/vehicles?offerType=rental");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((vehicle) =>
        ["rental", "both"].includes(vehicle.offer_type)
      )
    ).toBe(true);
  });

  test("retourne une erreur si le type d'offre est invalide", async () => {
    const response = await request(app).get("/api/vehicles?offerType=invalid");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le type d'offre demandé est invalide.");
  });
});

describe("GET /api/vehicles/admin", () => {
  test("retourne tous les véhicules pour un administrateur", async () => {
    const response = await request(app).get(
      `/api/vehicles/admin?adminUserId=${adminUserId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.some((vehicle) => vehicle.is_available === false)).toBe(true);
  });

  test("refuse l'accès à un client", async () => {
    const response = await request(app).get(
      `/api/vehicles/admin?adminUserId=${clientUserId}`
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès réservé aux administrateurs.");
  });
});

describe("POST /api/vehicles", () => {
  test("crée un véhicule si l'utilisateur est administrateur", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .send({
        adminUserId,
        brand: "AdminVehicle",
        model: "Creation",
        price: 19900,
        offerType: "both",
        isAvailable: false,
        imageUrl: null,
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Véhicule créé avec succès.");
    expect(response.body.vehicle.brand).toBe("AdminVehicle");
    expect(response.body.vehicle.model).toBe("Creation");
    expect(response.body.vehicle.offer_type).toBe("both");
    expect(response.body.vehicle.is_available).toBe(false);

    createdVehicleId = response.body.vehicle.id;
  });

  test("refuse la création si l'utilisateur n'est pas administrateur", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .send({
        adminUserId: clientUserId,
        brand: "AdminVehicle",
        model: "Refus",
        price: 15000,
        offerType: "purchase",
        isAvailable: true,
        imageUrl: null,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès réservé aux administrateurs.");
  });

  test("refuse la création si un champ obligatoire manque", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .send({
        adminUserId,
        brand: "AdminVehicle",
        price: 15000,
        offerType: "purchase",
        isAvailable: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Les champs marque, modèle, prix et type d'offre sont obligatoires."
    );
  });

  test("refuse la création si le type d'offre est invalide", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .send({
        adminUserId,
        brand: "AdminVehicle",
        model: "Invalid",
        price: 15000,
        offerType: "invalid",
        isAvailable: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le type d'offre est invalide.");
  });
});

describe("PUT /api/vehicles/:id", () => {
  test("modifie un véhicule si l'utilisateur est administrateur", async () => {
    const response = await request(app)
      .put(`/api/vehicles/${createdVehicleId}`)
      .send({
        adminUserId,
        brand: "AdminVehicle",
        model: "Modification",
        price: 21000,
        offerType: "both",
        isAvailable: true,
        imageUrl: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Véhicule modifié avec succès.");
    expect(response.body.vehicle.model).toBe("Modification");
    expect(response.body.vehicle.price).toBe(21000);
    expect(response.body.vehicle.is_available).toBe(true);
  });

  test("rend le véhicule modifié visible dans le catalogue client s'il est disponible", async () => {
    const response = await request(app).get("/api/vehicles?search=Modification");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].brand).toBe("AdminVehicle");
    expect(response.body[0].model).toBe("Modification");
    expect(response.body[0].is_available).toBe(true);
  });

  test("refuse la modification si l'utilisateur n'est pas administrateur", async () => {
    const response = await request(app)
      .put(`/api/vehicles/${createdVehicleId}`)
      .send({
        adminUserId: clientUserId,
        brand: "AdminVehicle",
        model: "ClientRefus",
        price: 21000,
        offerType: "purchase",
        isAvailable: true,
        imageUrl: null,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès réservé aux administrateurs.");
  });

  test("retourne une erreur si le véhicule n'existe pas", async () => {
    const response = await request(app)
      .put("/api/vehicles/999999")
      .send({
        adminUserId,
        brand: "AdminVehicle",
        model: "Introuvable",
        price: 21000,
        offerType: "purchase",
        isAvailable: true,
        imageUrl: null,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Véhicule introuvable.");
  });
});