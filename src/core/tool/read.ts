import { tool } from "ai";
import z from "zod";
import path from "path";
import DESCRIPTION from "../prompt/read.txt";
import { getProjectPath } from "../util/path";

const LINE_COUNT = 100;

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
    const absolutePath = path.isAbsolute(params.filepath)
      ? params.filepath
      : path.join(getProjectPath(), params.filepath);
    const file = Bun.file(absolutePath);

    if (!file.exists()) {
      return {
        type: "FAILURE",
        title: absolutePath,
        output: `File does not exist. Verify the path ${params.filepath} is correct.`,
      };
    }

    const lines = (await file.text()).trim().split("\n");

    const count = params.count || LINE_COUNT;
    const fileSlice = lines
      .slice(
        params.inclusiveStartLineNumber - 1,
        params.inclusiveStartLineNumber - 1 + count
      )
      .map((line, i) => `${params.inclusiveStartLineNumber + i}:`.concat(line));

    return {
      type: "SUCCESS",
      title: absolutePath,
      metadata: {
        ...(fileSlice.length < lines.length && {
          nextInclusiveStartLineNumber: params.inclusiveStartLineNumber + count,
        }),
        readEntireFile: lines.length <= count,
        filepath: params.filepath,
        absolutePath,
      },
      output: fileSlice.join("\n"),
    };
  },
});
