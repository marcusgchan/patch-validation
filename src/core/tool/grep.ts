import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/grep.txt";

export type GrepToolExecuteReturn =
  | GrepToolSuccessExecuteReturn
  | GrepToolFailureExecuteReturn;

export interface GrepToolSuccessExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    pattern: string;
    path?: string;
    absolutePath: string;
    count: number;
    truncated: boolean;
  };
  output: string;
}

export interface GrepToolFailureExecuteReturn {
  type: "FAILURE";
  title: string;
  output: string;
}

export const grepTool = tool({
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
  execute: async (params): Promise<GrepToolExecuteReturn> => {
    if (!checkRgInstalled()) {
      return {
        type: "FAILURE",
        title: params.pattern,
        output:
          "rg (ripgrep) is not installed. Please install ripgrep to use the project search tool.",
      };
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
        type: "SUCCESS",
        title: params.pattern,
        metadata: {
          pattern: params.pattern,
          path: params.path,
          absolutePath,
          count: 0,
          truncated: false,
        },
        output:
          "No files found. Call grepTool again with a more generic pattern.",
      };
    }

    if (proc.exitCode !== 0) {
      const errorOutput = proc.stderr?.toString() || "Unknown error";
      return {
        type: "FAILURE",
        title: params.pattern,
        output: `Grep command failed with exit code ${proc.exitCode}: ${errorOutput}`,
      };
    }

    const maxLength = 100;
    const matches = proc.stdout.toString().trim().split("\n");
    let truncated = false;

    if (matches.length > maxLength) {
      truncated = true;
      matches.splice(maxLength);
    }

    return {
      type: "SUCCESS",
      title: params.pattern,
      metadata: {
        pattern: params.pattern,
        path: params.path,
        absolutePath,
        count: matches.length,
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
