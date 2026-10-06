import http from "node:http";

import { interval, Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { generateVehicle } from "./application/generate-vehicle.js";
import { loadGeneratorConfig } from "./config/generator-config.js";
import { MqttEventPublisher } from "./infrastructure/mqtt-event-publisher.js";

const config = loadGeneratorConfig();

const publisher = new MqttEventPublisher({
  brokerUrl: config.mqttBrokerUrl,
  topic: config.mqttTopic,
  clientId: `fleetpulse-generator-${process.pid}`
});

const stop$ = new Subject<void>();

let subscription: Subscription | undefined;
let shuttingDown = false;

let generatedCount = 0;

const recentVehicles: ReturnType<typeof generateVehicle>[] = [];

const MAX_RECENT_VEHICLES = 100;

function isRunning(): boolean {
  return subscription !== undefined;
}

async function publishVehicle(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  try {
    const event = generateVehicle();

    await publisher.publish(event);

    generatedCount += 1;

    recentVehicles.unshift(event);

    if (recentVehicles.length > MAX_RECENT_VEHICLES) {
      recentVehicles.pop();
    }

    console.log(
      `[ms-generator] VehicleGenerated aid=${event.aid} count=${generatedCount}`
    );
  } catch (error) {
    console.error(
      "[ms-generator] Error publishing VehicleGenerated:",
      error
    );
  }
}

function start(): void {
  if (subscription) {
    console.log("[ms-generator] already running");
    return;
  }

  console.log("[ms-generator] starting...");
  console.log(`[ms-generator] broker=${config.mqttBrokerUrl}`);
  console.log(`[ms-generator] topic=${config.mqttTopic}`);
  console.log(`[ms-generator] intervalMs=${config.intervalMs}`);

  subscription = interval(config.intervalMs)
    .pipe(takeUntil(stop$))
    .subscribe(() => {
      void publishVehicle();
    });
}

function stop(): void {
  if (!subscription) {
    console.log("[ms-generator] already stopped");
    return;
  }

  console.log("[ms-generator] stopping...");

  stop$.next();
  subscription.unsubscribe();
  subscription = undefined;

  console.log("[ms-generator] stopped");
}

function setCorsHeaders(response: http.ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  setCorsHeaders(response);

  response.statusCode = statusCode;
  response.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  response.end(JSON.stringify(payload));
}

const controlServer = http.createServer(
  (request, response) => {
    setCorsHeaders(response);

    const method = request.method ?? "GET";
    const url = request.url ?? "/";

    if (method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (method === "GET" && url === "/status") {
      sendJson(response, 200, {
        service: "ms-generator",
        status: isRunning() ? "RUNNING" : "STOPPED",
        generatedCount,
        intervalMs: config.intervalMs,
        mqttBrokerUrl: config.mqttBrokerUrl,
        mqttTopic: config.mqttTopic,
        recentVehicles: recentVehicles.length
      });

      return;
    }

    if (method === "GET" && url === "/vehicles") {
      sendJson(response, 200, {
        count: recentVehicles.length,
        vehicles: recentVehicles
      });

      return;
    }

    if (method === "POST" && url === "/start") {
      start();

      sendJson(response, 200, {
        service: "ms-generator",
        status: "RUNNING",
        generatedCount,
        recentVehicles: recentVehicles.length
      });

      return;
    }

    if (method === "POST" && url === "/stop") {
      stop();

      sendJson(response, 200, {
        service: "ms-generator",
        status: isRunning() ? "RUNNING" : "STOPPED",
        generatedCount,
        recentVehicles: recentVehicles.length
      });

      return;
    }

    if (method === "GET" && url === "/health") {
      sendJson(response, 200, {
        service: "ms-generator",
        status: "UP"
      });

      return;
    }

    sendJson(response, 404, {
      error: "Not Found",
      endpoints: [
        "GET /health",
        "GET /status",
        "GET /vehicles",
        "POST /start",
        "POST /stop"
      ]
    });
  }
);

const controlPort = Number(
  process.env.GENERATOR_CONTROL_PORT ?? 4010
);

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[ms-generator] received ${signal}, shutting down...`
  );

  stop();

  stop$.complete();

  await new Promise<void>((resolve) => {
    controlServer.close(() => resolve());
  });

  await publisher.close();

  console.log("[ms-generator] shutdown complete");
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

controlServer.listen(controlPort, () => {
  console.log(
    `[ms-generator] control server listening on http://localhost:${controlPort}`
  );

  console.log(
    "[ms-generator] endpoints: GET /health, GET /status, GET /vehicles, POST /start, POST /stop"
  );
});

start();
