import { TodoService } from "./todo-service";
import { TodoApi } from "./todo-api";
import { Todo, TodoStatus } from "./types";

export class ToDoManager {
  private service = new TodoService(new TodoApi());

  async init(): Promise<void> {
    await this.add("Learn TypeScript");
    await this.add("Refactor code", "Clean up old functions");
    await this.add("Write tests");
  }

  async add(title: string, description = ""): Promise<void> {
    await this.service.create(title, description);
  }

  async complete(id: number): Promise<void> {
    const todos = await this.service.search("");
    const todo = todos.find((t) => t.id === id);
    if (!todo) throw new Error(`Todo with id ${id} not found`);
    if (todo.status !== TodoStatus.COMPLETED) {
      await this.service.toggleStatus(id);
    }
  }

  async list(): Promise<Todo[]> {
    return this.service.search("");
  }
}

