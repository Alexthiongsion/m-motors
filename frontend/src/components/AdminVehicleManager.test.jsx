import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AdminVehicleManager from "./AdminVehicleManager";
import {
  createVehicle,
  fetchAdminVehicles,
  updateVehicle,
} from "../services/vehicleService";

vi.mock("../services/vehicleService", () => ({
  fetchAdminVehicles: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

const adminUser = {
  id: 1,
  email: "admin@test.com",
  role: "admin",
};

const vehicles = [
  {
    id: 10,
    brand: "Renault",
    model: "Clio",
    price: 12000,
    offer_type: "purchase",
    is_available: true,
    image_url: null,
  },
];

describe("AdminVehicleManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminVehicles.mockResolvedValue(vehicles);
  });

  afterEach(() => {
    cleanup();
  });

  test("affiche la gestion des véhicules pour un administrateur", async () => {
    render(<AdminVehicleManager currentUser={adminUser} />);

    expect(screen.getByText("Gestion des véhicules")).toBeTruthy();
    expect(await screen.findByText("Renault Clio")).toBeTruthy();
    expect(screen.getByText("Offre : Achat")).toBeTruthy();
    expect(screen.getByText("Disponible")).toBeTruthy();
  });

  test("crée un véhicule depuis le formulaire admin", async () => {
    const user = userEvent.setup();

    createVehicle.mockResolvedValue({
      message: "Véhicule créé avec succès.",
    });

    render(<AdminVehicleManager currentUser={adminUser} />);

    await user.type(screen.getByLabelText("Marque"), "Peugeot");
    await user.type(screen.getByLabelText("Modèle"), "3008");
    await user.type(screen.getByLabelText("Prix"), "28000");
    await user.selectOptions(screen.getByLabelText("Type d’offre"), "both");

    await user.click(screen.getByRole("button", { name: "Créer le véhicule" }));

    await waitFor(() => {
      expect(createVehicle).toHaveBeenCalledWith(1, {
        brand: "Peugeot",
        model: "3008",
        price: 28000,
        offerType: "both",
        isAvailable: true,
        imageUrl: null,
      });
    });

    expect(await screen.findByText("Véhicule créé avec succès.")).toBeTruthy();
  });

  test("modifie un véhicule existant", async () => {
    const user = userEvent.setup();

    updateVehicle.mockResolvedValue({
      message: "Véhicule modifié avec succès.",
    });

    render(<AdminVehicleManager currentUser={adminUser} />);

    expect(await screen.findByText("Renault Clio")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Modifier" }));

    const modelInput = screen.getByLabelText("Modèle");

    await user.clear(modelInput);
    await user.type(modelInput, "Clio 5");

    await user.click(screen.getByRole("button", { name: "Modifier le véhicule" }));

    await waitFor(() => {
      expect(updateVehicle).toHaveBeenCalledWith(1, 10, {
        brand: "Renault",
        model: "Clio 5",
        price: 12000,
        offerType: "purchase",
        isAvailable: true,
        imageUrl: null,
      });
    });

    expect(await screen.findByText("Véhicule modifié avec succès.")).toBeTruthy();
  });
});