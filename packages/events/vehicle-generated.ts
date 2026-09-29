export interface VehicleGeneratedData {
  type: string;
  powerSource: string;
  hp: number;
  year: number;
  topSpeed: number;
}

export interface VehicleGeneratedEvent {
  at: "Vehicle";
  et: "Generated";
  aid: string;
  data: VehicleGeneratedData;
}
