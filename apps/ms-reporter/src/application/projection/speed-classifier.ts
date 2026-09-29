import { SpeedClass } from "./statistics-projection.js";

export function classifySpeed(
  topSpeed: number
): SpeedClass {
  /*
   * La consigna recuperada no especifica todavía
   * los límites exactos de velocidad.
   *
   * Mantener esta regla aislada permite cambiar
   * únicamente este punto cuando tengamos la
   * definición oficial.
   */
  if (topSpeed <= 150) {
    return "Lento";
  }

  if (topSpeed <= 250) {
    return "Normal";
  }

  return "Rapido";
}
