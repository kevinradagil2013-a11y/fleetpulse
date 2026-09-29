import type {
  FleetStatistics,
  FleetStatisticsWebSocketMessage
} from "../types.js";

const WEBSOCKET_URL =
  "ws://localhost:4001";

export function connectFleetStatisticsWebSocket(
  onStatisticsUpdated: (
    statistics: FleetStatistics
  ) => void,
  onError?: (
    error: Event
  ) => void
): () => void {

  const socket =
    new WebSocket(
      WEBSOCKET_URL
    );

  socket.addEventListener(
    "open",
    () => {
      console.log(
        "[dashboard] WebSocket connected"
      );
    }
  );

  socket.addEventListener(
    "message",
    (event) => {
      try {
        const message =
          JSON.parse(
            event.data
          ) as FleetStatisticsWebSocketMessage;

        if (
          message.type !==
          "fleet_statistics_updated"
        ) {
          return;
        }

        onStatisticsUpdated(
          message.data
        );
      } catch (error) {
        console.error(
          "[dashboard] invalid WebSocket message:",
          error
        );
      }
    }
  );

  socket.addEventListener(
    "error",
    (event) => {
      console.error(
        "[dashboard] WebSocket error"
      );

      onError?.(event);
    }
  );

  socket.addEventListener(
    "close",
    () => {
      console.log(
        "[dashboard] WebSocket disconnected"
      );
    }
  );

  return () => {
    socket.close();
  };
}
