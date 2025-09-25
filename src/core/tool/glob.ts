import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/glob.txt";

export const globTool = tool({
  name: "projectSearch",
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
  execute: async (params) => {
    console.log("calling glob tool with params:", params);
    if (!checkRgInstalled()) {
      throw new Error("rg not installed");
    }

    console.log("creating path");
    // TODO: make it work for running in sub directories
    const absolutePath =
      params.path === undefined
        ? process.cwd()
        : path.join(process.cwd(), params.path);
    const grepCommand = [
      "rg",
      "--files",
      "--glob",
      params.pattern,
      absolutePath,
    ];
    console.log({ grepCommand });
    const proc = Bun.spawnSync(grepCommand);

    if (proc.exitCode === 1) {
      console.log("No files found");
      return {
        title: params.pattern,
        metadata: {
          pattern: params.pattern,
          path: params.path,
          absolutePath,
        },
        output:
          "No files found. Call Project Search tool again with a more generic glob.",
      };
    }

    if (proc.exitCode !== 0) {
      const errorOutput = proc.stderr?.toString() || "Unknown error";
      throw new Error(
        `Grep command failed with exit code ${proc.exitCode}: ${errorOutput}`
      );
    }
    console.log("building str");
    const maxLength = 100;
    const matchedFilepaths = proc.stdout.toString().trim().split("\n");
    let truncated = false;

    if (matchedFilepaths.length > maxLength) {
      truncated = true;
      matchedFilepaths.splice(maxLength);
    }
    console.log({ matchedFilepaths });
    return {
      title: params.pattern,
      metadata: {
        pattern: params.pattern,
        path: params.path,
        absolutePath,
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

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
