export interface ProcessedEventStore {
  exists(aid: string): Promise<boolean>;

  markAsProcessed(aid: string): Promise<boolean>;
}
