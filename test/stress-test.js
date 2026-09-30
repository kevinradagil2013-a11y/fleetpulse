import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

const TOTAL_MESSAGES = 10000;
const INTERVAL_MS = 1;
const TOPIC = "fleetpulse/vehicles/generated";

client.on("connect", () => {
  console.log(
    `🚀 Iniciando prueba de carga: enviando ${TOTAL_MESSAGES} mensajes...`
  );

  let count = 0;

  const timer = setInterval(() => {
    if (count >= TOTAL_MESSAGES) {
      clearInterval(timer);

      console.log(
        `✅ Prueba de carga finalizada exitosamente: ${TOTAL_MESSAGES} mensajes enviados.`
      );

      client.end();
      return;
    }

    const payload = JSON.stringify({
      at: "Vehicle",
      et: "Generated",
      aid: `stress-test-${Date.now()}-${count}`,
      data: {
        type: "SUV",
        powerSource: "Electric",
        hp: 200,
        year: 2025,
        topSpeed: 220
      }
    });

    client.publish(
      TOPIC,
      payload
    );

    count += 1;
  }, INTERVAL_MS);
});

client.on("error", (err) => {
  console.error(
    "❌ Error de conexión MQTT:",
    err
  );

  client.end();
});
