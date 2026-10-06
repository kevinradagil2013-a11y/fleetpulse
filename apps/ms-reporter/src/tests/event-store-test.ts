import { MongoEventStore } from "../infrastructure/mongodb-event-store.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

const store = new MongoEventStore({
  uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
  database: "fleetpulse",
  collection: "vehicle_generated_events"
});

const event: VehicleGeneratedEvent = {
  at: "Vehicle",
  et: "Generated",
  aid: "fleetpulse-idempotency-test-001",
  timestamp: "2026-10-06T14:00:00.000Z",
  data: {
    type: "SUV",
    powerSource: "Electric",
    hp: 200,
    year: 2025,
    topSpeed: 220
  }
};

try {
  await store.connect();

  const firstInsert = await store.append(event);
  const secondInsert = await store.append(event);
  const exists = await store.exists(event.aid);

  console.log(
    `[event-store-test] firstInsert=${firstInsert}`
  );

  console.log(
    `[event-store-test] secondInsert=${secondInsert}`
  );

  console.log(
    `[event-store-test] exists=${exists}`
  );
} finally {
  await store.close();
}
