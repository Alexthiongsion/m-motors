const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export async function fetchVehicles(search = "", offerType = "all") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (offerType !== "all") {
    params.append("offerType", offerType);
  }

  const queryString = params.toString();
  const response = await fetch(
    `${API_URL}/api/vehicles${queryString ? `?${queryString}` : ""}`
  );

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des véhicules");
  }

  return response.json();
}