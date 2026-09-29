import { generateVehicle } from "./application/generate-vehicle.js";
import { loadGeneratorConfig } from "./config/generator-config.js";
import { MqttEventPublisher } from "./infrastructure/mqtt-event-publisher.js";

const config = loadGeneratorConfig();

const publisher = new MqttEventPublisher({
  brokerUrl: config.mqttBrokerUrl,
  topic: config.mqttTopic,
  clientId: `fleetpulse-generator-${process.pid}`
});

let timer: NodeJS.Timeout | undefined;
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
  console.log("[ms-generator] starting...");
  console.log(`[ms-generator] broker=${config.mqttBrokerUrl}`);
  console.log(`[ms-generator] topic=${config.mqttTopic}`);
  console.log(`[ms-generator] intervalMs=${config.intervalMs}`);

  timer = setInterval(() => {
    void publishVehicle();
  }, config.intervalMs);
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`[ms-generator] received ${signal}, shutting down...`);

  if (timer) {
    clearInterval(timer);
  }

  await publisher.close();

  console.log("[ms-generator] stopped");
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

start();
