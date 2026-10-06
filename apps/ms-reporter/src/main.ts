import http from "http";
import { createEventBatchProcessor } from "./application/process-event-batches.js";
import { loadReporterConfig } from "./config/reporter-config.js";
import { MongoEventStore } from "./infrastructure/mongodb-event-store.js";
import { MongoProcessedEventStore } from "./infrastructure/mongodb-processed-event-store.js";
import { MongoStatisticsRepository } from "./infrastructure/mongodb-statistics-repository.js";
import { MqttEventSubscriber } from "./infrastructure/mqtt-event-subscriber.js";
import { StatisticsWebSocketServer } from "./presentation/websocket/statistics-websocket-server.js";
import { FleetMetrics } from "./services/metrics.service.js";

const config = loadReporterConfig();

const eventStore =
  new MongoEventStore({
    uri: config.mongoUri,
    database: config.mongoDatabase,
    collection: config.eventStoreCollection
  });

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

const metricsPort =
  Number(process.env.METRICS_PORT ?? 9090);

const metricsServer =
  http.createServer(async (req, res) => {

    if (
      req.url === "/metrics" &&
      req.method === "GET"
    ) {
      try {
        res.setHeader(
          "Content-Type",
          FleetMetrics.registry.contentType
        );

        res.end(
          await FleetMetrics.registry.metrics()
        );
      } catch (err) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  });

const processor =
  createEventBatchProcessor(
    eventStore,
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

  metricsServer.close();

  await subscriber.close();

  await eventStore.close();

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

  await eventStore.connect();

  await processedEventStore.connect();

  await statisticsRepository.connect();

  metricsServer.listen(
    metricsPort,
    () => {
      console.log(
        `[ms-reporter] metrics server running on http://localhost:${metricsPort}/metrics`
      );
    }
  );

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
    `[ms-reporter] eventStoreCollection=${config.eventStoreCollection}`
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

    metricsServer.close();

    await subscriber.close();

    await eventStore.close();

    await processedEventStore.close();

    await statisticsRepository.close();

    await webSocketServer.close();

    process.exitCode = 1;
  }
);

