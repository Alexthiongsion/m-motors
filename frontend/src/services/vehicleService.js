const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export async function fetchVehicles(search = "") {
  const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await fetch(`${API_URL}/api/vehicles${params}`);

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des véhicules");
  }

  return response.json();
}
