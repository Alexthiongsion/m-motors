import { useEffect, useState } from "react";
import VehicleSearchBar from "./components/VehicleSearchBar";
import VehicleList from "./components/VehicleList";
import EmptyState from "./components/EmptyState";
import OfferTypeFilter from "./components/OfferTypeFilter";
import RegisterForm from "./components/RegisterForm";
import { fetchVehicles } from "./services/vehicleService";
import "./App.css";
import LoginForm from "./components/LoginForm";

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState("all");
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(() => {
  const storedUser = localStorage.getItem("currentUser");
  return storedUser ? JSON.parse(storedUser) : null;
});

  async function loadVehicles(searchValue = search, offerType = selectedOfferType) {
    try {
      setLoading(true);
      setError("");
      const data = await fetchVehicles(searchValue, offerType);
      setVehicles(data);
    } catch {
      setError("Une erreur est survenue lors du chargement des véhicules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles("", "all");
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    loadVehicles(search, selectedOfferType);
  }

  function handleOfferTypeChange(offerType) {
    setSelectedOfferType(offerType);
    loadVehicles(search, offerType);
  }

  function handleJourneySelect(vehicle) {
    const journey = {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      type: vehicle.offer_type,
    };

    localStorage.setItem("selectedJourney", JSON.stringify(journey));
    setSelectedJourney(journey);
  }

  function handleLogout() {
  localStorage.removeItem("currentUser");
  setCurrentUser(null);
}

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">M-Motors</p>
        <h1>Recherche de véhicules</h1>
        <p>Consultez les véhicules disponibles à l’achat ou à la location.</p>
      </section>

      <VehicleSearchBar
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSubmit}
      />

      <OfferTypeFilter
        selectedOfferType={selectedOfferType}
        onOfferTypeChange={handleOfferTypeChange}
      />

      {selectedJourney && (
        <p className="journey-confirmation">
          Parcours sélectionné :{" "}
          <strong>
            {selectedJourney.type === "purchase" ? "achat" : "location"}
          </strong>{" "}
          pour {selectedJourney.vehicleName}.
        </p>
      )}

      {loading && <p>Chargement des véhicules...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && vehicles.length === 0 && <EmptyState />}
      {!loading && !error && vehicles.length > 0 && (
        <VehicleList vehicles={vehicles} onJourneySelect={handleJourneySelect} />
      )}

      <section className="auth-area">
  <RegisterForm />

  {currentUser ? (
    <section className="connected-user">
      <h2>Espace connecté</h2>
      <p>
        Connecté en tant que <strong>{currentUser.email}</strong>
      </p>
      <p>
        Rôle : <strong>{currentUser.role}</strong>
      </p>

      {currentUser.role === "admin" ? (
        <p>Accès administrateur disponible.</p>
      ) : (
        <p>Accès client disponible.</p>
      )}

      <button type="button" onClick={handleLogout}>
        Se déconnecter
      </button>
    </section>
  ) : (
    <>
      <LoginForm onLogin={setCurrentUser} />
      <p className="protected-message">
        Connectez-vous pour accéder à votre espace personnel.
      </p>
    </>
  )}
</section>
    </main>
  );
}
