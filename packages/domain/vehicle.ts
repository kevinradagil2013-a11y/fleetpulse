import { createHash } from "node:crypto";
import {
  VehicleGeneratedData,
  VehicleGeneratedEvent
} from "../events/vehicle-generated.js";

export function createVehicleGeneratedEvent(
  data: VehicleGeneratedData
): VehicleGeneratedEvent {
  const canonicalData = JSON.stringify({
    type: data.type,
    powerSource: data.powerSource,
    hp: data.hp,
    year: data.year,
    topSpeed: data.topSpeed
  });

  const aid = createHash("sha256")
    .update(`Vehicle|Generated|${canonicalData}`)
    .digest("hex");

  return {
    at: "Vehicle",
    et: "Generated",
    aid,
    timestamp: new Date().toISOString(),
    data
  };
}
