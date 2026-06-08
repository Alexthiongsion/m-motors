import { useState } from "react";
import { registerUser } from "../services/authService";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess("");
    setError("");

    try {
      const data = await registerUser(formData);
      setSuccess(data.message);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="register-section">
      <h2>Créer un compte</h2>
      <p>Créez votre compte pour préparer le dépôt de votre dossier.</p>

      <form className="register-form" onSubmit={handleSubmit}>
        <label>
          Prénom
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Nom
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </label>

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
            minLength="8"
          />
        </label>

        <button type="submit">Créer mon compte</button>
      </form>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
