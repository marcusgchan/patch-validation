import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/read.txt";

const LINE_COUNT = 300;

export const readTool = tool({
  name: "Read file",
  description: DESCRIPTION,
  inputSchema: z.object({
    filepath: z
      .string()
      .describe(
        "The absolute filepath to read. Use absolute paths from other tools or construct from project root."
      ),
    inclusiveStartLineNumber: z.coerce
      .number()
      .describe("The 1-indexed inclusive start line number."),
    count: z.coerce
      .number()
      .optional()
      .describe(
        `The number of lines to read including the inclusive start line number. If not provided, the default is ${LINE_COUNT}`
      ),
  }),
  execute: async (params) => {
    if (!path.isAbsolute(params.filepath)) {
      return {
        title: "Invalid Path",
        output: `Path must be absolute. You provided: "${params.filepath}". Use absolute paths from other tools (like glob tool results) or construct from project root.`,
      };
    }

    const absolutePath = params.filepath;
    const file = Bun.file(absolutePath);

    if (!file.exists()) {
      return {
        title: absolutePath,
        output: `File does not exist. Verify the path ${params.filepath} is correct.`,
      };
    }

    const lines = (await file.text()).trim().split("\n");

    const fileSlice = lines
      .slice(
        params.inclusiveStartLineNumber - 1,
        params.inclusiveStartLineNumber - 1 + LINE_COUNT
      )
      .map((line, i) => `${params.inclusiveStartLineNumber + i}:`.concat(line));

    return {
      title: absolutePath,
      metadata: {
        ...(lines.length <= LINE_COUNT
          ? {
              entireFileRead: true,
            }
          : {
              entireFileRead: false,
              nextInclusiveStartLineNumer:
                params.inclusiveStartLineNumber + LINE_COUNT,
            }),
        filepath: params.filepath,
        absolutePath,
      },
      output: fileSlice.join("\n"),
    };
  },
});
