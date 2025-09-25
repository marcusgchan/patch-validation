import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/ls.txt";

export const lsTool = tool({
  name: "List Directory",
  description: DESCRIPTION,
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        `The path to run the ls command in. Needs to be a relative path to the project root.`
      ),
  }),
  execute: async (params) => {
    // TODO: make it work for running in sub directories
    const absolutePath =
      params.path === undefined
        ? process.cwd()
        : path.join(process.cwd(), params.path);

    const proc = Bun.spawnSync(["ls", "-A", absolutePath]);

    const maxResults = 100;
    const entries = proc.stdout.toString().trim().split("\n");
    let truncated = false;

    if (entries.length > maxResults) {
      truncated = true;
      entries.splice(maxResults);
    }

    return {
      title: absolutePath,
      metadata: {
        count: maxResults,
        truncated,
      },
      output: entries.join("\n"),
    };
  },
});
