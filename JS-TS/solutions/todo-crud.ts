import { Todo } from "./types";

export function addTodo(state: Todo[], todo: Todo): Todo[] {
  return [...state, todo];
}

export function updateTodo(
  state: Todo[],
  id: number,
  update: Partial<Omit<Todo, "id" | "createdAt">>
): Todo[] {
  let found = false;
  const newState = state.map((todo) => {
    if (todo.id === id) {
      found = true;
      return { ...todo, ...update };
    }
    return todo;
  });
  if (!found) throw new Error(`Todo with id ${id} not found`);
  return newState;
}

export function removeTodo(state: Todo[], id: number): Todo[] {
  const exists = state.some((todo) => todo.id === id);
  if (!exists) throw new Error(`Todo with id ${id} not found`);
  return state.filter((todo) => todo.id !== id);
}

export function getTodo(state: Todo[], id: number): Todo | undefined {
  return state.find((todo) => todo.id === id);
}

