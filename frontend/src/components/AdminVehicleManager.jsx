import { useEffect, useState } from "react";
import {
  createVehicle,
  fetchAdminVehicles,
  updateVehicle,
} from "../services/vehicleService";

const emptyForm = {
  brand: "",
  model: "",
  price: "",
  offerType: "purchase",
  isAvailable: true,
  imageUrl: "",
};

function getOfferLabel(offerType) {
  if (offerType === "purchase") return "Achat";
  if (offerType === "rental") return "Location";
  if (offerType === "both") return "Achat et location";
  return offerType;
}

export default function AdminVehicleManager({ currentUser, onVehiclesChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadAdminVehicles() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminVehicles(currentUser.id);
      setVehicles(data);
    } catch {
      setError("Impossible de charger les véhicules administrateur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      loadAdminVehicles();
    }
  }, [currentUser?.id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingVehicleId(null);
  }

  function handleEdit(vehicle) {
    setEditingVehicleId(vehicle.id);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      price: vehicle.price,
      offerType: vehicle.offer_type,
      isAvailable: vehicle.is_available,
      imageUrl: vehicle.image_url || "",
    });
    setFeedback("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setFeedback("");

      const payload = {
        brand: formData.brand,
        model: formData.model,
        price: Number(formData.price),
        offerType: formData.offerType,
        isAvailable: formData.isAvailable,
        imageUrl: formData.imageUrl.trim() || null,
      };

      if (editingVehicleId) {
        await updateVehicle(currentUser.id, editingVehicleId, payload);
        setFeedback("Véhicule modifié avec succès.");
      } else {
        await createVehicle(currentUser.id, payload);
        setFeedback("Véhicule créé avec succès.");
      }

      resetForm();
      await loadAdminVehicles();

      if (onVehiclesChanged) {
        onVehiclesChanged();
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <section className="admin-vehicle-manager">
      <h2>Gestion des véhicules</h2>
      <p className="admin-helper">
        Ajoutez ou modifiez les véhicules visibles dans le catalogue client.
      </p>

      <form className="admin-vehicle-form" onSubmit={handleSubmit}>
        <label>
          Marque
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Modèle
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Prix
          <input
            type="number"
            name="price"
            min="0"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Type d’offre
          <select
            name="offerType"
            value={formData.offerType}
            onChange={handleChange}
            required
          >
            <option value="purchase">Achat</option>
            <option value="rental">Location</option>
            <option value="both">Achat et location</option>
          </select>
        </label>

        <label>
          Image URL
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
          />
          Disponible dans le catalogue client
        </label>

        <div className="admin-form-actions">
          <button type="submit">
            {editingVehicleId ? "Modifier le véhicule" : "Créer le véhicule"}
          </button>

          {editingVehicleId && (
            <button type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}

      <h3>Catalogue administrateur</h3>

      {loading && <p>Chargement des véhicules...</p>}

      {!loading && vehicles.length > 0 && (
        <div className="admin-vehicle-list">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="admin-vehicle-item">
              <div>
                <h4>
                  {vehicle.brand} {vehicle.model}
                </h4>
                <p>Prix : {vehicle.price.toLocaleString("fr-FR")} €</p>
                <p>Offre : {getOfferLabel(vehicle.offer_type)}</p>
                <p>
                  Statut :{" "}
                  <strong>
                    {vehicle.is_available ? "Disponible" : "Indisponible"}
                  </strong>
                </p>
              </div>

              <button type="button" onClick={() => handleEdit(vehicle)}>
                Modifier
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}