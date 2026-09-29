import {
  WebSocketServer,
  WebSocket
} from "ws";

import {
  FleetStatistics
} from "../../application/projection/statistics-projection.js";

export interface StatisticsWebSocketServerConfig {
  port: number;
}

export class StatisticsWebSocketServer {

  private readonly server: WebSocketServer;

  constructor(
    config: StatisticsWebSocketServerConfig
  ) {
    this.server =
      new WebSocketServer({
        port: config.port
      });

    this.server.on(
      "listening",
      () => {
        console.log(
          `[ms-reporter] WebSocket listening on ws://localhost:${config.port}`
        );
      }
    );

    this.server.on(
      "connection",
      (socket) => {
        console.log(
          "[ms-reporter] WebSocket client connected"
        );

        socket.on(
          "close",
          () => {
            console.log(
              "[ms-reporter] WebSocket client disconnected"
            );
          }
        );
      }
    );

    this.server.on(
      "error",
      (error) => {
        console.error(
          "[ms-reporter] WebSocket server error:",
          error
        );
      }
    );
  }

  broadcast(
    statistics: FleetStatistics
  ): void {

    const message =
      JSON.stringify({
        type: "fleet_statistics_updated",
        data: statistics
      });

    for (
      const client
      of this.server.clients
    ) {
      if (
        client.readyState === WebSocket.OPEN
      ) {
        client.send(message);
      }
    }
  }

  async close(): Promise<void> {
    await new Promise<void>(
      (resolve) => {
        this.server.close(
          () => resolve()
        );
      }
    );
  }
}
