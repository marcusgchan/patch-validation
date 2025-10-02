import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/read.txt";

const LINE_COUNT = 20;

export type ReadToolExecuteReturn =
  | ReadToolSuccessExecuteReturn
  | ReadToolFailureExecuteReturn;

export interface ReadToolSuccessExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    readEntireFile: boolean;
    nextInclusiveStartLineNumber?: number;
    filepath: string;
    absolutePath: string;
  };
  output: string;
}

export interface ReadToolFailureExecuteReturn {
  type: "FAILURE";
  title: string;
  output: string;
}

export const readTool = tool({
  name: "readTool",
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
  execute: async (params): Promise<ReadToolExecuteReturn> => {
    if (!path.isAbsolute(params.filepath)) {
      return {
        type: "FAILURE",
        title: params.filepath,
        output: `Path must be absolute. You provided: "${params.filepath}". Use absolute paths from other tools (like glob tool results) or construct from project root.`,
      };
    }

    const absolutePath = params.filepath;
    const file = Bun.file(absolutePath);

    if (!file.exists()) {
      return {
        type: "FAILURE",
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
      type: "SUCCESS",
      title: absolutePath,
      metadata: {
        ...(lines.length > LINE_COUNT && {
          nextInclusiveStartLineNumber:
            params.inclusiveStartLineNumber + LINE_COUNT + 1,
        }),
        readEntireFile: lines.length <= LINE_COUNT,
        filepath: params.filepath,
        absolutePath,
      },
      output: fileSlice.join("\n"),
    };
  },
});
