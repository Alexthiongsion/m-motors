const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export async function createApplication(applicationData) {
  const response = await fetch(`${API_URL}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du dépôt du dossier.");
  }

  return data;
}

export async function fetchUserApplications(userId) {
  const response = await fetch(`${API_URL}/api/applications/user/${userId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des dossiers.");
  }

  return data;
}
