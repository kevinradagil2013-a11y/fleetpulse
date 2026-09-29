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
  ProcessedEventStore
} from "./processed-event-store.js";

import {
  projectBatch
} from "./projection/project-batch.js";

import {
  FleetStatistics
} from "./projection/statistics-projection.js";

import {
  StatisticsRepository
} from "./projection/statistics-repository.js";

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
  processedEventStore: ProcessedEventStore,
  statisticsRepository: StatisticsRepository,
  options: EventBatchProcessorOptions
): Promise<void> {

  const newEvents: VehicleGeneratedEvent[] = [];

  const seenAids = new Set<string>();

  for (const event of batch) {

    if (seenAids.has(event.aid)) {
      continue;
    }

    seenAids.add(event.aid);

    const alreadyProcessed =
      await processedEventStore.exists(
        event.aid
      );

    if (alreadyProcessed) {
      continue;
    }

    newEvents.push(event);
  }

  if (newEvents.length === 0) {

    console.log(
      `[ms-reporter] batch ignored: received=${batch.length} new=0`
    );

    return;
  }

  const statistics =
    projectBatch(newEvents);

  const updatedStatistics =
    await statisticsRepository.applyBatch(
      statistics
    );

  options.onStatisticsUpdated?.(
    updatedStatistics
  );

  let processed = 0;

  for (const event of newEvents) {

    const marked =
      await processedEventStore.markAsProcessed(
        event.aid
      );

    if (marked) {
      processed += 1;
    }
  }

  console.log(
    `[ms-reporter] batch processed received=${batch.length} new=${newEvents.length} processed=${processed}`
  );
}
