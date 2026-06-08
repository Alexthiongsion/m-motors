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
});

beforeEach(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
  await pool.end();
});

describe("POST /api/auth/register", () => {
  test("crée un compte client avec des données valides", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Compte créé avec succès.");
    expect(response.body.user.email).toBe("jean.dupont@test.com");
    expect(response.body.user.role).toBe("client");
    expect(response.body.user.password_hash).toBeUndefined();

    const dbUser = await pool.query(
      "SELECT password_hash FROM users WHERE email = $1",
      ["jean.dupont@test.com"]
    );

    expect(dbUser.rows[0].password_hash).not.toBe("Password123");
    expect(await bcrypt.compare("Password123", dbUser.rows[0].password_hash)).toBe(true);
  });

  test("refuse la création si un champ obligatoire est manquant", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jean",
      email: "jean.incomplet@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Tous les champs obligatoires doivent être renseignés.");
  });

  test("refuse la création si l'email est invalide", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jean",
      lastName: "Dupont",
      email: "email-invalide",
      password: "Password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("L'adresse email est invalide.");
  });

  test("refuse la création si le mot de passe est trop court", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.short@test.com",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Le mot de passe doit contenir au moins 8 caractères.");
  });

  test("refuse la création si l'email existe déjà", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "Jean",
      lastName: "Dupont",
      email: "doublon@test.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/auth/register").send({
      firstName: "Paul",
      lastName: "Martin",
      email: "doublon@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Un compte existe déjà avec cette adresse email.");
  });
});

describe("POST /api/auth/login", () => {
  test("connecte un client avec des identifiants valides", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "Client",
      lastName: "Test",
      email: "client.login@test.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "client.login@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Connexion réussie.");
    expect(response.body.user.email).toBe("client.login@test.com");
    expect(response.body.user.role).toBe("client");
  });

  test("connecte un administrateur avec des identifiants valides", async () => {
    const passwordHash = await bcrypt.hash("Password123", 10);

    await pool.query(
      `
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      `,
      ["Admin", "Test", "admin.login@test.com", passwordHash, "admin"]
    );

    const response = await request(app).post("/api/auth/login").send({
      email: "admin.login@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Connexion réussie.");
    expect(response.body.user.email).toBe("admin.login@test.com");
    expect(response.body.user.role).toBe("admin");
  });

  test("refuse la connexion si un champ obligatoire est manquant", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "client.login@test.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email et mot de passe sont obligatoires.");
  });

  test("refuse la connexion si l'email est inconnu", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "inconnu@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Identifiants incorrects.");
  });

  test("refuse la connexion si le mot de passe est incorrect", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "Client",
      lastName: "Erreur",
      email: "wrong.password@test.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "wrong.password@test.com",
      password: "WrongPassword123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Identifiants incorrects.");
  });

  test("ne retourne jamais le password_hash après connexion", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "Secure",
      lastName: "User",
      email: "secure.login@test.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "secure.login@test.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.password_hash).toBeUndefined();
  });
});
