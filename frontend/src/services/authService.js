const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de la création du compte.");
  }

  return data;
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur lors de la connexion.");
  }

  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
}
