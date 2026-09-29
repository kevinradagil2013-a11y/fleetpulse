export interface ReporterConfig {
  mqttBrokerUrl: string;
  mqttTopic: string;
  batchWindowMs: number;
  mongoUri: string;
  mongoDatabase: string;
  eventStoreCollection: string;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function loadReporterConfig(): ReporterConfig {
  return {
    mqttBrokerUrl:
      process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",

    mqttTopic:
      process.env.MQTT_TOPIC ?? "fleetpulse/vehicles/generated",

    batchWindowMs:
      parsePositiveInteger(
        process.env.REPORTER_BATCH_WINDOW_MS,
        1000
      ),

    mongoUri:
      process.env.MONGODB_URI ?? "mongodb://localhost:27017",

    mongoDatabase:
      process.env.MONGODB_DATABASE ?? "fleetpulse",

    eventStoreCollection:
      process.env.EVENT_STORE_COLLECTION ??
      "vehicle_generated_events"
  };
}
