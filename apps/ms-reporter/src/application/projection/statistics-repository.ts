import { FleetStatistics } from "./statistics-projection.js";

export interface StatisticsRepository {
  applyBatch(
    statistics: FleetStatistics
  ): Promise<FleetStatistics>;
}
