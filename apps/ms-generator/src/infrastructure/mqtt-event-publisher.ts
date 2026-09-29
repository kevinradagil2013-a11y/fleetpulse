import { connect, MqttClient } from "mqtt";
import { EventPublisher } from "../../../../packages/events/event-publisher.js";
import { VehicleGeneratedEvent } from "../../../../packages/events/vehicle-generated.js";

export interface MqttEventPublisherConfig {
  brokerUrl: string;
  topic: string;
  clientId?: string;
}

export class MqttEventPublisher implements EventPublisher {
  private readonly client: MqttClient;
  private readonly topic: string;

  constructor(config: MqttEventPublisherConfig) {
    this.topic = config.topic;

    this.client = connect(config.brokerUrl, {
      clientId: config.clientId,
      clean: true,
      reconnectPeriod: 1000
    });
  }

  async publish(event: VehicleGeneratedEvent): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.publish(
        this.topic,
        JSON.stringify(event),
        {
          qos: 1
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    });
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.client.end(false, {}, () => resolve());
    });
  }
}
