import { MongoStatisticsRepository } from "../infrastructure/mongodb-statistics-repository.js";
import { projectBatch } from "../application/projection/project-batch.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

const repository =
  new MongoStatisticsRepository({
    uri:
      process.env.MONGODB_URI ??
      "mongodb://localhost:27017",

    database: "fleetpulse",

    collection: "fleet_statistics"
  });

const secondBatch: VehicleGeneratedEvent[] = [
  {
    at: "Vehicle",
    et: "Generated",
    aid: "mongo-projection-test-004",
    data: {
      type: "Sedan",
      powerSource: "Hybrid",
      hp: 100,
      year: 1995,
      topSpeed: 120
    }
  }
];

try {
  await repository.connect();

  const statistics =
    projectBatch(secondBatch);

  const result =
    await repository.applyBatch(statistics);

  console.log(
    JSON.stringify(result, null, 2)
  );
} finally {
  await repository.close();
}
