const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

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

export async function fetchAdminVehicles(adminUserId) {
  const response = await fetch(`${API_URL}/api/vehicles/admin`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des véhicules administrateur");
  }

  return response.json();
}

export async function createVehicle(adminUserId, vehicleData) {
  const response = await fetch(`${API_URL}/api/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(vehicleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de la création du véhicule");
  }

  return data;
}

export async function updateVehicle(adminUserId, vehicleId, vehicleData) {
  const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(vehicleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de la modification du véhicule");
  }

  return data;
}