import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import App from "./App";

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const vehicles = [
      { id: 1, brand: "Renault", model: "Clio", price: 12000, offer_type: "purchase", is_available: true, image_url: null },
      { id: 4, brand: "Renault", model: "Captur", price: 420, offer_type: "rental", is_available: true, image_url: null },
    ];

    if (url.includes("search=audi")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve(vehicles) });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  test("affiche les véhicules disponibles", async () => {
    render(<App />);

    expect(await screen.findByText("Renault Clio")).toBeInTheDocument();
    expect(screen.getByText("Renault Captur")).toBeInTheDocument();
  });

  test("affiche un message si aucun véhicule ne correspond", async () => {
    render(<App />);

    const input = screen.getByLabelText("Rechercher un véhicule");
    await userEvent.type(input, "audi");
    await userEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => {
      expect(
        screen.getByText("Aucun véhicule disponible ne correspond à votre recherche.")
      ).toBeInTheDocument();
    });
  });
});
