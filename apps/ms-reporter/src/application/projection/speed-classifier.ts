import { SpeedClass } from "./statistics-projection.js";

export function classifySpeed(
  topSpeed: number
): SpeedClass {
  if (topSpeed <= 120) {
    return "Lento";
  }

  if (topSpeed <= 200) {
    return "Normal";
  }

  return "Rapido";
}
