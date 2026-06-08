import { useEffect, useState } from "react";
import {
  fetchAdminApplicationDetail,
  fetchAdminApplications,
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
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

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

    loadApplications();
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

  return (
    <section className="admin-application-manager">
      <h2>Consultation des dossiers</h2>
      <p className="admin-helper">
        Consultez les dossiers déposés par les clients.
      </p>

      {loading && <p>Chargement des dossiers...</p>}
      {error && <p className="error">{error}</p>}

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

              <button
                type="button"
                onClick={() => handleShowDetail(application.id)}
              >
                Voir le détail
              </button>
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
        </article>
      )}
    </section>
  );
}