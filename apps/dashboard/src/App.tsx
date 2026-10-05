import {
  memo,
  useEffect,
  useRef,
  useState
} from "react";

import { List } from "react-window";

import { fetchFleetStatistics } from "./api/graphql.js";
import {
  connectFleetStatisticsWebSocket
} from "./api/websocket.js";
import type { FleetStatistics } from "./types.js";

interface VirtualRowProps {
  items: Array<[string, number]>;
}

const VirtualizedDataRow = memo(
  ({
    index,
    style,
    items
  }: {
    index: number;
    style: React.CSSProperties;
    items: Array<[string, number]>;
  }) => {
    const [label, count] = items[index];

    return (
      <div
        className="data-row"
        style={style}
      >
        <span>
          {label}
        </span>

        <strong>
          {count}
        </strong>
      </div>
    );
  }
);

VirtualizedDataRow.displayName = "VirtualizedDataRow";

interface VirtualizedDataListProps {
  items: Array<[string, number]>;
}

const VirtualizedDataList = memo(
  ({
    items
  }: VirtualizedDataListProps) => {
    return (
      <List<VirtualRowProps>
        rowCount={items.length}
        rowHeight={36}
        overscanCount={2}
        defaultHeight={108}
        rowProps={{
          items
        }}
        rowComponent={VirtualizedDataRow}
        style={{
          width: "100%",
          height: "108px"
        }}
      />
    );
  }
);

VirtualizedDataList.displayName =
  "VirtualizedDataList";

