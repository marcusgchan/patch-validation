#!/usr/bin/env bun

import { initCli } from "./src/cli/index.js";

// Call the CLI function when this file is executed
initCli().catch((error) => {
  console.error("Error running CLI:", error);
  process.exit(1);
});
