import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AdminApplicationManager from "./AdminApplicationManager";
import {
  fetchAdminApplicationDetail,
  fetchAdminApplications,
} from "../services/applicationService";

vi.mock("../services/applicationService", () => ({
  fetchAdminApplications: vi.fn(),
  fetchAdminApplicationDetail: vi.fn(),
}));

const adminUser = {
  id: 1,
  email: "admin@test.com",
  role: "admin",
};

const applications = [
  {
    id: 12,
    user_id: 5,
    vehicle_id: 3,
    offer_type: "purchase",
    phone: "0600000000",
    message: "Je souhaite acheter ce véhicule.",
    status: "en_attente",
    first_name: "Client",
    last_name: "Test",
    email: "client@test.com",
    brand: "Renault",
    model: "Clio",
    price: 12000,
    image_url: null,
  },
];

describe("AdminApplicationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminApplications.mockResolvedValue(applications);
    fetchAdminApplicationDetail.mockResolvedValue(applications[0]);
  });

  afterEach(() => {
    cleanup();
  });

  test("affiche les dossiers clients pour un administrateur", async () => {
    render(<AdminApplicationManager currentUser={adminUser} />);

    expect(screen.getByText("Consultation des dossiers")).toBeTruthy();
    expect(await screen.findByText("Dossier #12 — Client Test")).toBeTruthy();
    expect(screen.getByText("Email client : client@test.com")).toBeTruthy();
    expect(screen.getByText("Véhicule : Renault Clio")).toBeTruthy();
    expect(screen.getByText("En attente")).toBeTruthy();
  });

  test("affiche le détail d'un dossier", async () => {
    const user = userEvent.setup();

    render(<AdminApplicationManager currentUser={adminUser} />);

    await screen.findByText("Dossier #12 — Client Test");

    await user.click(screen.getByRole("button", { name: "Voir le détail" }));

    await waitFor(() => {
      expect(fetchAdminApplicationDetail).toHaveBeenCalledWith(1, 12);
    });

    expect(await screen.findByText("Détail du dossier #12")).toBeTruthy();
    expect(
      screen.getByText("Client : Client Test — client@test.com")
    ).toBeTruthy();
    expect(screen.getByText("Téléphone : 0600000000")).toBeTruthy();
    expect(
      screen.getByText("Message : Je souhaite acheter ce véhicule.")
    ).toBeTruthy();
  });

  test("affiche un message d'erreur si le chargement échoue", async () => {
    fetchAdminApplications.mockRejectedValue(
      new Error("Erreur lors du chargement des dossiers administrateur.")
    );

    render(<AdminApplicationManager currentUser={adminUser} />);

    expect(
      await screen.findByText(
        "Erreur lors du chargement des dossiers administrateur."
      )
    ).toBeTruthy();
  });
});