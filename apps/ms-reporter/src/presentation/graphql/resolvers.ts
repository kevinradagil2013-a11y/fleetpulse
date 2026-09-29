import {
  StatisticsQuery
} from "../../application/projection/statistics-query.js";

export function createResolvers(
  statisticsQuery: StatisticsQuery
) {
  return {
    Query: {
      getFleetStatistics: async () => {
        return statisticsQuery.getStatistics();
      }
    }
  };
}
