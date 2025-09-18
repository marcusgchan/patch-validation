import { tool } from "ai";
import z from "zod";
import path from "path";

export const globTool = tool({
  name: "Project Search",
  description: "Searches for a file.",
  inputSchema: z.object({
    pattern: z.string().describe("The glob pattern to match files against"),
    path: z
      .string()
      .optional()
      .describe(
        `The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a relative valid directory path if provided.`,
      ),
  }),
  execute: async (params) => {
    if (!checkRgInstalled()) {
      throw new Error("rg not installed");
    }

    // TODO: make it work for running in sub directories
    const absolutePath =
      params.path === undefined
        ? process.cwd()
        : path.join(process.cwd(), params.path);
    const grepCommand = ["rg", "--files", params.pattern, absolutePath];
    const proc = Bun.spawnSync(grepCommand);

    if (proc.exitCode === 1) {
      return {
        title: params.pattern,
        metadata: {
          pattern: params.pattern,
          path: params.path,
          absolutePath,
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

    const maxLength = 100;
    const matchedFilepaths = proc.stdout.toString().trim().split("\n");
    let truncated = false;

    if (matchedFilepaths.length > maxLength) {
      truncated = true;
      matchedFilepaths.splice(maxLength);
    }

    return {
      title: params.pattern,
      metadata: {
        pattern: params.pattern,
        path: params.path,
        absolutePath,
        truncated,
      },
      output: `Showing first ${maxLength} results from grep. Consider using a more specific pattern or path.\n${matchedFilepaths.join("\n")}`,
    };
  },
});

function checkRgInstalled() {
  const proc = Bun.spawnSync(["rg", "--version"]);
  return proc.success;
}
