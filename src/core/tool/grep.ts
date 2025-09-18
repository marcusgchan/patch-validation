import { tool } from "ai";
import z from "zod";
import path from "path";

export const grepTool = tool({
  name: "Project search",
  description:
    "Searches for contents in a file from starting directory using ripgrep.",
  inputSchema: z.object({
    pattern: z
      .string()
      .min(1)
      .describe("The regex pattern to search for in file contents."),
    path: z
      .string()
      .optional()
      .describe(
        "The directory to search in. Defaults to the project directory if not provided. If provided, path should be relative to the project root.",
      ),
    include: z
      .string()
      .optional()
      .describe(
        'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")',
      ),
  }),
  execute: async (params) => {
    if (!checkRgInstalled()) {
      throw new Error("rg not installed");
    }

    const grepCommand = ["rg", "--no-line-number", "--no-headings"];
    params.include && grepCommand.push(...["--glob", params.include]);
    grepCommand.push(params.pattern);
    // TODO: make it work for running in sub directories
    const absolutePath =
      params.path === undefined
        ? process.cwd()
        : path.join(process.cwd(), params.path);
    grepCommand.push(absolutePath);

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
      const errorOutput = proc.stderr?.toString() || "Unknown error";
      throw new Error(
        `Grep command failed with exit code ${proc.exitCode}: ${errorOutput}`,
      );
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
      title: absolutePath,
      metadata: {
        pattern: params.pattern,
        path: params.path,
        include: params.include,
        absolutePath,
        truncated,
      },
      output: `Showing first ${maxResults} results from grep. Consider using a more specific pattern.\n${matches.join(
        "\n",
      )}`,
    };
  },
});

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
