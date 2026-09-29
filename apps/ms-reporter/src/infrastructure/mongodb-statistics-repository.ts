import {
  Collection,
  MongoClient
} from "mongodb";

import {
  FleetStatistics,
  HpStats
} from "../application/projection/statistics-projection.js";

import {
  StatisticsRepository
} from "../application/projection/statistics-repository.js";

import {
  StatisticsQuery
} from "../application/projection/statistics-query.js";

export interface MongoStatisticsRepositoryConfig {
  uri: string;
  database: string;
  collection: string;
}

interface FleetStatisticsDocument {
  _id: string;
  totalVehicles: number;
  vehiclesByType: Record<string, number>;
  vehiclesByDecade: Record<string, number>;
  vehiclesBySpeedClass: Record<string, number>;
  hpStats: HpStats;
  lastUpdated: string;
}

export class MongoStatisticsRepository
  implements StatisticsRepository, StatisticsQuery {

  private readonly client: MongoClient;

  private readonly collection:
    Collection<FleetStatisticsDocument>;

  private readonly documentId =
    "real_time_fleet_stats";

  constructor(
    config: MongoStatisticsRepositoryConfig
  ) {
    this.client = new MongoClient(config.uri);

    const database =
      this.client.db(config.database);

    this.collection =
      database.collection<FleetStatisticsDocument>(
        config.collection
      );
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async getStatistics(): Promise<FleetStatistics | null> {
    const document =
      await this.collection.findOne({
        _id: this.documentId
      });

    if (!document) {
      return null;
    }

    return {
      totalVehicles:
        document.totalVehicles,

      vehiclesByType:
        document.vehiclesByType,

      vehiclesByDecade:
        document.vehiclesByDecade,

      vehiclesBySpeedClass:
        document.vehiclesBySpeedClass as FleetStatistics["vehiclesBySpeedClass"],

      hpStats:
        document.hpStats,

      lastUpdated:
        document.lastUpdated
    };
  }

  async applyBatch(
    statistics: FleetStatistics
  ): Promise<FleetStatistics> {

    const current =
      await this.collection.findOne({
        _id: this.documentId
      });

    const previousSum =
      current?.hpStats?.sum ?? 0;

    const previousCount =
      current?.hpStats?.count ?? 0;

    const nextSum =
      previousSum + statistics.hpStats.sum;

    const nextCount =
      previousCount + statistics.hpStats.count;

    const nextAvg =
      nextCount > 0
        ? nextSum / nextCount
        : 0;

    const typeIncrements:
      Record<string, number> = {};

    for (
      const [type, count]
      of Object.entries(
        statistics.vehiclesByType
      )
    ) {
      typeIncrements[
        `vehiclesByType.${type}`
      ] = count;
    }

    const decadeIncrements:
      Record<string, number> = {};

    for (
      const [decade, count]
      of Object.entries(
        statistics.vehiclesByDecade
      )
    ) {
      decadeIncrements[
        `vehiclesByDecade.${decade}`
      ] = count;
    }

    const speedIncrements:
      Record<string, number> = {};

    for (
      const [speedClass, count]
      of Object.entries(
        statistics.vehiclesBySpeedClass
      )
    ) {
      speedIncrements[
        `vehiclesBySpeedClass.${speedClass}`
      ] = count;
    }

    const updated =
      await this.collection.findOneAndUpdate(
        {
          _id: this.documentId
        },
        {
          $inc: {
            totalVehicles:
              statistics.totalVehicles,

            ...typeIncrements,
            ...decadeIncrements,
            ...speedIncrements,

            "hpStats.sum":
              statistics.hpStats.sum,

            "hpStats.count":
              statistics.hpStats.count
          },

          $min: {
            "hpStats.min":
              statistics.hpStats.min
          },

          $max: {
            "hpStats.max":
              statistics.hpStats.max
          },

          $set: {
            "hpStats.avg": nextAvg,
            lastUpdated:
              statistics.lastUpdated
          }
        },
        {
          upsert: true,
          returnDocument: "after"
        }
      );

    if (!updated) {
      throw new Error(
        "No se pudo obtener fleet_statistics actualizado"
      );
    }

    return updated;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
