import { VehicleGeneratedEvent } from "../../../../../packages/events/vehicle-generated.js";

export type SpeedClass =
  | "Lento"
  | "Normal"
  | "Rapido";

export interface HpStats {
  min: number;
  max: number;
  sum: number;
  count: number;
  avg: number;
}

export interface FleetStatistics {
  totalVehicles: number;

  vehiclesByType: Record<string, number>;

  vehiclesByDecade: Record<string, number>;

  vehiclesBySpeedClass: Record<SpeedClass, number>;

  hpStats: HpStats;

  lastUpdated: string;
}

export interface StatisticsProjection {
  apply(
    events: VehicleGeneratedEvent[]
  ): Promise<FleetStatistics>;
}
