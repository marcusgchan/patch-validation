import { initCli } from "./src/cli/index";

try {
  await initCli();
} catch (error) {
  console.error(
    `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`
  );
  process.exit(3);
}
