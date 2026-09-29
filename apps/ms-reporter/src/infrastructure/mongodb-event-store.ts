import {
  Collection,
  Db,
  MongoClient
} from "mongodb";

import { EventStore } from "../../../../packages/events/event-store.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

export interface MongoEventStoreConfig {
  uri: string;
  database: string;
  collection: string;
}

export class MongoEventStore implements EventStore {
  private readonly client: MongoClient;
  private readonly collection: Collection<VehicleGeneratedEvent>;

  constructor(config: MongoEventStoreConfig) {
    this.client = new MongoClient(config.uri);

    const database: Db = this.client.db(config.database);

    this.collection =
      database.collection<VehicleGeneratedEvent>(
        config.collection
      );
  }

  async connect(): Promise<void> {
    await this.client.connect();

    await this.collection.createIndex(
      { aid: 1 },
      { unique: true }
    );
  }

  async append(
    event: VehicleGeneratedEvent
  ): Promise<boolean> {
    try {
      await this.collection.insertOne(event);
      return true;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return false;
      }

      throw error;
    }
  }

  async exists(aid: string): Promise<boolean> {
    const event = await this.collection.findOne(
      { aid },
      {
        projection: {
          _id: 1
        }
      }
    );

    return event !== null;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
