import { Todo, NewTodo, TodoStatus } from "./types";

let nextId = 1;

export function createTodo(input: NewTodo): Todo {
  const todo: Todo = {
    id: nextId++,
    ...input,
    createdAt: new Date(),
    status: TodoStatus.PENDING,
  };

  return todo;
}

