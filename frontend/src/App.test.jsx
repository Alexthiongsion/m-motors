import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

const applications = [
  {
    id: 1,
    user_id: 2,
    vehicle_id: 1,
    offer_type: "purchase",
    phone: "0600000000",
    message: "Demande de test.",
    status: "en_attente",
    brand: "Renault",
    model: "Clio",
    price: 12000,
    image_url: null,
  },
];

beforeEach(() => {
  localStorage.clear();

  global.fetch = vi.fn((url, options = {}) => {
    const requestUrl = new URL(url);

    if (options.method === "POST" && requestUrl.pathname === "/api/auth/register") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            message: "Compte créé avec succès.",
            user: {
              id: 1,
              first_name: "Jean",
              last_name: "Dupont",
              email: "jean.dupont@test.com",
              role: "client",
            },
          }),
      });
    }

    if (options.method === "POST" && requestUrl.pathname === "/api/auth/login") {
      const body = JSON.parse(options.body);

      if (body.email === "client@test.com" && body.password === "Password123") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              message: "Connexion réussie.",
              user: {
                id: 2,
                first_name: "Client",
                last_name: "Test",
                email: "client@test.com",
                role: "client",
              },
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            message: "Identifiants incorrects.",
          }),
      });
    }

    if (options.method === "POST" && requestUrl.pathname === "/api/applications") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            message: "Dossier déposé avec succès.",
            application: applications[0],
          }),
      });
    }

    if (requestUrl.pathname === "/api/applications/user/2") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(applications),
      });
    }

    if (requestUrl.searchParams.get("search") === "audi") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }

    if (requestUrl.searchParams.get("offerType") === "purchase") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            vehicles.filter((vehicle) => vehicle.offer_type === "purchase")
          ),
      });
    }

    if (requestUrl.searchParams.get("offerType") === "rental") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            vehicles.filter((vehicle) => vehicle.offer_type === "rental")
          ),
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

    expect(screen.getByText(/Parcours sélectionné/i)).toBeInTheDocument();
    expect(localStorage.getItem("selectedJourney")).toContain("purchase");
    expect(localStorage.getItem("selectedJourney")).toContain("Renault Clio");
  });

  test("conserve le choix location dans le parcours utilisateur", async () => {
    render(<App />);

    await screen.findByText("Renault Captur");
    await userEvent.click(screen.getByRole("button", { name: "Louer" }));

    expect(screen.getByText(/Parcours sélectionné/i)).toBeInTheDocument();
    expect(localStorage.getItem("selectedJourney")).toContain("rental");
    expect(localStorage.getItem("selectedJourney")).toContain("Renault Captur");
  });

  test("affiche le formulaire de création de compte", async () => {
    render(<App />);

    const registerSection = screen
      .getByRole("heading", { name: "Créer un compte" })
      .closest("section");

    expect(within(registerSection).getByLabelText("Prénom")).toBeInTheDocument();
    expect(within(registerSection).getByLabelText("Nom")).toBeInTheDocument();
    expect(within(registerSection).getByLabelText("Email")).toBeInTheDocument();
    expect(within(registerSection).getByLabelText("Mot de passe")).toBeInTheDocument();
  });

  test("affiche une confirmation après création du compte", async () => {
    render(<App />);

    const registerSection = screen
      .getByRole("heading", { name: "Créer un compte" })
      .closest("section");

    await userEvent.type(within(registerSection).getByLabelText("Prénom"), "Jean");
    await userEvent.type(within(registerSection).getByLabelText("Nom"), "Dupont");
    await userEvent.type(
      within(registerSection).getByLabelText("Email"),
      "jean.dupont@test.com"
    );
    await userEvent.type(
      within(registerSection).getByLabelText("Mot de passe"),
      "Password123"
    );

    await userEvent.click(
      within(registerSection).getByRole("button", { name: "Créer mon compte" })
    );

    expect(await screen.findByText("Compte créé avec succès.")).toBeInTheDocument();
  });

  test("affiche le formulaire de connexion", async () => {
    render(<App />);

    const loginSection = screen
      .getByRole("heading", { name: "Connexion" })
      .closest("section");

    expect(within(loginSection).getByLabelText("Email")).toBeInTheDocument();
    expect(within(loginSection).getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(
      within(loginSection).getByRole("button", { name: "Se connecter" })
    ).toBeInTheDocument();
  });

  test("affiche l'espace connecté après connexion client", async () => {
    render(<App />);

    const loginSection = screen
      .getByRole("heading", { name: "Connexion" })
      .closest("section");

    await userEvent.type(within(loginSection).getByLabelText("Email"), "client@test.com");
    await userEvent.type(
      within(loginSection).getByLabelText("Mot de passe"),
      "Password123"
    );

    await userEvent.click(
      within(loginSection).getByRole("button", { name: "Se connecter" })
    );

    expect(await screen.findByText("Espace connecté")).toBeInTheDocument();
    expect(screen.getByText(/client@test.com/i)).toBeInTheDocument();
    expect(screen.getByText("Accès client disponible.")).toBeInTheDocument();
    expect(localStorage.getItem("currentUser")).toContain('"role":"client"');
    expect(localStorage.getItem("currentUser")).toContain("client@test.com");
  });

  test("affiche une erreur si les identifiants sont incorrects", async () => {
    render(<App />);

    const loginSection = screen
      .getByRole("heading", { name: "Connexion" })
      .closest("section");

    await userEvent.type(within(loginSection).getByLabelText("Email"), "wrong@test.com");
    await userEvent.type(
      within(loginSection).getByLabelText("Mot de passe"),
      "WrongPassword123"
    );

    await userEvent.click(
      within(loginSection).getByRole("button", { name: "Se connecter" })
    );

    expect(await screen.findByText("Identifiants incorrects.")).toBeInTheDocument();
  });

  test("affiche un message si l'utilisateur n'est pas connecté", async () => {
    render(<App />);

    expect(
      await screen.findByText("Connectez-vous pour accéder à votre espace personnel.")
    ).toBeInTheDocument();
  });

  test("affiche un message si aucun parcours n'est sélectionné", async () => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: 2,
        email: "client@test.com",
        role: "client",
      })
    );

    render(<App />);

    expect(
      await screen.findByText("Sélectionnez d’abord un véhicule et un parcours achat/location.")
    ).toBeInTheDocument();
  });

  test("affiche le formulaire de dépôt si le client est connecté avec un parcours sélectionné", async () => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: 2,
        email: "client@test.com",
        role: "client",
      })
    );

    localStorage.setItem(
      "selectedJourney",
      JSON.stringify({
        vehicleId: 1,
        vehicleName: "Renault Clio",
        type: "purchase",
      })
    );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Déposer un dossier" })).toBeInTheDocument();
    expect(screen.getByLabelText("Téléphone")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Déposer le dossier" })).toBeInTheDocument();
  });

  test("affiche une confirmation après dépôt de dossier", async () => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: 2,
        email: "client@test.com",
        role: "client",
      })
    );

    localStorage.setItem(
      "selectedJourney",
      JSON.stringify({
        vehicleId: 1,
        vehicleName: "Renault Clio",
        type: "purchase",
      })
    );

    render(<App />);

    await userEvent.type(await screen.findByLabelText("Téléphone"), "0600000000");
    await userEvent.type(screen.getByLabelText("Message"), "Demande de test.");

    await userEvent.click(screen.getByRole("button", { name: "Déposer le dossier" }));

    expect(await screen.findByText("Dossier déposé avec succès.")).toBeInTheDocument();
  });

  test("affiche les dossiers du client connecté", async () => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: 2,
        email: "client@test.com",
        role: "client",
      })
    );

    render(<App />);

    const applicationsSection = await screen.findByRole("heading", {
      name: "Mes dossiers",
    });

    const section = applicationsSection.closest("section");

    expect(within(section).getByText("Renault Clio")).toBeInTheDocument();
    expect(within(section).getByText(/En attente/i)).toBeInTheDocument();
    expect(within(section).getByText("Demande de test.")).toBeInTheDocument();
  });
});
