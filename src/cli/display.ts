import type {
  CreateAnalysisStreamResult,
  CreateValidationStreamResult,
} from "../core";
import type {
  GlobToolExecuteReturn,
  GrepToolExecuteReturn,
  LsToolExecuteReturn,
  ReadToolExecuteReturn,
  FinalAnswerToolExecuteReturn,
  CreateTodoToolExecuteReturn,
  UpdateTodoToolExecuteReturn,
  TodoItem,
} from "../core/tool";

// TODO: add proper typing
type StreamChunk = any;

export type AnalysisState = {
  analysisText: string;
  todoList: TodoItem[] | null;
  exitCode: number;
};

export type ValidationState = {
  exitCode: number;
};

function displayToolResult(
  toolName: string,
  output: unknown,
  analysisState?: AnalysisState,
  validationState?: ValidationState
) {
  switch (toolName) {
    case "lsTool": {
      const data = output as LsToolExecuteReturn;
      console.log(data.title);
      if (data.metadata.truncated) {
        console.log("Showing truncated results:");
      } else {
        console.log(`Showing ${data.metadata.count} result(s):`);
      }
      console.log(data.output);
      return;
    }
    case "readTool": {
      const data = output as ReadToolExecuteReturn;
      console.log(data.title);
      if (data.type === "SUCCESS") {
        console.log(
          data.metadata.readEntireFile
            ? "Reading entire file"
            : "Reading portion of file"
        );
      }
      console.log(data.output);
      return;
    }
    case "globTool": {
      const data = output as GlobToolExecuteReturn;
      console.log(data.title);
      console.log(data.output);
      return;
    }
    case "grepTool": {
      const data = output as GrepToolExecuteReturn;
      console.log(data.title);
      console.log(data.output);
      return;
    }
    case "getDiff": {
      // Mirrors other tool display: show title and diff content
      const data = output as { title: string; output: string };
      console.log(data.title);
      console.log(data.output);
      return;
    }
    case "createTodo": {
      const data = output as CreateTodoToolExecuteReturn;
      console.log(data.title);
      console.log(data.output);
      if (analysisState) {
        analysisState.todoList = data.metadata.todos;
      }
      return;
    }
    case "updateTodo": {
      const data = output as UpdateTodoToolExecuteReturn;
      console.log(data.title);

      console.log(data.output);
      return;
    }
    case "finalAnswer": {
      const data = output as FinalAnswerToolExecuteReturn;
      const reason = "REASON:\n" + data.metadata.reason;
      if (validationState) {
        validationState.exitCode = data.metadata.result ? 0 : 1;
      }
      if (!data.metadata.result) {
        console.log(`INCORRECT\n${reason}`);
      } else {
        console.log(`CORRECT\n${reason}`);
      }
      return;
    }
  }
}

export function handleAnalysisChunk(chunk: StreamChunk, state: AnalysisState) {
  switch (chunk.type) {
    case "text-delta": {
      state.analysisText += chunk.text as string;
      process.stdout.write(chunk.text as string);
      return;
    }
    case "tool-call": {
      console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
      return;
    }
    case "tool-error": {
      console.log(`Tool error: ${chunk.error}`);
      return;
    }
    case "error": {
      console.log(`Error: ${chunk.error}`);
      state.exitCode = 3;
      return;
    }
    case "tool-result": {
      displayToolResult(chunk.toolName as string, chunk.output, state);
      return;
    }
    case "finish": {
      console.log("\n");
      return;
    }
  }
}

export function handleValidationChunk(
  chunk: StreamChunk,
  state: ValidationState
) {
  switch (chunk.type) {
    case "text-delta": {
      process.stdout.write(chunk.text as string);
      return;
    }
    case "tool-call": {
      console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
      return;
    }
    case "tool-error": {
      console.log(`Tool error: ${chunk.error}`);
      return;
    }
    case "error": {
      console.log(`Error: ${chunk.error}`);
      state.exitCode = 3;
      return;
    }
    case "tool-result": {
      displayToolResult(
        chunk.toolName as string,
        chunk.output,
        undefined,
        state
      );
      return;
    }
    case "finish": {
      console.log("\n");
      return;
    }
  }
}

export async function displayAnalysisStream(
  fullStream: CreateAnalysisStreamResult["fullStream"]
): Promise<AnalysisState> {
  const state: AnalysisState = {
    analysisText: "",
    todoList: null,
    exitCode: 0,
  };
  for await (const chunk of fullStream) {
    handleAnalysisChunk(chunk, state);
  }
  return state;
}

export async function displayValidationStream(
  fullStream: CreateValidationStreamResult["fullStream"]
): Promise<ValidationState> {
  const state: ValidationState = { exitCode: 0 };
  for await (const chunk of fullStream) {
    handleValidationChunk(chunk, state);
  }
  return state;
}
