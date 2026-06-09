import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ApplicationDocuments from "./ApplicationDocuments";
import {
  fetchApplicationDocuments,
  uploadApplicationDocument,
} from "../services/applicationService";

vi.mock("../services/applicationService", () => ({
  fetchApplicationDocuments: vi.fn(),
  uploadApplicationDocument: vi.fn(),
}));

const currentUser = {
  id: 1,
  email: "client@test.com",
  role: "client",
};

const documents = [
  {
    id: 10,
    application_id: 5,
    original_name: "justificatif.pdf",
    file_size: 2048,
    mime_type: "application/pdf",
  },
];

describe("ApplicationDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchApplicationDocuments.mockResolvedValue(documents);
    uploadApplicationDocument.mockResolvedValue({
      message: "Document envoyé avec succès.",
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("affiche les documents déjà envoyés", async () => {
    render(<ApplicationDocuments applicationId={5} currentUser={currentUser} />);

    expect(screen.getByText("Documents justificatifs")).toBeTruthy();
    expect(await screen.findByText(/justificatif.pdf/)).toBeTruthy();
  });

  test("envoie un document pour un dossier client", async () => {
    const user = userEvent.setup();

    render(<ApplicationDocuments applicationId={5} currentUser={currentUser} />);

    const file = new File(["contenu"], "document.pdf", {
      type: "application/pdf",
    });

    await user.upload(screen.getByLabelText("Ajouter un document"), file);
    await user.click(screen.getByRole("button", { name: "Envoyer le document" }));

    await waitFor(() => {
      expect(uploadApplicationDocument).toHaveBeenCalledWith(5, 1, file);
    });

    expect(await screen.findByText("Document envoyé avec succès.")).toBeTruthy();
  });

  test("affiche une erreur si aucun document n'est sélectionné", async () => {
    const user = userEvent.setup();

    render(<ApplicationDocuments applicationId={5} currentUser={currentUser} />);

    await user.click(screen.getByRole("button", { name: "Envoyer le document" }));

    expect(await screen.findByText("Veuillez sélectionner un document.")).toBeTruthy();
  });
});