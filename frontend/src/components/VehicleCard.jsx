export default function VehicleCard({ vehicle }) {
  const offerLabel = vehicle.offer_type === "purchase" ? "Achat" : "Location";
  const priceLabel =
    vehicle.offer_type === "purchase"
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
        <h2>{vehicle.brand} {vehicle.model}</h2>
        <p className="price">{priceLabel}</p>
      </div>
    </article>
  );
}
