import { createVehicleGeneratedEvent } from "../../../../packages/domain/vehicle.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

const VEHICLE_TYPES = ["SUV", "PickUp", "Sedan"] as const;

const POWER_SOURCES = [
  "Gasoline",
  "Diesel",
  "Hybrid",
  "Electric"
] as const;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateVehicle(): VehicleGeneratedEvent {
  const data = {
    type: randomItem(VEHICLE_TYPES),
    powerSource: randomItem(POWER_SOURCES),
    hp: randomInteger(75, 300),
    year: randomInteger(1980, 2025),
    topSpeed: randomInteger(100, 300)
  };

  return createVehicleGeneratedEvent(data);
}
