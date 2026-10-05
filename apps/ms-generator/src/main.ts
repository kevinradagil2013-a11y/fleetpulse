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

async function publishVehicle(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  try {
    const event = generateVehicle();

    await publisher.publish(event);

    console.log(
      `[ms-generator] VehicleGenerated aid=${event.aid}`
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
    return;
  }

  console.log("[ms-generator] stopping...");

  stop$.next();
  subscription.unsubscribe();
  subscription = undefined;

  console.log("[ms-generator] stopped");
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`[ms-generator] received ${signal}, shutting down...`);

  stop();

  stop$.complete();

  await publisher.close();

  console.log("[ms-generator] shutdown complete");
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

start();
