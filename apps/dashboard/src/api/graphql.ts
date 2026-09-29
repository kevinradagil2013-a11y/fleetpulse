import type {
  FleetStatistics
} from "../types.js";

const GRAPHQL_URL =
  "http://localhost:4000/";

const GET_FLEET_STATISTICS = `
  query GetFleetStatistics {
    getFleetStatistics {
      totalVehicles
      vehiclesByType
      vehiclesByDecade
      vehiclesBySpeedClass
      hpStats {
        min
        max
        sum
        count
        avg
      }
      lastUpdated
    }
  }
`;

interface GraphQLResponse {
  data?: {
    getFleetStatistics:
      FleetStatistics | null;
  };

  errors?: Array<{
    message: string;
  }>;
}

export async function fetchFleetStatistics():
  Promise<FleetStatistics | null> {

  const response =
    await fetch(
      GRAPHQL_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          query:
            GET_FLEET_STATISTICS
        })
      }
    );

  if (!response.ok) {
    throw new Error(
      `GraphQL HTTP error: ${response.status}`
    );
  }

  const result = await response.json() as GraphQLResponse;

  if (result.errors?.length) {
    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join("; ")
    );
  }

  return (
    result.data
      ?.getFleetStatistics ??
    null
  );
}
