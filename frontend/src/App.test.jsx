import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import App from "./App";

const vehicles = [
  {
    id: 1,
    brand: "Renault",
    model: "Clio",
    price: 12000,
    offer_type: "purchase",
    is_available: true,
    image_url: null,
  },
  {
    id: 4,
    brand: "Renault",
    model: "Captur",
    price: 420,
    offer_type: "rental",
    is_available: true,
    image_url: null,
  },
];

beforeEach(() => {
  localStorage.clear();

  global.fetch = vi.fn((url) => {
    const requestUrl = new URL(url);

    if (requestUrl.searchParams.get("search") === "audi") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }

    if (requestUrl.searchParams.get("offerType") === "purchase") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(vehicles.filter((vehicle) => vehicle.offer_type === "purchase")),
      });
    }

    if (requestUrl.searchParams.get("offerType") === "rental") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(vehicles.filter((vehicle) => vehicle.offer_type === "rental")),
      });
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

  test("filtre les véhicules par achat", async () => {
    render(<App />);

    await screen.findByText("Renault Clio");
    await userEvent.click(screen.getByRole("button", { name: "Achat" }));

    await waitFor(() => {
      expect(screen.getByText("Renault Clio")).toBeInTheDocument();
      expect(screen.queryByText("Renault Captur")).not.toBeInTheDocument();
    });
  });

  test("conserve le choix achat dans le parcours utilisateur", async () => {
    render(<App />);

    await screen.findByText("Renault Clio");
    await userEvent.click(screen.getByRole("button", { name: "Acheter" }));

    expect(
      screen.getByText(/Parcours sélectionné/i)
    ).toBeInTheDocument();

    expect(localStorage.getItem("selectedJourney")).toContain("purchase");
    expect(localStorage.getItem("selectedJourney")).toContain("Renault Clio");
  });

  test("conserve le choix location dans le parcours utilisateur", async () => {
    render(<App />);

    await screen.findByText("Renault Captur");
    await userEvent.click(screen.getByRole("button", { name: "Louer" }));

    expect(
      screen.getByText(/Parcours sélectionné/i)
    ).toBeInTheDocument();

    expect(localStorage.getItem("selectedJourney")).toContain("rental");
    expect(localStorage.getItem("selectedJourney")).toContain("Renault Captur");
  });
});
