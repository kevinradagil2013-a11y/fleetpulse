import { Registry, Counter, Gauge, Histogram } from 'prom-client';

export class FleetMetrics {
  public static registry = new Registry();

  public static vehiclesProcessed = new Counter({
    name: 'fleetpulse_vehicles_processed_total',
    help: 'Total de vehiculos procesados por ms-reporter',
    labelNames: ['type', 'status'],
    registers: [FleetMetrics.registry]
  });

  public static bufferSize = new Gauge({
    name: 'fleetpulse_buffer_size',
    help: 'Cantidad de eventos pendientes en el buffer de RxJS',
    registers: [FleetMetrics.registry]
  });

  public static dbWriteDuration = new Histogram({
    name: 'fleetpulse_db_write_duration_seconds',
    help: 'Tiempo de procesamiento por lote en MongoDB',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5],
    registers: [FleetMetrics.registry]
  });
}
