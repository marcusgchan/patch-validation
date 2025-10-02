import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/ls.txt";

export interface LsToolExecuteReturn {
  title: string;
  metadata: {
    count: number;
    truncated: boolean;
  };
  output: string;
}

export function createLsTool(targetDir: string) {
  return tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          `The path to run the ls command in. Needs to be a relative path to the project root.`
        ),
    }),
    execute: async (params): Promise<LsToolExecuteReturn> => {
      const absolutePath =
        params.path === undefined
          ? targetDir
          : path.join(targetDir, params.path);

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
          count: entries.length,
          truncated,
        },
        output: entries.join("\n"),
      };
    },
  });
}
