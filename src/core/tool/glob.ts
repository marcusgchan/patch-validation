import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/glob.txt";

export type GlobToolExecuteReturn =
  | GlobToolSuccessExecuteReturn
  | GlobToolFailureExecuteReturn;

export interface GlobToolSuccessExecuteReturn {
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

export interface GlobToolFailureExecuteReturn {
  type: "FAILURE";
  title: string;
  output: string;
}

export function createGlobTool(targetDir: string) {
  return tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      pattern: z
        .string()
        .describe(
          "The glob pattern to match files against. Use **/ to search recursively through subdirectories."
        ),
      path: z
        .string()
        .optional()
        .describe(
          `The directory to search in. IMPORTANT: Omit this field to use the default project directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a relative valid directory path if provided.`
        ),
    }),
    execute: async (params): Promise<GlobToolExecuteReturn> => {
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
          : path.join(targetDir, params.path);
      const grepCommand = [
        "rg",
        "--files",
        "--glob",
        params.pattern,
        absolutePath,
      ];
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
            "No files found. Call Project Search tool again with a more generic glob.",
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
      const matchedFilepaths = proc.stdout.toString().trim().split("\n");
      let truncated = false;

      if (matchedFilepaths.length > maxLength) {
        truncated = true;
        matchedFilepaths.splice(maxLength);
      }

      return {
        type: "SUCCESS",
        title: params.pattern,
        metadata: {
          pattern: params.pattern,
          path: params.path,
          absolutePath,
          count: matchedFilepaths.length,
          truncated,
        },
        output: truncated
          ? `Showing first ${maxLength} results from grep. Consider using a more specific pattern or path.\n${matchedFilepaths.join(
              "\n"
            )}`
          : `Matched files:\n${matchedFilepaths.join("\n")}`,
      };
    },
  });
}

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
