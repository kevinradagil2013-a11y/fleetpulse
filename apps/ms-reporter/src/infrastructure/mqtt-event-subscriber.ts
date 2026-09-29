import { connect, MqttClient } from "mqtt";
import { Subject } from "rxjs";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

export interface MqttEventSubscriberConfig {
  brokerUrl: string;
  topic: string;
  clientId?: string;
}

function isVehicleGeneratedEvent(
  value: unknown
): value is VehicleGeneratedEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Record<string, unknown>;
  const data = event.data;

  if (!data || typeof data !== "object") {
    return false;
  }

  const vehicleData = data as Record<string, unknown>;

  return (
    event.at === "Vehicle" &&
    event.et === "Generated" &&
    typeof event.aid === "string" &&
    event.aid.length > 0 &&
    typeof vehicleData.type === "string" &&
    typeof vehicleData.powerSource === "string" &&
    typeof vehicleData.hp === "number" &&
    typeof vehicleData.year === "number" &&
    typeof vehicleData.topSpeed === "number"
  );
}

export class MqttEventSubscriber {
  private readonly client: MqttClient;
  private readonly events = new Subject<VehicleGeneratedEvent>();

  constructor(config: MqttEventSubscriberConfig) {
    this.client = connect(config.brokerUrl, {
      clientId: config.clientId,
      clean: true,
      reconnectPeriod: 1000
    });

    this.client.on("connect", () => {
      console.log(
        `[ms-reporter] connected to MQTT broker: ${config.brokerUrl}`
      );

      this.client.subscribe(config.topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(
            "[ms-reporter] MQTT subscription error:",
            error
          );
          return;
        }

        console.log(
          `[ms-reporter] subscribed to topic=${config.topic}`
        );
      });
    });

    this.client.on("error", (error) => {
      console.error(
        "[ms-reporter] MQTT client error:",
        error
      );
    });

    this.client.on("message", (topic, payload) => {
      if (topic !== config.topic) {
        return;
      }

      const rawPayload = payload
        .toString()
        .replace(/^\uFEFF/, "")
        .trim();

      if (!rawPayload) {
        console.warn(
          "[ms-reporter] ignored empty MQTT payload"
        );
        return;
      }

      try {
        const parsed: unknown = JSON.parse(rawPayload);

        if (!isVehicleGeneratedEvent(parsed)) {
          console.warn(
            "[ms-reporter] ignored invalid VehicleGenerated event structure"
          );
          return;
        }

        this.events.next(parsed);
      } catch {
        console.warn(
          "[ms-reporter] ignored invalid JSON payload"
        );
      }
    });
  }

  getEvents(): Subject<VehicleGeneratedEvent> {
    return this.events;
  }

  async close(): Promise<void> {
    this.events.complete();

    await new Promise<void>((resolve) => {
      this.client.end(false, {}, () => resolve());
    });
  }
}
