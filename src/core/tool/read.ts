import { tool } from "ai";
import z from "zod";
import path from "path";

const LINE_COUNT = 300;

export const readTool = tool({
  name: "Read file",
  description: `Reads the contents of the specified file. You can only read file with text data. Gives a slice of a file with the inclusive start line and count. The default should be to read ${LINE_COUNT} lines each time. If the function under analysis is not fully contained in the output, increase the end line number by another ${LINE_COUNT}. The output of the previous call will provide the next inclusive start line number.`,
  inputSchema: z.object({
    filepath: z
      .string()
      .describe(
        "The relative filepath to read. The path will automatically be joined to the project root path.",
      ),
    inclusiveStartLineNumber: z.coerce
      .number()
      .describe("The 1-indexed inclusive start line number."),
    count: z.coerce
      .number()
      .optional()
      .describe(
        `The number of lines to read including the inclusive start line number. If not provided, the default is ${LINE_COUNT}`,
      ),
  }),
  execute: async (params) => {
    const absolutePath = path.join(process.cwd(), params.filepath);
    const file = Bun.file(absolutePath);

    if (!file.exists()) {
      return {
        title: absolutePath,
        output: `File does not exist. Verify the relative path ${params.filepath} to the project root is correct.`,
      };
    }

    const lines = (await file.text()).trim().split("\n");

    const fileSlice = lines
      .slice(
        params.inclusiveStartLineNumber - 1,
        params.inclusiveStartLineNumber - 1 + LINE_COUNT,
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
