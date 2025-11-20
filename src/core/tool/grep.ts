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

export function createGrepTool(targetDir: string) {
  return tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      pattern: z
        .string()
        .min(1)
        .describe(
          "The regex pattern to search for in file contents. Special regex characters (like parentheses, brackets, dots, etc.) must be escaped with backslashes if you want to match them literally."
        ),
      path: z
        .string()
        .optional()
        .describe(
          `The directory to search in. IMPORTANT: Omit this field to use the default project directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a relative valid directory path if provided.`
        ),
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

      const absolutePath =
        params.path === undefined
          ? targetDir
          : path.isAbsolute(params.path)
          ? params.path
          : path.join(targetDir, params.path);

      const grepCommand = ["rg", "--no-heading", "--line-number"];
      grepCommand.push(params.pattern);
      grepCommand.push(absolutePath);
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

      const maxLength = 50;
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
}

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
