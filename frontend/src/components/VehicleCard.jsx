export default function VehicleCard({ vehicle, onJourneySelect }) {
  const isPurchase = vehicle.offer_type === "purchase";
  const isRental = vehicle.offer_type === "rental";
  const isBoth = vehicle.offer_type === "both";

  const offerLabel = isBoth ? "Achat et location" : isPurchase ? "Achat" : "Location";

  const priceLabel = isRental
    ? `${vehicle.price.toLocaleString("fr-FR")} € / mois`
    : `${vehicle.price.toLocaleString("fr-FR")} €`;

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

        {isBoth ? (
          <div className="journey-actions">
            <button
              type="button"
              className="journey-button"
              onClick={() => onJourneySelect(vehicle, "purchase")}
            >
              Acheter
            </button>

            <button
              type="button"
              className="journey-button"
              onClick={() => onJourneySelect(vehicle, "rental")}
            >
              Louer
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="journey-button"
            onClick={() => onJourneySelect(vehicle, vehicle.offer_type)}
          >
            {isPurchase ? "Acheter" : "Louer"}
          </button>
        )}
      </div>
    </article>
  );
}