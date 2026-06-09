import { useEffect, useState } from "react";
import {
  fetchApplicationDocuments,
  uploadApplicationDocument,
} from "../services/applicationService";

export default function ApplicationDocuments({ applicationId, currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchApplicationDocuments(applicationId, currentUser.id);
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (applicationId && currentUser?.id) {
      loadDocuments();
    }
  }, [applicationId, currentUser?.id]);

  function handleFileChange(event) {
    setSelectedFile(event.target.files[0] || null);
    setFeedback("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Veuillez sélectionner un document.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setFeedback("");

      await uploadApplicationDocument(
        applicationId,
        currentUser.id,
        selectedFile
      );

      setFeedback("Document envoyé avec succès.");
      setSelectedFile(null);
      event.target.reset();

      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="application-documents">
      <h4>Documents justificatifs</h4>

      <form className="document-upload-form" onSubmit={handleSubmit}>
        <label>
          Ajouter un document
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFileChange}
          />
        </label>

        <button type="submit" disabled={uploading}>
          {uploading ? "Envoi en cours..." : "Envoyer le document"}
        </button>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p>Chargement des documents...</p>}

      {!loading && documents.length === 0 && (
        <p>Aucun document envoyé pour ce dossier.</p>
      )}

      {!loading && documents.length > 0 && (
        <ul className="document-list">
          {documents.map((document) => (
            <li key={document.id}>
              {document.original_name} —{" "}
              {(document.file_size / 1024).toFixed(1)} Ko
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}