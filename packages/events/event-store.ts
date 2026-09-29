import { VehicleGeneratedEvent } from "./vehicle-generated.js";

export interface EventStore {
  append(event: VehicleGeneratedEvent): Promise<boolean>;
  exists(aid: string): Promise<boolean>;
}
