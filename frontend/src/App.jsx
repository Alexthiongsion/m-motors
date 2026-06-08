import { useEffect, useState } from "react";
import VehicleSearchBar from "./components/VehicleSearchBar";
import VehicleList from "./components/VehicleList";
import EmptyState from "./components/EmptyState";
import { fetchVehicles } from "./services/vehicleService";
import "./App.css";

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVehicles(searchValue = "") {
    try {
      setLoading(true);
      setError("");
      const data = await fetchVehicles(searchValue);
      setVehicles(data);
    } catch {
      setError("Une erreur est survenue lors du chargement des véhicules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    loadVehicles(search);
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

      {loading && <p>Chargement des véhicules...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && vehicles.length === 0 && <EmptyState />}
      {!loading && !error && vehicles.length > 0 && <VehicleList vehicles={vehicles} />}
    </main>
  );
}
