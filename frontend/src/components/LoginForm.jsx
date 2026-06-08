import { useState } from "react";
import { loginUser } from "../services/authService";

export default function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const data = await loginUser(formData);

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      onLogin(data.user);

      setMessage(`Connexion réussie. Rôle : ${data.user.role}`);
      setFormData({
        email: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="form-section">
      <h2>Connexion</h2>

      <form className="account-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">Se connecter</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}