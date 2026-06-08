import { useState } from "react";
import { createApplication } from "../services/applicationService";

export default function ApplicationForm({
  currentUser,
  selectedJourney,
  onApplicationCreated,
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  if (!currentUser) {
    return (
      <p className="protected-message">
        Connectez-vous pour déposer un dossier.
      </p>
    );
  }

  if (!selectedJourney) {
    return (
      <p className="protected-message">
        Sélectionnez d’abord un véhicule et un parcours achat/location.
      </p>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setSuccessMessage("");

      const response = await createApplication({
        userId: currentUser.id,
        vehicleId: selectedJourney.vehicleId,
        offerType: selectedJourney.type,
        phone,
        message,
      });

      setSuccessMessage(response.message);
      setPhone("");
      setMessage("");

      if (onApplicationCreated) {
        onApplicationCreated();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="application-form-section">
      <h2>Déposer un dossier</h2>

      <p>
        Véhicule sélectionné : <strong>{selectedJourney.vehicleName}</strong>
      </p>

      <p>
        Type de demande :{" "}
        <strong>
          {selectedJourney.type === "purchase" ? "Achat" : "Location"}
        </strong>
      </p>

      <form className="application-form" onSubmit={handleSubmit}>
        <label htmlFor="phone">Téléphone</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0600000000"
          required
        />

        <label htmlFor="application-message">Message</label>
        <textarea
          id="application-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Précisez votre demande si nécessaire."
          rows="4"
        />

        <button type="submit">Déposer le dossier</button>
      </form>

      {successMessage && <p className="success">{successMessage}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
