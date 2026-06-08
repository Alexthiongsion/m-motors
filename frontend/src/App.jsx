import { useEffect, useState } from "react";
import VehicleSearchBar from "./components/VehicleSearchBar";
import VehicleList from "./components/VehicleList";
import EmptyState from "./components/EmptyState";
import OfferTypeFilter from "./components/OfferTypeFilter";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import ApplicationForm from "./components/ApplicationForm";
import UserApplications from "./components/UserApplications";
import AdminVehicleManager from "./components/AdminVehicleManager";
import { fetchVehicles } from "./services/vehicleService";
import "./App.css";

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState("all");
  const [selectedJourney, setSelectedJourney] = useState(() => {
    const storedJourney = localStorage.getItem("selectedJourney");
    return storedJourney ? JSON.parse(storedJourney) : null;
  });
  const [applicationRefreshKey, setApplicationRefreshKey] = useState(0);
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

  function handleJourneySelect(vehicle, selectedType = vehicle.offer_type) {
  const journey = {
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    type: selectedType,
  };

  localStorage.setItem("selectedJourney", JSON.stringify(journey));
  setSelectedJourney(journey);
}

  function handleApplicationCreated() {
    setApplicationRefreshKey((currentValue) => currentValue + 1);
  }

  function handleVehiclesChanged() {
    loadVehicles(search, selectedOfferType);
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
        {currentUser ? (
          <section className="connected-user">
            <h2>Espace connecté</h2>

            <div className="user-summary">
              <p>
                Connecté en tant que <strong>{currentUser.email}</strong>
              </p>
              <p>
                Rôle : <strong>{currentUser.role}</strong>
              </p>
            </div>

            {currentUser.role === "admin" ? (
              <p className="protected-message">Accès administrateur disponible.</p>
            ) : (
              <p className="protected-message">Accès client disponible.</p>
            )}

            <button type="button" onClick={handleLogout}>
              Se déconnecter
            </button>

            {currentUser.role === "client" ? (
              <div className="client-dashboard">
                <ApplicationForm
                  currentUser={currentUser}
                  selectedJourney={selectedJourney}
                  onApplicationCreated={handleApplicationCreated}
                />

                <UserApplications
                  currentUser={currentUser}
                  refreshKey={applicationRefreshKey}
                />
              </div>
            ) : (
              <AdminVehicleManager
                currentUser={currentUser}
                onVehiclesChanged={handleVehiclesChanged}
              />
            )}
          </section>
        ) : (
          <div className="auth-grid">
            <RegisterForm />

            <section className="login-panel">
              <LoginForm onLogin={setCurrentUser} />
              <p className="protected-message">
                Connectez-vous pour accéder à votre espace personnel.
              </p>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}