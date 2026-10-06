export interface GeneratedVehicle {
  at: "Vehicle";
  et: "Generated";
  aid: string;
  timestamp: string;
  data: {
    type: string;
    powerSource: string;
    hp: number;
    year: number;
    topSpeed: number;
  };
}

export interface GeneratorStatus {
  service: string;
  status: "RUNNING" | "STOPPED";
  generatedCount: number;
  intervalMs: number;
  mqttBrokerUrl: string;
  mqttTopic: string;
  recentVehicles: number;
}

export interface GeneratedVehiclesResponse {
  count: number;
  vehicles: GeneratedVehicle[];
}

const GENERATOR_URL =
  "http://localhost:4010";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${GENERATOR_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options?.headers ?? {})
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Generator HTTP error: ${response.status}`
    );
  }

  return await response.json() as T;
}

export function fetchGeneratorStatus(): Promise<GeneratorStatus> {
  return request<GeneratorStatus>("/status");
}

export function fetchGeneratedVehicles():
  Promise<GeneratedVehiclesResponse> {
  return request<GeneratedVehiclesResponse>("/vehicles");
}

export function startGenerator():
  Promise<GeneratorStatus> {
  return request<GeneratorStatus>(
    "/start",
    {
      method: "POST"
    }
  );
}

export function stopGenerator():
  Promise<GeneratorStatus> {
  return request<GeneratorStatus>(
    "/stop",
    {
      method: "POST"
    }
  );
}
