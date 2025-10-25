import { TodoApi } from "./todo-api";
import { Todo, TodoStatus } from "./types";

export class TodoService {
  constructor(private readonly api: TodoApi) {}

  async create(title: string, description = ""): Promise<Todo> {
    if (!title.trim()) throw new Error("Title cannot be empty");
    return this.api.add({ title, description });
  }

  async toggleStatus(id: number): Promise<Todo> {
    const todos = await this.api.getAll();
    const todo = todos.find((t) => t.id === id);
    if (!todo) throw new Error(`Todo with id ${id} not found`);

    let newStatus: TodoStatus;
    switch (todo.status) {
      case TodoStatus.PENDING:
        newStatus = TodoStatus.IN_PROGRESS;
        break;
      case TodoStatus.IN_PROGRESS:
        newStatus = TodoStatus.COMPLETED;
        break;
      case TodoStatus.COMPLETED:
        newStatus = TodoStatus.PENDING;
        break;
      default:
        newStatus = TodoStatus.PENDING;
    }

    return this.api.update(id, { status: newStatus });
  }

  async search(keyword: string): Promise<Todo[]> {
    const todos = await this.api.getAll();
    const lower = keyword.toLowerCase();
    return todos.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.description && t.description.toLowerCase().includes(lower))
    );
  }
}

