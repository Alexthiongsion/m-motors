import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  createVehicle,
  fetchAdminVehicles,
  fetchVehicles,
  updateVehicle,
} from "./vehicleService";

describe("vehicleService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("fetchVehicles appelle la route publique avec recherche et type d'offre", async () => {
    const vehicles = [{ id: 1, brand: "Renault", model: "Clio" }];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => vehicles,
      })
    );

    const result = await fetchVehicles("clio", "purchase");

    expect(result).toEqual(vehicles);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/vehicles?search=clio&offerType=purchase"
    );
  });

  test("fetchAdminVehicles envoie le token JWT", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    await fetchAdminVehicles(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/vehicles/admin",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
      })
    );
  });

  test("createVehicle envoie les données sans adminUserId dans le body", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Véhicule créé." }),
      })
    );

    await createVehicle(1, {
      brand: "Renault",
      model: "Clio",
      price: 12000,
      offerType: "purchase",
      isAvailable: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/vehicles",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
        body: JSON.stringify({
          brand: "Renault",
          model: "Clio",
          price: 12000,
          offerType: "purchase",
          isAvailable: true,
        }),
      })
    );
  });

  test("updateVehicle lève une erreur si l'API refuse la modification", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Accès administrateur requis." }),
      })
    );

    await expect(
      updateVehicle(1, 10, {
        brand: "Renault",
        model: "Clio",
        price: 12000,
        offerType: "purchase",
        isAvailable: true,
      })
    ).rejects.toThrow("Accès administrateur requis.");
  });
});
