import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  createApplication,
  fetchAdminApplicationDetail,
  fetchAdminApplications,
  fetchApplicationDocuments,
  fetchUserApplications,
  updateApplicationStatus,
  uploadApplicationDocument,
} from "./applicationService";

describe("applicationService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("createApplication envoie le token JWT", async () => {
    localStorage.setItem("token", "client-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Dossier déposé." }),
      })
    );

    await createApplication({
      vehicleId: 1,
      offerType: "purchase",
      phone: "0600000000",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer client-token",
        }),
      })
    );
  });

  test("fetchUserApplications envoie le token JWT", async () => {
    localStorage.setItem("token", "client-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    await fetchUserApplications(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/user/1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer client-token",
        }),
      })
    );
  });

  test("fetchAdminApplications appelle la route admin sans adminUserId dans l'URL", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    await fetchAdminApplications(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/admin",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
      })
    );
  });

  test("fetchAdminApplicationDetail appelle la route détail avec token", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 5 }),
      })
    );

    await fetchAdminApplicationDetail(1, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/admin/5",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
      })
    );
  });

  test("updateApplicationStatus envoie seulement le statut dans le body", async () => {
    localStorage.setItem("token", "admin-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Statut modifié." }),
      })
    );

    await updateApplicationStatus(1, 5, "valide");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/admin/5/status",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
        body: JSON.stringify({
          status: "valide",
        }),
      })
    );
  });

  test("uploadApplicationDocument envoie le document avec token", async () => {
    localStorage.setItem("token", "client-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Document envoyé." }),
      })
    );

    const file = new File(["test"], "document.pdf", {
      type: "application/pdf",
    });

    await uploadApplicationDocument(5, 1, file);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/5/documents",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer client-token",
        }),
        body: expect.any(FormData),
      })
    );
  });

  test("fetchApplicationDocuments appelle la route documents sans userId dans l'URL", async () => {
    localStorage.setItem("token", "client-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    await fetchApplicationDocuments(5, 1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/applications/5/documents",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer client-token",
        }),
      })
    );
  });

  test("createApplication lève une erreur si l'API refuse le dossier", async () => {
    localStorage.setItem("token", "client-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Token invalide ou expiré." }),
      })
    );

    await expect(
      createApplication({
        vehicleId: 1,
        offerType: "purchase",
        phone: "0600000000",
      })
    ).rejects.toThrow("Token invalide ou expiré.");
  });
});
