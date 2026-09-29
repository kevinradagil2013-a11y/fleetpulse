export interface GeneratorConfig {
  mqttBrokerUrl: string;
  mqttTopic: string;
  intervalMs: number;
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

export function loadGeneratorConfig(): GeneratorConfig {
  return {
    mqttBrokerUrl:
      process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",

    mqttTopic:
      process.env.MQTT_TOPIC ?? "fleetpulse/vehicles/generated",

    intervalMs:
      parsePositiveInteger(process.env.GENERATOR_INTERVAL_MS, 50)
  };
}
