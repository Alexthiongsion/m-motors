const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../app");
const pool = require("../db");

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('purchase', 'rental', 'both')),
      is_available BOOLEAN NOT NULL DEFAULT true,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('purchase', 'rental')),
      phone VARCHAR(30) NOT NULL,
      message TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'valide', 'refuse')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

beforeEach(async () => {
  await pool.query("DELETE FROM applications");
  await pool.query("DELETE FROM users WHERE email LIKE '%application.test.com'");
  await pool.query("DELETE FROM vehicles WHERE brand LIKE 'Test%'");
});

afterAll(async () => {
  await pool.query("DELETE FROM applications");
  await pool.query("DELETE FROM users WHERE email LIKE '%application.test.com'");
  await pool.query("DELETE FROM vehicles WHERE brand LIKE 'Test%'");
  await pool.end();
});

async function createTestUser() {
  const passwordHash = await bcrypt.hash("Password123", 10);

  const result = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    ["Client", "Application", "client@application.test.com", passwordHash, "client"]
  );

  return result.rows[0];
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash("Password123", 10);

  const result = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    ["Admin", "Application", "admin@application.test.com", passwordHash, "admin"]
  );

  return result.rows[0];
}

async function createTestVehicle(offerType = "purchase", isAvailable = true) {
  const result = await pool.query(
    `
    INSERT INTO vehicles (brand, model, price, offer_type, is_available)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    ["Test Renault", "Clio", 15000, offerType, isAvailable]
  );

  return result.rows[0];
}

describe("POST /api/applications", () => {
  test("crée un dossier valide avec le statut en_attente", async () => {
    const user = await createTestUser();
    const vehicle = await createTestVehicle("purchase");

    const response = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
      message: "Je souhaite acheter ce véhicule.",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Dossier déposé avec succès.");
    expect(response.body.application.user_id).toBe(user.id);
    expect(response.body.application.vehicle_id).toBe(vehicle.id);
    expect(response.body.application.offer_type).toBe("purchase");
    expect(response.body.application.status).toBe("en_attente");
  });


  test("crée un dossier achat pour un véhicule disponible en achat et location", async () => {
  const user = await createTestUser();
  const vehicle = await createTestVehicle("both");

  const response = await request(app).post("/api/applications").send({
    userId: user.id,
    vehicleId: vehicle.id,
    offerType: "purchase",
    phone: "0600000000",
    message: "Je souhaite acheter ce véhicule.",
  });

  expect(response.status).toBe(201);
  expect(response.body.message).toBe("Dossier déposé avec succès.");
  expect(response.body.application.user_id).toBe(user.id);
  expect(response.body.application.vehicle_id).toBe(vehicle.id);
  expect(response.body.application.offer_type).toBe("purchase");
  expect(response.body.application.status).toBe("en_attente");
});

  test("refuse la création si un champ obligatoire est manquant", async () => {
    const response = await request(app).post("/api/applications").send({
      userId: 1,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Tous les champs obligatoires doivent être renseignés.");
  });

  test("refuse la création si le type de demande est invalide", async () => {
    const response = await request(app).post("/api/applications").send({
      userId: 1,
      vehicleId: 1,
      offerType: "credit",
      phone: "0600000000",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le type de demande est invalide.");
  });

  test("refuse la création si l'utilisateur est introuvable", async () => {
    const vehicle = await createTestVehicle("purchase");

    const response = await request(app).post("/api/applications").send({
      userId: 999999,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Utilisateur introuvable.");
  });

  test("refuse la création si le véhicule est introuvable", async () => {
    const user = await createTestUser();

    const response = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: 999999,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Véhicule introuvable.");
  });

  test("refuse la création si le véhicule n'est plus disponible", async () => {
    const user = await createTestUser();
    const vehicle = await createTestVehicle("purchase", false);

    const response = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Ce véhicule n'est plus disponible.");
  });

  test("refuse la création si le type de demande ne correspond pas au véhicule", async () => {
    const user = await createTestUser();
    const vehicle = await createTestVehicle("rental");

    const response = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le type de demande ne correspond pas à l'offre du véhicule.");
  });
});

describe("GET /api/applications/admin", () => {
  test("retourne tous les dossiers clients pour un administrateur", async () => {
    const admin = await createAdminUser();
    const user = await createTestUser();
    const vehicle = await createTestVehicle("purchase");

    await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
      message: "Dossier à analyser.",
    });

    const response = await request(app).get(
      `/api/applications/admin?adminUserId=${admin.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user_id).toBe(user.id);
    expect(response.body[0].first_name).toBe("Client");
    expect(response.body[0].last_name).toBe("Application");
    expect(response.body[0].email).toBe("client@application.test.com");
    expect(response.body[0].brand).toBe("Test Renault");
    expect(response.body[0].model).toBe("Clio");
    expect(response.body[0].offer_type).toBe("purchase");
    expect(response.body[0].status).toBe("en_attente");
    expect(response.body[0].phone).toBe("0600000000");
    expect(response.body[0].message).toBe("Dossier à analyser.");
  });

  test("refuse la consultation des dossiers à un client", async () => {
    const user = await createTestUser();

    const response = await request(app).get(
      `/api/applications/admin?adminUserId=${user.id}`
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès réservé aux administrateurs.");
  });
});

