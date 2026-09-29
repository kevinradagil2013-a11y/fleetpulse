import { VehicleGeneratedEvent } from "./vehicle-generated.js";

export interface EventPublisher {
  publish(event: VehicleGeneratedEvent): Promise<void>;
}
