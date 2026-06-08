export default function OfferTypeFilter({ selectedOfferType, onOfferTypeChange }) {
  return (
    <div className="offer-filter" aria-label="Filtrer par type d'offre">
      <button
        type="button"
        className={selectedOfferType === "all" ? "active" : ""}
        onClick={() => onOfferTypeChange("all")}
      >
        Tous
      </button>

      <button
        type="button"
        className={selectedOfferType === "purchase" ? "active" : ""}
        onClick={() => onOfferTypeChange("purchase")}
      >
        Achat
      </button>

      <button
        type="button"
        className={selectedOfferType === "rental" ? "active" : ""}
        onClick={() => onOfferTypeChange("rental")}
      >
        Location
      </button>
    </div>
  );
}