describe("GET /api/applications/admin/:applicationId", () => {
  test("retourne le détail d'un dossier pour un administrateur", async () => {
    const admin = await createAdminUser();
    const user = await createTestUser();
    const vehicle = await createTestVehicle("rental");

    const createdApplication = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "rental",
      phone: "0611111111",
      message: "Je souhaite louer ce véhicule.",
    });

    const response = await request(app).get(
      `/api/applications/admin/${createdApplication.body.application.id}?adminUserId=${admin.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdApplication.body.application.id);
    expect(response.body.user_id).toBe(user.id);
    expect(response.body.vehicle_id).toBe(vehicle.id);
    expect(response.body.first_name).toBe("Client");
    expect(response.body.last_name).toBe("Application");
    expect(response.body.email).toBe("client@application.test.com");
    expect(response.body.brand).toBe("Test Renault");
    expect(response.body.model).toBe("Clio");
    expect(response.body.offer_type).toBe("rental");
    expect(response.body.status).toBe("en_attente");
    expect(response.body.phone).toBe("0611111111");
    expect(response.body.message).toBe("Je souhaite louer ce véhicule.");
  });

  test("refuse le détail d'un dossier à un client", async () => {
    const user = await createTestUser();

    const response = await request(app).get(
      `/api/applications/admin/1?adminUserId=${user.id}`
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès réservé aux administrateurs.");
  });

  test("retourne une erreur si le dossier est introuvable", async () => {
    const admin = await createAdminUser();

    const response = await request(app).get(
      `/api/applications/admin/999999?adminUserId=${admin.id}`
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Dossier introuvable.");
  });
});

describe("GET /api/applications/user/:userId", () => {
  test("retourne les dossiers d'un client", async () => {
    const user = await createTestUser();
    const vehicle = await createTestVehicle("purchase");

    await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
      message: "Demande de test.",
    });

    const response = await request(app).get(`/api/applications/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user_id).toBe(user.id);
    expect(response.body[0].brand).toBe("Test Renault");
    expect(response.body[0].model).toBe("Clio");
    expect(response.body[0].status).toBe("en_attente");
  });

  test("retourne le statut actuel d'un dossier client", async () => {
    const user = await createTestUser();
    const vehicle = await createTestVehicle("purchase");

    const createdApplication = await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
      message: "Demande en cours.",
    });

    await pool.query("UPDATE applications SET status = $1 WHERE id = $2", [
      "en_cours",
      createdApplication.body.application.id,
    ]);

    const response = await request(app).get(`/api/applications/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("en_cours");
  });

  test("ne retourne pas les dossiers d'un autre client", async () => {
    const user = await createTestUser();
    const passwordHash = await bcrypt.hash("Password123", 10);

    const otherUserResult = await pool.query(
      `
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        "Autre",
        "Client",
        "other-client@application.test.com",
        passwordHash,
        "client",
      ]
    );

    const otherUser = otherUserResult.rows[0];
    const vehicle = await createTestVehicle("purchase");
    const otherVehicle = await createTestVehicle("purchase");

    await request(app).post("/api/applications").send({
      userId: user.id,
      vehicleId: vehicle.id,
      offerType: "purchase",
      phone: "0600000000",
    });

    await request(app).post("/api/applications").send({
      userId: otherUser.id,
      vehicleId: otherVehicle.id,
      offerType: "purchase",
      phone: "0611111111",
    });

    const response = await request(app).get(`/api/applications/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user_id).toBe(user.id);
  });

  test("retourne un tableau vide si le client n'a aucun dossier", async () => {
    const user = await createTestUser();

    const response = await request(app).get(`/api/applications/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("refuse la récupération si l'utilisateur est introuvable", async () => {
    const response = await request(app).get("/api/applications/user/999999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Utilisateur introuvable.");
  });
});
