import { beforeEach, describe, expect, test, vi } from "vitest";
import { loginUser, registerUser } from "./authService";

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("registerUser retourne les données si la création réussit", async () => {
    const payload = { message: "Compte créé." };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      })
    );

    const result = await registerUser({
      firstName: "Client",
      lastName: "Test",
      email: "client@test.com",
      password: "Password123",
    });

    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/auth/register",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  test("loginUser stocke le token si la connexion réussit", async () => {
    const payload = {
      message: "Connexion réussie.",
      token: "jwt-test-token",
      user: { id: 1, email: "client@test.com", role: "client" },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      })
    );

    const result = await loginUser({
      email: "client@test.com",
      password: "Password123",
    });

    expect(result).toEqual(payload);
    expect(localStorage.getItem("token")).toBe("jwt-test-token");
  });

  test("loginUser lève une erreur si la connexion échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Identifiants invalides." }),
      })
    );

    await expect(
      loginUser({ email: "client@test.com", password: "bad" })
    ).rejects.toThrow("Identifiants invalides.");
  });
});
