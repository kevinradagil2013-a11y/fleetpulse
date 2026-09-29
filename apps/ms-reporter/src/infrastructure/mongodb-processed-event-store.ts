import {
  Collection,
  MongoClient
} from "mongodb";

import {
  ProcessedEventStore
} from "../application/processed-event-store.js";

export interface MongoProcessedEventStoreConfig {
  uri: string;
  database: string;
  collection: string;
}

interface ProcessedEventDocument {
  aid: string;
  processedAt: Date;
}

export class MongoProcessedEventStore
  implements ProcessedEventStore {

  private readonly client: MongoClient;

  private readonly collection:
    Collection<ProcessedEventDocument>;

  constructor(
    config: MongoProcessedEventStoreConfig
  ) {
    this.client = new MongoClient(config.uri);

    const database =
      this.client.db(config.database);

    this.collection =
      database.collection<ProcessedEventDocument>(
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

  async exists(
    aid: string
  ): Promise<boolean> {
    const document =
      await this.collection.findOne(
        { aid },
        {
          projection: {
            _id: 1
          }
        }
      );

    return document !== null;
  }

  async markAsProcessed(
    aid: string
  ): Promise<boolean> {
    try {
      await this.collection.insertOne({
        aid,
        processedAt: new Date()
      });

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

  async close(): Promise<void> {
    await this.client.close();
  }
}
