import { createAnalysisAgent } from "./agents/analysis-agent";
import { createValidationAgent } from "./agents/validation-agent";
import type { TodoItem } from "./tool";

// TODO: Verify dependencies

export function createAnalysisStream(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  const analysisAgent = createAnalysisAgent(targetDir);
  return analysisAgent.stream({
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });
}

export function createValidationStream(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string,
  analysisText: string,
  todoList: TodoItem[]
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  const todoListText = todoList
    .map((todo, index) => `- [ ] ${todo.description} (ID: ${todo.id})`)
    .join("\n");

  const validationAgent = createValidationAgent(targetDir, {
    todos: todoList,
    diff,
  });
  return validationAgent.stream({
    prompt: `Todo List for Validation:\n${todoListText}\n\nAnalysis Results:\n${analysisText}\n\nBug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });
}
