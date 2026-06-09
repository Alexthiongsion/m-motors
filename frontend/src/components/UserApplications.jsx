import { useEffect, useState } from "react";
import { fetchUserApplications } from "../services/applicationService";
import ApplicationDocuments from "./ApplicationDocuments";

export function getApplicationStatusLabel(status) {
  const labels = {
    en_attente: "En attente",
    en_cours: "En cours d’analyse",
    valide: "Validé",
    refuse: "Refusé",
  };

  return labels[status] || "Statut inconnu";
}

export function getApplicationStatusClassName(status) {
  const classNames = {
    en_attente: "status-badge--pending",
    en_cours: "status-badge--progress",
    valide: "status-badge--approved",
    refuse: "status-badge--rejected",
  };

  return classNames[status] || "status-badge--unknown";
}

export default function UserApplications({ currentUser, refreshKey }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    async function loadApplications() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchUserApplications(currentUser.id);
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [currentUser, refreshKey]);

  if (!currentUser) {
    return null;
  }

  return (
    <section className="user-applications">
      <h2>Mes dossiers</h2>

      {loading && <p>Chargement des dossiers...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && applications.length === 0 && (
        <p>Aucun dossier déposé pour le moment.</p>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="application-list">
          {applications.map((application) => (
            <article className="application-card" key={application.id}>
              <h3>
                {application.brand} {application.model}
              </h3>

              <p>
                Type :{" "}
                <strong>
                  {application.offer_type === "purchase" ? "Achat" : "Location"}
                </strong>
              </p>

              <p className="application-status">
                Statut :{" "}
                <span
                  className={`status-badge ${getApplicationStatusClassName(
                    application.status
                  )}`}
                >
                  {getApplicationStatusLabel(application.status)}
                </span>
              </p>

              {application.message && <p>{application.message}</p>}
                            <ApplicationDocuments
                applicationId={application.id}
                currentUser={currentUser}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
