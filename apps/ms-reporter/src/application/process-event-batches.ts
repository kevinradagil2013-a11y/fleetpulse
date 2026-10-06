import {
  Observable,
  Subscription,
  bufferTime,
  concatMap,
  filter,
  from
} from "rxjs";

import {
  VehicleGeneratedEvent
} from "../../../../packages/events/vehicle-generated.js";

import {
  EventStore
} from "../../../../packages/events/event-store.js";

import {
  ProcessedEventStore
} from "./processed-event-store.js";

import {
  FleetStatistics
} from "./projection/statistics-projection.js";

import {
  StatisticsRepository
} from "./projection/statistics-repository.js";

import {
  FleetMetrics
} from "../services/metrics.service.js";

export interface EventBatchProcessor {
  start(
    events$: Observable<VehicleGeneratedEvent>,
    batchWindowMs: number
  ): Subscription;
}

export interface EventBatchProcessorOptions {
  onStatisticsUpdated?: (
    statistics: FleetStatistics
  ) => void;
}

export function createEventBatchProcessor(
  eventStore: EventStore,
  processedEventStore: ProcessedEventStore,
  statisticsRepository: StatisticsRepository,
  options: EventBatchProcessorOptions = {}
): EventBatchProcessor {

  return {
    start(
      events$,
      batchWindowMs
    ): Subscription {

      return events$
        .pipe(
          bufferTime(batchWindowMs),

          filter(
            (batch) =>
              batch.length > 0
          ),

          concatMap(
            (batch) =>
              from(
                processBatch(
                  batch,
                  eventStore,
                  processedEventStore,
                  statisticsRepository,
                  options
                )
              )
          )
        )
        .subscribe({
          error: (error) => {
            console.error(
              "[ms-reporter] batch stream error:",
              error
            );
          }
        });
    }
  };
}

async function processBatch(
  batch: VehicleGeneratedEvent[],
  eventStore: EventStore,
  processedEventStore: ProcessedEventStore,
  statisticsRepository: StatisticsRepository,
  options: EventBatchProcessorOptions
): Promise<void> {

  const timer =
    FleetMetrics.dbWriteDuration.startTimer();

  const seenAids =
    new Set<string>();

  let received = 0;
  let processed = 0;
  let duplicates = 0;

  try {
    for (const event of batch) {

      if (seenAids.has(event.aid)) {
        duplicates += 1;
        continue;
      }

      seenAids.add(event.aid);
      received += 1;

      await eventStore.append(event);

      const result =
        await statisticsRepository.applyEventAtomically(
          event
        );

      if (!result.processed) {
        duplicates += 1;
        continue;
      }

      processed += 1;

      options.onStatisticsUpdated?.(
        result.statistics
      );

      FleetMetrics.vehiclesProcessed.inc({
        type: String(event.data.type),
        status: "processed"
      });
    }
  } finally {
    timer();
  }

  if (processed === 0) {
    console.log(
      `[ms-reporter] batch ignored: received=${batch.length} unique=${received} processed=0 duplicates=${duplicates}`
    );

    return;
  }

  console.log(
    `[ms-reporter] batch processed received=${batch.length} unique=${received} processed=${processed} duplicates=${duplicates}`
  );
}