function App() {
  const [showDashboard, setShowDashboard] =
    useState(false);

  const [isDeparting, setIsDeparting] =
    useState(false);

  const [statistics, setStatistics] =
    useState<FleetStatistics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Estado recibido por WebSocket.
   *
   * Se mantiene separado del estado visual para
   * evitar renderizar el dashboard en cada evento.
   */
  const latestStatisticsRef =
    useRef<FleetStatistics | null>(null);

  const displayedStatisticsRef =
    useRef<FleetStatistics | null>(null);

  /*
   * Cargamos GraphQL desde el inicio.
   * Así, mientras ocurre la cinematografía,
   * el dashboard puede ir preparando sus datos.
   */
  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const result =
          await fetchFleetStatistics();

        if (active) {
          latestStatisticsRef.current = result;
          displayedStatisticsRef.current = result;
          setStatistics(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Error desconocido"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  /*
   * WebSocket permanece conectado incluso durante
   * la portada para que el dashboard llegue actualizado.
   *
   * Los eventos entrantes se guardan en un ref.
   * No provocamos un render por cada mensaje.
   */
  useEffect(() => {
    const disconnect =
      connectFleetStatisticsWebSocket(
        (updatedStatistics) => {
          const current =
            latestStatisticsRef.current;

          if (
            !current ||
            new Date(
              updatedStatistics.lastUpdated
            ).getTime() >=
              new Date(
                current.lastUpdated
              ).getTime()
          ) {
            latestStatisticsRef.current =
              updatedStatistics;

            setError(null);
          }
        }
      );

    return disconnect;
  }, []);

  /*
   * Control de frecuencia visual:
   *
   * El backend puede producir muchos eventos,
   * pero React actualiza la interfaz como máximo
   * una vez por segundo.
   */
  useEffect(() => {
    const visualUpdateInterval =
      window.setInterval(() => {
        const latest =
          latestStatisticsRef.current;

        const displayed =
          displayedStatisticsRef.current;

        if (
          latest &&
          latest !== displayed
        ) {
          displayedStatisticsRef.current =
            latest;

          setStatistics(latest);
        }
      }, 1000);

    return () => {
      window.clearInterval(
        visualUpdateInterval
      );
    };
  }, []);

  /*
   * Salida cinematográfica.
   *
   * 0.0s  -> comienza la salida
   * 7.8s  -> terminan bus/personaje/portal
   * 8.8s  -> entra el dashboard
   */
  function enterSystem() {
    if (isDeparting) {
      return;
    }

    setIsDeparting(true);

    window.setTimeout(() => {
      setShowDashboard(true);
    }, 3000);
  }

  if (!showDashboard) {
    return (
      <main
        className={`landing-page ${
          isDeparting
            ? "is-departing"
            : ""
        }`}
      >

        <div className="landing-grid" />

        <div className="ambient-glow ambient-glow-one" />

        <div className="ambient-glow ambient-glow-two" />

        <div className="top-system">

          <div className="system-brand">
            <span className="system-mark">
              N
            </span>

            <span>
              NEBULA / FLEETPULSE
            </span>
          </div>

          <div className="system-status">
            <span className="system-status-dot" />
            SYSTEM ONLINE
          </div>

        </div>

        <section className="landing-copy">

          <div className="status-badge">
            <span className="status-dot" />
            REAL-TIME VEHICLE INTELLIGENCE
          </div>

          <div className="hero-kicker">
            NEXT GENERATION MOBILITY SYSTEM
          </div>

          <h1>
            FLEET<span>PULSE</span>
          </h1>

          <p className="landing-subtitle">
            Inteligencia vehicular
            <strong>
              {" "}en tiempo real.
            </strong>
          </p>

          <p className="landing-description">
            Plataforma distribuida para generación,
            procesamiento y visualización de eventos
            vehiculares mediante arquitectura de
            microservicios.
          </p>

          <button
            className="continue-button"
            onClick={enterSystem}
            disabled={isDeparting}
          >
            <span>
              {isDeparting
                ? "INICIANDO SISTEMA..."
                : "ENTRAR AL SISTEMA"}
            </span>

            <strong>
              {isDeparting
                ? "◌"
                : "→"}
            </strong>
          </button>

          <div className="architecture-tags">
            <span>MQTT</span>
            <span>EVENT SOURCING</span>
            <span>GRAPHQL</span>
            <span>WEBSOCKET</span>
          </div>

        </section>

        <section className="vehicle-scene">

          <div className="scene-grid-floor" />

          <div className="scene-horizon" />

          <div className="portal">

            <div className="portal-ring portal-ring-one" />
            <div className="portal-ring portal-ring-two" />
            <div className="portal-ring portal-ring-three" />

            <div className="portal-core" />

            <div className="portal-particle particle-one" />
            <div className="portal-particle particle-two" />
            <div className="portal-particle particle-three" />
            <div className="portal-particle particle-four" />
            <div className="portal-particle particle-five" />
            <div className="portal-particle particle-six" />

          </div>

          <div className="nebula-passenger">

            <div className="nebula-materialize">
              <span />
              <span />
              <span />
            </div>

            <div className="nebula-energy-ring" />

            <div className="nebula-character">

              <div className="nebula-head">

                <div className="nebula-hair" />

                <div className="nebula-visor">
                  <span />
                  <span />
                </div>

                <div className="nebula-face-light" />

              </div>

              <div className="nebula-neck" />

              <div className="nebula-torso">

                <div className="nebula-core">
                  N
                </div>

                <div className="nebula-chest-line" />

                <div className="nebula-belt" />

              </div>

              <div className="nebula-arm nebula-arm-left">
                <div className="nebula-glove" />
              </div>

              <div className="nebula-arm nebula-arm-right">
                <div className="nebula-glove" />
              </div>

              <div className="nebula-leg nebula-leg-left">
                <div className="nebula-boot" />
              </div>

              <div className="nebula-leg nebula-leg-right">
                <div className="nebula-boot" />
              </div>

            </div>

            <div className="nebula-label">
              <span>NEBULA</span>
              <strong>
                PASSENGER ONLINE
              </strong>
            </div>

          </div>

          <div className="bus-aura" />

          <div className="bus-shadow" />

          <div className="futuristic-bus">

            <div className="bus-top-fin" />

            <div className="bus-roof">
              <div className="roof-light" />
              <div className="roof-panel" />
            </div>

            <div className="bus-front">

              <div className="bus-windshield">

                <div className="windshield-reflection reflection-one" />
                <div className="windshield-reflection reflection-two" />

                <div className="windshield-divider" />

                <div className="driver-zone">
                  <span />
                  <span />
                </div>

              </div>

              <div className="bus-front-panel">

                <div className="bus-logo">
                  <span>N</span>
                </div>

                <div className="front-light front-light-left">
                  <span />
                </div>

                <div className="front-light front-light-right">
                  <span />
                </div>

                <div className="front-grille">
                  <span />
                  <span />
                  <span />
                </div>

              </div>

            </div>

            <div className="bus-side">

              <div className="side-window window-one" />
              <div className="side-window window-two" />
              <div className="side-window window-three" />
              <div className="side-window window-four" />

              <div className="window-highlight" />

              <div className="bus-side-line line-primary" />
              <div className="bus-side-line line-secondary" />

              <div className="bus-door">
                <span />
                <span />
              </div>

              <div className="bus-panel-detail">
                <small>FP</small>
                <strong>FLEETPULSE</strong>
              </div>

              <div className="bus-side-led" />

            </div>

            <div className="bus-rear">

              <div className="rear-window" />

              <div className="rear-light rear-light-one" />
              <div className="rear-light rear-light-two" />

              <div className="rear-badge">
                FLEET
              </div>

            </div>

            <div className="bus-lower-body">

              <div className="lower-panel" />

              <div className="lower-light-strip">
                <span />
              </div>

              <div className="wheel-arch wheel-arch-front" />
              <div className="wheel-arch wheel-arch-back" />

            </div>

            <div className="bus-wheel wheel-front">

              <div className="wheel-glow" />
              <div className="wheel-tire" />

              <div className="wheel-rim">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="wheel-hub">
                N
              </div>

            </div>

            <div className="bus-wheel wheel-back">

              <div className="wheel-glow" />
              <div className="wheel-tire" />

              <div className="wheel-rim">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="wheel-hub">
                N
              </div>

            </div>

            <div className="bus-underlight" />

          </div>

          <div className="speed-line line-one" />
          <div className="speed-line line-two" />
          <div className="speed-line line-three" />
          <div className="speed-line line-four" />

          <div className="data-hud hud-one">
            <span>VEHICLE ID</span>
            <strong>FP-2048</strong>
          </div>

          <div className="data-hud hud-two">
            <span>PROPULSION</span>
            <strong>NEBULA CORE</strong>
          </div>

          <div className="data-hud hud-three">
            <span>STATUS</span>
            <strong>READY</strong>
          </div>

          <div className="road-glow" />

          <div className="scene-caption">
            <span>FLEETPULSE TRANSIT</span>
            <strong>
              ADVANCED MOBILITY PLATFORM
            </strong>
          </div>

        </section>

        <div className="corner-label top-left">
          SYSTEM / 04
        </div>

        <div className="corner-label bottom-right">
          DISTRIBUTED VEHICLE PLATFORM
        </div>

        <div className="departure-status">
          <span />
          {isDeparting
            ? "ESTABLISHING SECURE SYSTEM CHANNEL"
            : "SYSTEM READY"}
        </div>

      </main>
    );
  }

  if (loading) {
    return (
      <main className="dashboard-page">

        <div className="dashboard-loading">

          <div className="loading-ring" />

          <h1>
            FleetPulse
          </h1>

          <p>
            Cargando inteligencia vehicular...
          </p>

        </div>

      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">

        <div className="dashboard-error">

          <h1>
            FleetPulse
          </h1>

          <p>
            Error: {error}
          </p>

          <button
            onClick={() => {
              setShowDashboard(false);
              setIsDeparting(false);
            }}
          >
            VOLVER
          </button>

        </div>

      </main>
    );
  }

  if (!statistics) {
    return (
      <main className="dashboard-page">

        <div className="dashboard-error">

          <h1>
            FleetPulse
          </h1>

          <p>
            No hay estadísticas disponibles.
          </p>

        </div>

      </main>
    );
  }

  const vehiclesByType =
    Object.entries(
      statistics.vehiclesByType
    );

  const vehiclesByDecade =
    Object.entries(
      statistics.vehiclesByDecade
    );

  const vehiclesBySpeedClass =
    Object.entries(
      statistics.vehiclesBySpeedClass
    );

  return (
    <main className="dashboard-page">

      <header className="dashboard-header">

        <div>

          <div className="dashboard-brand">
            FLEET<span>PULSE</span>
          </div>

          <p>
            VEHICLE INTELLIGENCE PLATFORM
          </p>

        </div>

        <div className="live-status">
          <span />
          LIVE
        </div>

      </header>

      <section className="dashboard-intro">

        <div>

          <p className="eyebrow">
            REAL-TIME MONITORING
          </p>

          <h1>
            Inteligencia de flota
            <span>
              {" "}en tiempo real.
            </span>
          </h1>

          <p>
            Estado actual de la plataforma FleetPulse.
          </p>

        </div>

        <button
          className="back-button"
          onClick={() => {
            setShowDashboard(false);
            setIsDeparting(false);
          }}
        >
          ← PORTADA
        </button>

      </section>

      <section className="metrics-grid">

        <article className="metric-card featured">

          <span>
            TOTAL VEHÍCULOS
          </span>

          <strong>
            {statistics.totalVehicles}
          </strong>

          <small>
            unidades procesadas
          </small>

        </article>

        <article className="metric-card">

          <span>
            HP PROMEDIO
          </span>

          <strong>
            {statistics.hpStats.avg.toFixed(2)}
          </strong>

          <small>
            potencia media
          </small>

        </article>

        <article className="metric-card">

          <span>
            HP MÍNIMO
          </span>

          <strong>
            {statistics.hpStats.min}
          </strong>

          <small>
            potencia registrada
          </small>

        </article>

        <article className="metric-card">

          <span>
            HP MÁXIMO
          </span>

          <strong>
            {statistics.hpStats.max}
          </strong>

          <small>
            potencia registrada
          </small>

        </article>

      </section>

      <section className="data-grid">

        <article className="data-card">

          <div className="card-heading">

            <h2>
              Vehículos por tipo
            </h2>

            <span>
              01
            </span>

          </div>

          <VirtualizedDataList
            items={vehiclesByType}
          />

        </article>

        <article className="data-card">

          <div className="card-heading">

            <h2>
              Vehículos por década
            </h2>

            <span>
              02
            </span>

          </div>

          <VirtualizedDataList
            items={vehiclesByDecade}
          />

        </article>

        <article className="data-card">

          <div className="card-heading">

            <h2>
              Clase de velocidad
            </h2>

            <span>
              03
            </span>

          </div>

          <VirtualizedDataList
            items={vehiclesBySpeedClass}
          />

        </article>

      </section>

      <footer className="dashboard-footer">

        <span>
          MQTT / GRAPHQL / WEBSOCKET
        </span>

        <span>
          UPDATED{" "}
          {new Date(
            statistics.lastUpdated
          ).toLocaleString()}
        </span>

      </footer>

    </main>
  );
}

export default App;
