import { createEventBatchProcessor } from "./application/process-event-batches.js";
import { loadReporterConfig } from "./config/reporter-config.js";
import { MongoProcessedEventStore } from "./infrastructure/mongodb-processed-event-store.js";
import { MongoStatisticsRepository } from "./infrastructure/mongodb-statistics-repository.js";
import { MqttEventSubscriber } from "./infrastructure/mqtt-event-subscriber.js";
import { StatisticsWebSocketServer } from "./presentation/websocket/statistics-websocket-server.js";

const config = loadReporterConfig();

const processedEventStore =
  new MongoProcessedEventStore({
    uri: config.mongoUri,
    database: config.mongoDatabase,
    collection: "processed_vehicles"
  });

const statisticsRepository =
  new MongoStatisticsRepository({
    uri: config.mongoUri,
    database: config.mongoDatabase,
    collection: "fleet_statistics"
  });

const subscriber =
  new MqttEventSubscriber({
    brokerUrl: config.mqttBrokerUrl,
    topic: config.mqttTopic,
    clientId:
      `fleetpulse-reporter-${process.pid}`
  });

const webSocketServer =
  new StatisticsWebSocketServer({
    port: Number(
      process.env.WEBSOCKET_PORT ?? 4001
    )
  });

const processor =
  createEventBatchProcessor(
    processedEventStore,
    statisticsRepository,
    {
      onStatisticsUpdated:
        (statistics) => {
          webSocketServer.broadcast(
            statistics
          );
        }
    }
  );

let subscription:
  ReturnType<typeof processor.start> | undefined;

let shuttingDown = false;

async function shutdown(
  signal: string
): Promise<void> {

  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[ms-reporter] received ${signal}, shutting down...`
  );

  if (subscription) {
    subscription.unsubscribe();
  }

  await subscriber.close();

  await processedEventStore.close();

  await statisticsRepository.close();

  await webSocketServer.close();

  console.log(
    "[ms-reporter] stopped"
  );
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

async function start(): Promise<void> {

  await processedEventStore.connect();

  await statisticsRepository.connect();

  subscription =
    processor.start(
      subscriber.getEvents(),
      config.batchWindowMs
    );

  console.log(
    "[ms-reporter] starting..."
  );

  console.log(
    `[ms-reporter] broker=${config.mqttBrokerUrl}`
  );

  console.log(
    `[ms-reporter] topic=${config.mqttTopic}`
  );

  console.log(
    `[ms-reporter] batchWindowMs=${config.batchWindowMs}`
  );

  console.log(
    `[ms-reporter] mongo=${config.mongoUri}/${config.mongoDatabase}`
  );

  console.log(
    "[ms-reporter] processedEventCollection=processed_vehicles"
  );

  console.log(
    "[ms-reporter] statisticsCollection=fleet_statistics"
  );

  console.log(
    `[ms-reporter] websocketPort=${process.env.WEBSOCKET_PORT ?? 4001}`
  );
}

void start().catch(
  async (error) => {

    console.error(
      "[ms-reporter] startup error:",
      error
    );

    await subscriber.close();

    await processedEventStore.close();

    await statisticsRepository.close();

    await webSocketServer.close();

    process.exitCode = 1;
  }
);
