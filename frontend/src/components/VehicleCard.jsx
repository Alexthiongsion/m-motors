export default function VehicleCard({ vehicle, onJourneySelect }) {
  const isPurchase = vehicle.offer_type === "purchase";
  const offerLabel = isPurchase ? "Achat" : "Location";
  const actionLabel = isPurchase ? "Acheter" : "Louer";

  const priceLabel = isPurchase
    ? `${vehicle.price.toLocaleString("fr-FR")} €`
    : `${vehicle.price.toLocaleString("fr-FR")} € / mois`;

  return (
    <article className="vehicle-card">
      <div className="vehicle-image">
        {vehicle.image_url ? (
          <img src={vehicle.image_url} alt={`${vehicle.brand} ${vehicle.model}`} />
        ) : (
          <span>Image véhicule</span>
        )}
      </div>

      <div className="vehicle-content">
        <span className="offer-badge">{offerLabel}</span>
        <h2>
          {vehicle.brand} {vehicle.model}
        </h2>
        <p className="price">{priceLabel}</p>

        <button
          type="button"
          className="journey-button"
          onClick={() => onJourneySelect(vehicle)}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
