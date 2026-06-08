import { useEffect, useState } from "react";
import { fetchUserApplications } from "../services/applicationService";

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
              <p>
                Statut : <strong>{application.status}</strong>
              </p>
              {application.message && <p>{application.message}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
