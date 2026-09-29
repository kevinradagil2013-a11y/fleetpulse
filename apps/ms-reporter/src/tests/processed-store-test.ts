import { MongoProcessedEventStore } from "../infrastructure/mongodb-processed-event-store.js";

const store = new MongoProcessedEventStore({
  uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
  database: "fleetpulse",
  collection: "processed_vehicles"
});

const aid = "fleetpulse-processed-test-001";

try {
  await store.connect();

  const first = await store.markAsProcessed(aid);
  const second = await store.markAsProcessed(aid);

  console.log(
    `[processed-store-test] first=${first}`
  );

  console.log(
    `[processed-store-test] second=${second}`
  );
} finally {
  await store.close();
}
