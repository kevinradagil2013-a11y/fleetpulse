import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";
import { projectBatch } from "../application/projection/project-batch.js";

const events: VehicleGeneratedEvent[] = [
  {
    at: "Vehicle",
    et: "Generated",
    aid: "projection-test-001",
    timestamp: "2026-10-06T14:00:00.000Z",
    data: {
      type: "SUV",
      powerSource: "Electric",
      hp: 200,
      year: 2025,
      topSpeed: 220
    }
  },
  {
    at: "Vehicle",
    et: "Generated",
    aid: "projection-test-002",
    timestamp: "2026-10-06T14:00:01.000Z",
    data: {
      type: "SUV",
      powerSource: "Gasoline",
      hp: 150,
      year: 2018,
      topSpeed: 140
    }
  },
  {
    at: "Vehicle",
    et: "Generated",
    aid: "projection-test-003",
    timestamp: "2026-10-06T14:00:02.000Z",
    data: {
      type: "PickUp",
      powerSource: "Diesel",
      hp: 300,
      year: 2005,
      topSpeed: 280
    }
  }
];

const result = projectBatch(events);

console.log(
  JSON.stringify(result, null, 2)
);
