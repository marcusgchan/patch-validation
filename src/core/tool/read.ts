import { tool } from "ai";
import z from "zod";

export const readTool = tool({
  name: "Read file",
  description: "Reads the contents of the specified file",
  inputSchema: z.object({}),
  execute: async () => {},
});
