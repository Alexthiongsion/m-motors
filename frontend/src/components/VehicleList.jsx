import VehicleCard from "./VehicleCard";

export default function VehicleList({ vehicles, onJourneySelect }) {
  return (
    <section className="vehicle-list">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onJourneySelect={onJourneySelect}
        />
      ))}
    </section>
  );
}