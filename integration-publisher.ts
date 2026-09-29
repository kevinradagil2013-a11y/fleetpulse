import { readFileSync } from "node:fs";
import { connect } from "mqtt";

const client = connect("mqtt://localhost:1883");

const files = [
  "integration-001.json",
  "integration-002.json",
  "integration-003.json"
];

client.on("connect", () => {
  for (const file of files) {
    const payload = readFileSync(file, "utf8");

    client.publish(
      "fleetpulse/vehicles/generated",
      payload,
      { qos: 1 },
      (error) => {
        if (error) {
          console.error(error);
          return;
        }

        console.log(`[test-publisher] published ${file}`);
      }
    );
  }

  setTimeout(() => {
    client.end();
  }, 500);
});
