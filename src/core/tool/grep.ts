import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/grep.txt";

export const grepTool = tool({
  name: "Project search",
  description: DESCRIPTION,
  inputSchema: z.object({
    pattern: z
      .string()
      .min(1)
      .describe("The regex pattern to search for in file contents."),
    path: z
      .string()
      .optional()
      .describe(
        `The directoryThe directory to search in. IMPORTANT: Omit this field to use the default project directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a relative valid directory path if provided. to search in. Defaults to the project directory if not provided. If provided, path should be relative to the project root.`
      ),
    // include: z
    //   .string()
    //   .optional()
    //   .describe(
    //     'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'
    //   ),
  }),
  execute: async (params) => {
    if (!checkRgInstalled()) {
      throw new Error("rg not installed");
    }

    const grepCommand = ["rg", "--no-line-number", "--no-heading"];
    // params.include && grepCommand.push(...["--glob", params.include]);
    grepCommand.push(params.pattern);
    // TODO: make it work for running in sub directories
    const absolutePath =
      params.path === undefined
        ? process.cwd()
        : path.join(process.cwd(), params.path);
    grepCommand.push(absolutePath);

    console.log({ grepCommand });
    const proc = Bun.spawnSync(grepCommand);

    if (proc.exitCode === 1) {
      return {
        title: params.pattern,
        metadata: {
          pattern: params.pattern,
          path: params.path,
          // include: params.include,
          absolutePath,
        },
        output:
          "No files found. Call Project Search tool again with a more generic pattern.",
      };
    }

    if (proc.exitCode !== 0) {
      const errorOutput = proc.stderr?.toString() || "Unknown error";
      throw new Error(
        `Grep command failed with exit code ${proc.exitCode}: ${errorOutput}`
      );
    }

    const maxLength = 100;
    const matches = proc.stdout.toString().trim().split("\n");
    let truncated = false;

    if (matches.length > maxLength) {
      truncated = true;
      matches.splice(maxLength);
    }

    return {
      title: params.pattern,
      metadata: {
        pattern: params.pattern,
        path: params.path,
        // include: params.include,
        truncated,
      },
      output: truncated
        ? `Showing first ${maxLength} results from grep. Consider using a more specific pattern or path.\n${matches.join(
            "\n"
          )}`
        : `Matched content:\n${matches.join("\n")}`,
    };
  },
});

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
