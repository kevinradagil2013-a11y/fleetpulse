import { VehicleGeneratedEvent } from "../../../../../packages/events/vehicle-generated.js";
import { FleetStatistics } from "./statistics-projection.js";

export interface StatisticsRepository {
  applyBatch(
    statistics: FleetStatistics
  ): Promise<FleetStatistics>;

  applyEventAtomically(
    event: VehicleGeneratedEvent
  ): Promise<{
    statistics: FleetStatistics;
    processed: boolean;
  }>;
}
