import { pollAndRunOnce } from "./jobs.js";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS) || 3000;
const MAX_CONSECUTIVE_ERRORS = 10;

let running = true;
let consecutiveErrors = 0;

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logError(msg: string, err?: unknown) {
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, err ?? "");
}

async function runLoop() {
  log("Worker starting...");
  log(`Poll interval: ${POLL_INTERVAL_MS}ms`);

  while (running) {
    try {
      const didWork = await pollAndRunOnce();

      if (didWork) {
        log("Job completed. Checking for more...");
        consecutiveErrors = 0;
        // Immediately check for more work
        continue;
      }

      // No work found, wait before polling again
      consecutiveErrors = 0;
      await sleep(POLL_INTERVAL_MS);
    } catch (err) {
      consecutiveErrors++;
      logError(`Poll error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        logError("Too many consecutive errors. Shutting down.");
        running = false;
        process.exit(1);
      }

      // Exponential backoff on errors
      const backoff = Math.min(POLL_INTERVAL_MS * Math.pow(2, consecutiveErrors), 30000);
      log(`Backing off for ${backoff}ms`);
      await sleep(backoff);
    }
  }

  log("Worker stopped.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupGracefulShutdown() {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGQUIT"];

  for (const signal of signals) {
    process.on(signal, () => {
      log(`Received ${signal}. Shutting down gracefully...`);
      running = false;
    });
  }

  process.on("uncaughtException", (err) => {
    logError("Uncaught exception:", err);
    running = false;
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logError("Unhandled rejection:", reason);
    running = false;
    process.exit(1);
  });
}

// Entry point
setupGracefulShutdown();
runLoop().catch((err) => {
  logError("Fatal error in run loop:", err);
  process.exit(1);
});
