import { tool } from "ai";
import z from "zod";

export const grepTool = tool({
  name: "Project search",
  description: "Searches for contents in a file from starting directory.",
  inputSchema: z.object({
    pattern: z
      .string()
      .min(1)
      .describe("The regex pattern to search for in file contents"),
    path: z
      .string()
      .optional()
      .describe(
        "The directory to search in. Defaults to the current working directory.",
      ),
    include: z
      .string()
      .optional()
      .describe(
        'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")',
      ),
  }),
  execute: async (params) => {
    function buildGrepCommands(commands: string[]) {
      params.include && commands.push(...["--include", params.include]);
      commands.push(params.pattern);
      params.path && commands.push(params.path);
      return commands;
    }

    const grepCommand = buildGrepCommands(["grep", "-rn"]);
    const proc = Bun.spawnSync(grepCommand);

    if (proc.exitCode === 1) {
      return {
        title: params.pattern,
        metadata: {
          ...params,
        },
        output: "No files found",
      };
    }

    if (proc.exitCode !== 0) {
      throw new Error("There was an error with calling grep");
    }

    const grepOutput = proc.stdout.toString().trim();
    const matches = grepOutput.split("\n");
    const maxResults = 100;
    let truncated = false;

    if (matches.length > maxResults) {
      truncated = true;
      matches.splice(maxResults);
    }

    return {
      title: params.pattern,
      metadata: {
        ...params,
        truncated,
      },
      output: `Truncated first ${maxResults} results from grep. Consider using a more specific pattern.\n${matches.join("\n")}`,
    };
  },
});
