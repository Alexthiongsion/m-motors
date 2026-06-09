import { useEffect, useState } from "react";
import {
  fetchAdminApplicationDetail,
  fetchAdminApplications,
  updateApplicationStatus,
} from "../services/applicationService";
import {
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "./UserApplications";

function getOfferTypeLabel(offerType) {
  return offerType === "purchase" ? "Achat" : "Location";
}

export default function AdminApplicationManager({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchAdminApplications(currentUser.id);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      loadApplications();
    }
  }, [currentUser?.id]);

  async function handleShowDetail(applicationId) {
    try {
      setDetailLoading(true);
      setDetailError("");

      const data = await fetchAdminApplicationDetail(currentUser.id, applicationId);
      setSelectedApplication(data);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleStatusUpdate(applicationId, status) {
    try {
      setStatusUpdatingId(applicationId);
      setFeedback("");
      setDetailError("");

      await updateApplicationStatus(currentUser.id, applicationId, status);
      setFeedback("Statut du dossier mis à jour avec succès.");

      await loadApplications();

      if (selectedApplication?.id === applicationId) {
        const updatedDetail = await fetchAdminApplicationDetail(
          currentUser.id,
          applicationId
        );
        setSelectedApplication(updatedDetail);
      }
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function renderStatusActions(application) {
    const isUpdating = statusUpdatingId === application.id;

    return (
      <div className="application-decision-actions">
        <button
          type="button"
          onClick={() => handleStatusUpdate(application.id, "en_cours")}
          disabled={isUpdating}
        >
          En cours
        </button>

        <button
          type="button"
          onClick={() => handleStatusUpdate(application.id, "valide")}
          disabled={isUpdating}
        >
          Valider
        </button>

        <button
          type="button"
          onClick={() => handleStatusUpdate(application.id, "refuse")}
          disabled={isUpdating}
        >
          Refuser
        </button>
      </div>
    );
  }

  return (
    <section className="admin-application-manager">
      <h2>Consultation des dossiers</h2>
      <p className="admin-helper">
        Consultez les dossiers déposés par les clients.
      </p>

      {loading && <p>Chargement des dossiers...</p>}
      {error && <p className="error">{error}</p>}
      {feedback && <p className="success">{feedback}</p>}

      {!loading && !error && applications.length === 0 && (
        <p>Aucun dossier client pour le moment.</p>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="admin-application-list">
          {applications.map((application) => (
            <article className="admin-application-item" key={application.id}>
              <div>
                <h3>
                  Dossier #{application.id} — {application.first_name}{" "}
                  {application.last_name}
                </h3>

                <p>Email client : {application.email}</p>
                <p>
                  Véhicule : {application.brand} {application.model}
                </p>
                <p>
                  Type : <strong>{getOfferTypeLabel(application.offer_type)}</strong>
                </p>
                <p>
                  Statut :{" "}
                  <span
                    className={`status-badge ${getApplicationStatusClassName(
                      application.status
                    )}`}
                  >
                    {getApplicationStatusLabel(application.status)}
                  </span>
                </p>
              </div>

              <div className="admin-application-actions">
                <button
                  type="button"
                  onClick={() => handleShowDetail(application.id)}
                >
                  Voir le détail
                </button>

                {renderStatusActions(application)}
              </div>
            </article>
          ))}
        </div>
      )}

      {detailLoading && <p>Chargement du détail...</p>}
      {detailError && <p className="error">{detailError}</p>}

      {selectedApplication && (
        <article className="admin-application-detail">
          <h3>Détail du dossier #{selectedApplication.id}</h3>

          <p>
            Client : {selectedApplication.first_name}{" "}
            {selectedApplication.last_name} — {selectedApplication.email}
          </p>

          <p>
            Véhicule : {selectedApplication.brand} {selectedApplication.model}
          </p>

          <p>
            Type de demande :{" "}
            <strong>{getOfferTypeLabel(selectedApplication.offer_type)}</strong>
          </p>

          <p>
            Statut :{" "}
            <span
              className={`status-badge ${getApplicationStatusClassName(
                selectedApplication.status
              )}`}
            >
              {getApplicationStatusLabel(selectedApplication.status)}
            </span>
          </p>

          <p>Téléphone : {selectedApplication.phone}</p>

          {selectedApplication.message ? (
            <p>Message : {selectedApplication.message}</p>
          ) : (
            <p>Message : aucun message fourni.</p>
          )}

          {renderStatusActions(selectedApplication)}
        </article>
      )}
    </section>
  );
}