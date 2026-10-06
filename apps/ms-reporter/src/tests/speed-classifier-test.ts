import { classifySpeed } from "../application/projection/speed-classifier.js";

function assertEqual<T>(
  actual: T,
  expected: T,
  label: string
): void {
  if (actual !== expected) {
    throw new Error(
      `[speed-classifier-test] FAIL ${label}: expected=${expected}, actual=${actual}`
    );
  }

  console.log(
    `[speed-classifier-test] PASS ${label}: ${actual}`
  );
}

assertEqual(
  classifySpeed(120),
  "Lento",
  "boundary-120"
);

assertEqual(
  classifySpeed(121),
  "Normal",
  "boundary-121"
);

assertEqual(
  classifySpeed(200),
  "Normal",
  "boundary-200"
);

assertEqual(
  classifySpeed(201),
  "Rapido",
  "boundary-201"
);

console.log(
  "[speed-classifier-test] all boundary tests passed"
);
