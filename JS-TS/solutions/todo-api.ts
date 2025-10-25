import { InMemoryRepository } from "./repository";
import { Todo, NewTodo, TodoStatus } from "./types";

export class TodoNotFoundError extends Error {
  constructor(id: number) {
    super(`Todo with id ${id} not found`);
    this.name = "TodoNotFoundError";
  }
}

export class TodoApi {
  private repo = new InMemoryRepository<Todo>();

  private async simulateNetwork<T>(result: T): Promise<T> {
    const delay = Math.random() * 300 + 300;
    return new Promise((resolve) => setTimeout(() => resolve(result), delay));
  }

  async getAll(): Promise<Todo[]> {
    return this.simulateNetwork(this.repo.findAll());
  }

  async add(newTodo: NewTodo): Promise<Todo> {
    const todo: Todo = {
      ...newTodo,
      id: Date.now(),
      status: TodoStatus.PENDING,
      createdAt: new Date(),
    };
    this.repo.add(todo);
    return this.simulateNetwork(todo);
  }

  async update(
    id: number,
    update: Partial<Omit<Todo, "id" | "createdAt">>
  ): Promise<Todo> {
    const todo = this.repo.findById(id);
    if (!todo) throw new TodoNotFoundError(id);

    const updated = this.repo.update(id, { ...todo, ...update });
    return this.simulateNetwork(updated);
  }

  async remove(id: number): Promise<void> {
    const todo = this.repo.findById(id);
    if (!todo) throw new TodoNotFoundError(id);

    this.repo.remove(id);
    return this.simulateNetwork(undefined);
  }
}

