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
  vehiclesBySpeedClass: Record<string, number>;
  hpStats: HpStats;
  lastUpdated: string;
}

export interface FleetStatisticsWebSocketMessage {
  type: "fleet_statistics_updated";
  data: FleetStatistics & {
    _id?: string;
  };
}
