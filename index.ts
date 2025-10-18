import { initCli } from "./src/cli/index";

try {
  await initCli();
} catch (error) {
  console.error(`Error: ${error}`);
  process.exit(3);
}
