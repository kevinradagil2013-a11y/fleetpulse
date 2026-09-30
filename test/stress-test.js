const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const TOTAL_MESSAGES = 10000;
const INTERVAL_MS = 1;

client.on('connect', () => {
  console.log(`🚀 Iniciando prueba de carga: enviando ${TOTAL_MESSAGES} mensajes...`);
  let count = 0;

  const timer = setInterval(() => {
    if (count >= TOTAL_MESSAGES) {
      clearInterval(timer);
      console.log('✅ Prueba de carga finalizada exitosamente.');
      client.end();
      return;
    }

    const payload = JSON.stringify({
      aid: `test-aid-${Date.now()}-${count}`,
      licensePlate: `TEST-${count}`,
      energyType: 'ELECTRIC',
      vehicleType: 'TRUCK',
      timestamp: Date.now()
    });

    client.publish('fleet/vehicles/generated', payload);
    count++;
  }, INTERVAL_MS);
});

client.on('error', (err) => {
  console.error('❌ Error de conexión MQTT:', err);
  client.end();
});
