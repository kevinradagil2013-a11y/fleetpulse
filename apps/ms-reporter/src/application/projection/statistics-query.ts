import { FleetStatistics } from "./statistics-projection.js";

export interface StatisticsQuery {
  getStatistics(): Promise<FleetStatistics | null>;
}
