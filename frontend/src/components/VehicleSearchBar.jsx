export default function VehicleSearchBar({ search, onSearchChange, onSubmit }) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Rechercher par marque ou modèle"
        aria-label="Rechercher un véhicule"
      />
      <button type="submit">Rechercher</button>
    </form>
  );
}
