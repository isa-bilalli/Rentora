import { defineConfig } from "vitest/config";

// Every test run uses one time zone, west of UTC, so results are the same on every machine and in CI,
// and a date that slipped to the day before would fail instead of passing by luck.
// Set here, before Vitest starts its workers, so they inherit it.
process.env.TZ = "America/Los_Angeles";

export default defineConfig({
    test: {
        // The code under test only needs what Node already has (fetch, Intl).
        environment: "node",
        include: ["src/**/*.test.ts"],
    },
});
