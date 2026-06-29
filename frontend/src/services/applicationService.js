const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function createApplication(applicationData) {
  const response = await fetch(`${API_URL}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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
  const response = await fetch(`${API_URL}/api/applications/user/${userId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des dossiers.");
  }

  return data;
}

export async function fetchAdminApplications(adminUserId) {
  const response = await fetch(`${API_URL}/api/applications/admin`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des dossiers administrateur.");
  }

  return data;
}

export async function fetchAdminApplicationDetail(adminUserId, applicationId) {
  const response = await fetch(`${API_URL}/api/applications/admin/${applicationId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement du dossier.");
  }

  return data;
}

export async function updateApplicationStatus(adminUserId, applicationId, status) {
  const response = await fetch(
    `${API_URL}/api/applications/admin/${applicationId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de la mise à jour du statut.");
  }

  return data;
}

export async function uploadApplicationDocument(applicationId, userId, file) {
  const formData = new FormData();

  formData.append("document", file);

  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/documents`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de l'envoi du document.");
  }

  return data;
}

export async function fetchApplicationDocuments(applicationId, userId) {
  const response = await fetch(`${API_URL}/api/applications/${applicationId}/documents`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des documents.");
  }

  return data;
}