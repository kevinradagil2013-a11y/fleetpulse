import { VehicleGeneratedEvent } from "../../../../../packages/events/vehicle-generated.js";
import { classifySpeed } from "./speed-classifier.js";
import {
  FleetStatistics,
  HpStats
} from "./statistics-projection.js";

function getDecade(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function createEmptyHpStats(): HpStats {
  return {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    sum: 0,
    count: 0,
    avg: 0
  };
}

function createInitialStatistics(): FleetStatistics {
  return {
    totalVehicles: 0,

    vehiclesByType: {},

    vehiclesByDecade: {},

    vehiclesBySpeedClass: {
      Lento: 0,
      Normal: 0,
      Rapido: 0
    },

    hpStats: createEmptyHpStats(),

    lastUpdated: new Date(0).toISOString()
  };
}

export function projectBatch(
  events: VehicleGeneratedEvent[]
): FleetStatistics {
  const statistics = createInitialStatistics();

  for (const event of events) {
    const {
      type,
      hp,
      year,
      topSpeed
    } = event.data;

    statistics.totalVehicles += 1;

    statistics.vehiclesByType[type] =
      (statistics.vehiclesByType[type] ?? 0) + 1;

    const decade = getDecade(year);

    statistics.vehiclesByDecade[decade] =
      (statistics.vehiclesByDecade[decade] ?? 0) + 1;

    const speedClass = classifySpeed(topSpeed);

    statistics.vehiclesBySpeedClass[speedClass] += 1;

    statistics.hpStats.min = Math.min(
      statistics.hpStats.min,
      hp
    );

    statistics.hpStats.max = Math.max(
      statistics.hpStats.max,
      hp
    );

    statistics.hpStats.sum += hp;

    statistics.hpStats.count += 1;
  }

  if (statistics.hpStats.count > 0) {
    statistics.hpStats.avg =
      statistics.hpStats.sum /
      statistics.hpStats.count;
  } else {
    statistics.hpStats.min = 0;
    statistics.hpStats.max = 0;
  }

  statistics.lastUpdated =
    new Date().toISOString();

  return statistics;
}
