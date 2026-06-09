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

export async function fetchAdminApplications(adminUserId) {
  const response = await fetch(
    `${API_URL}/api/applications/admin?adminUserId=${adminUserId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des dossiers administrateur.");
  }

  return data;
}

export async function fetchAdminApplicationDetail(adminUserId, applicationId) {
  const response = await fetch(
    `${API_URL}/api/applications/admin/${applicationId}?adminUserId=${adminUserId}`
  );

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
      },
      body: JSON.stringify({
        adminUserId,
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

  formData.append("userId", userId);
  formData.append("document", file);

  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/documents`,
    {
      method: "POST",
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
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/documents?userId=${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors du chargement des documents.");
  }

  return data;
}