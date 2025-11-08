import { createAnalysisAgent } from "./agents/analysis-agent";
import { createValidationAgent } from "./agents/validation-agent";
import { analysisTransformer } from "./transformer/analysis-transformer";
import { validationTransformer } from "./transformer/validation-transformer";
import type { TodoItem } from "./types/todo-item";

// TODO: Verify dependencies

export function createAnalysisStream(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const analysisAgent = createAnalysisAgent(targetDir);
  return analysisAgent.stream({
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });
}

export type CreateAnalysisStreamResult = ReturnType<
  typeof createAnalysisStream
>;

// export function createValidationStream(
//   targetDir: string,
//   prompt: string,
//   bugDescription: string,
//   diff: string,
//   analysisText: string,
//   todoList: TodoItem[]
// ) {
//   if (process.env.OPENAI_API_KEY === undefined) {
//     throw new Error("OPENAI_API_KEY not set");
//   }

//   const todoListText = todoList
//     .map((todo, index) => `- [ ] ${todo.description} (ID: ${todo.id})`)
//     .join("\n");

//   const validationAgent = createValidationAgent(targetDir, {
//     todos: todoList,
//     diff,
//   });
//   return validationAgent.stream({
//     prompt: `Todo List for Validation:\n${todoListText}\n\nAnalysis Results:\n${analysisText}\n\nBug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
//   });
// }

// export type CreateValidationStreamResult = ReturnType<
//   typeof createValidationStream
// >;

export async function createAnalysisGenerate(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const analysisAgent = createAnalysisAgent(targetDir);
  const generatedResponse = await analysisAgent.generate({
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });

  return analysisTransformer(generatedResponse);
}

export type CreateAnalysisGenerateResult = Awaited<
  ReturnType<typeof createAnalysisGenerate>
>;

export async function createValidationGenerate(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string,
  todoDescription: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const validationAgent = createValidationAgent(targetDir);
  const generatedResponse = await validationAgent.generate({
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}\n\nTodo Item:\n${todoDescription}`,
  });

  return validationTransformer(generatedResponse);
}

export type CreateValidationGenerateResult = Awaited<
  ReturnType<typeof createValidationGenerate>
>;

export async function validateTodoList(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string,
  todoList: TodoItem[]
) {
  let output = "";
  for (let i = 0; i < todoList.length; i++) {
    const todo = todoList[i]!;

    output += `Validating todo item ${i + 1} of ${
      todoList.length
    }\ndescription: '${todo.description}'\n\n`;

    const validationResult = await createValidationGenerate(
      targetDir,
      prompt,
      bugDescription,
      diff,
      todo.description
    );
    output += validationResult.output;

    if (!validationResult.result) {
      return {
        result: false,
        output: output,
      };
    }

    output += `Todo item ${i + 1} of ${
      todoList.length
    } is correct\ndescription: '${todo.description}'\n\n`;

    await Bun.sleep(1 * 1000);
  }

  return { result: true, output: output };
}
