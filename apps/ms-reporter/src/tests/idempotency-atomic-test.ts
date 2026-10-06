import { MongoStatisticsRepository } from "../infrastructure/mongodb-statistics-repository.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

const repository =
  new MongoStatisticsRepository({
    uri: "mongodb://localhost:27017",
    database: "fleetpulse",
    collection: "fleet_statistics"
  });

const event: VehicleGeneratedEvent = {
  at: "Vehicle",
  et: "Generated",
  aid: "idempotency-test-001",
  timestamp: "2026-10-06T17:20:00.000Z",
  data: {
    type: "Sedan",
    powerSource: "Hybrid",
    hp: 150,
    year: 2020,
    topSpeed: 180
  }
};

try {
  await repository.connect();

  const first =
    await repository.applyEventAtomically(event);

  const second =
    await repository.applyEventAtomically(event);

  console.log(
    JSON.stringify(
      {
        firstProcessed: first.processed,
        secondProcessed: second.processed,
        firstTotalVehicles:
          first.statistics.totalVehicles,
        secondTotalVehicles:
          second.statistics.totalVehicles
      },
      null,
      2
    )
  );
} finally {
  await repository.close();
}
