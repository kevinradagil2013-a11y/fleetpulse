import { gql } from "graphql-tag";

export const typeDefs = gql`
  type HpStats {
    min: Float!
    max: Float!
    sum: Float!
    count: Int!
    avg: Float!
  }

  type FleetStatistics {
    totalVehicles: Int!

    vehiclesByType: JSON!

    vehiclesByDecade: JSON!

    vehiclesBySpeedClass: JSON!

    hpStats: HpStats!

    lastUpdated: String!
  }

  scalar JSON

  type Query {
    getFleetStatistics: FleetStatistics
  }
`;
