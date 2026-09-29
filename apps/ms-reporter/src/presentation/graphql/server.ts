import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServer } from "@apollo/server";

import { loadReporterConfig } from "../../config/reporter-config.js";
import { MongoStatisticsRepository } from "../../infrastructure/mongodb-statistics-repository.js";
import { createResolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

const config = loadReporterConfig();

const statisticsRepository =
  new MongoStatisticsRepository({
    uri: config.mongoUri,
    database: config.mongoDatabase,
    collection: "fleet_statistics"
  });

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: createResolvers(statisticsRepository)
});

async function start(): Promise<void> {
  await statisticsRepository.connect();

  const { url } = await startStandaloneServer(
    apolloServer,
    {
      listen: {
        port: Number(
          process.env.GRAPHQL_PORT ?? 4000
        )
      }
    }
  );

  console.log(
    `[ms-reporter] GraphQL server listening on ${url}`
  );
}

async function shutdown(
  signal: string
): Promise<void> {
  console.log(
    `[ms-reporter] received ${signal}, shutting down GraphQL...`
  );

  await apolloServer.stop();
  await statisticsRepository.close();

  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void start().catch(
  async (error) => {
    console.error(
      "[ms-reporter] GraphQL startup error:",
      error
    );

    await statisticsRepository.close();

    process.exitCode = 1;
  }
);
