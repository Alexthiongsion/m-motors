import { describe, expect, test } from "vitest";
import {
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "./UserApplications";

describe("UserApplications status helpers", () => {
  test("convertit le statut en_attente en libellé lisible", () => {
    expect(getApplicationStatusLabel("en_attente")).toBe("En attente");
    expect(getApplicationStatusClassName("en_attente")).toBe(
      "status-badge--pending"
    );
  });

  test("convertit le statut en_cours en libellé lisible", () => {
    expect(getApplicationStatusLabel("en_cours")).toBe("En cours d’analyse");
    expect(getApplicationStatusClassName("en_cours")).toBe(
      "status-badge--progress"
    );
  });

  test("convertit le statut valide en libellé lisible", () => {
    expect(getApplicationStatusLabel("valide")).toBe("Validé");
    expect(getApplicationStatusClassName("valide")).toBe(
      "status-badge--approved"
    );
  });

  test("convertit le statut refuse en libellé lisible", () => {
    expect(getApplicationStatusLabel("refuse")).toBe("Refusé");
    expect(getApplicationStatusClassName("refuse")).toBe(
      "status-badge--rejected"
    );
  });

  test("gère un statut inconnu sans casser l'affichage", () => {
    expect(getApplicationStatusLabel("autre")).toBe("Statut inconnu");
    expect(getApplicationStatusClassName("autre")).toBe(
      "status-badge--unknown"
    );
  });
});
