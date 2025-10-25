import { TodoService } from "../JS-TS/solutions/todo-service";
import { TodoApi } from "../JS-TS/solutions/todo-api";
import { TodoStatus, Todo } from "../JS-TS/solutions/types";

class MockTodoApi extends TodoApi {
  private todos: Todo[] = [];

  async add(todoData: { title: string; description?: string }) {
    const todo: Todo = {
      id: this.todos.length + 1,
      title: todoData.title,
      description: todoData.description || "",
      status: TodoStatus.PENDING,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  async update(id: number, update: Partial<Omit<Todo, "id" | "createdAt">>) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) throw new Error(`Todo with id ${id} not found`);
    Object.assign(todo, update);
    return todo;
  }

  async getAll() {
    return this.todos;
  }
}

describe("TodoService", () => {
  let service: TodoService;

  beforeEach(() => {
    service = new TodoService(new MockTodoApi());
  });

  it("should create a todo", async () => {
    const todo = await service.create("Test title", "desc");
    expect(todo.id).toBe(1);
    expect(todo.status).toBe(TodoStatus.PENDING);
    expect(todo.title).toBe("Test title");
    expect(todo.description).toBe("desc");
  });

  it("should toggle status", async () => {
    const todo = await service.create("Toggle test");
    let updated = await service.toggleStatus(todo.id);
    expect(updated.status).toBe(TodoStatus.IN_PROGRESS);

    updated = await service.toggleStatus(todo.id);
    expect(updated.status).toBe(TodoStatus.COMPLETED);

    updated = await service.toggleStatus(todo.id);
    expect(updated.status).toBe(TodoStatus.PENDING);
  });

  it("should search todos case-insensitively", async () => {
    await service.create("Find me", "something");
    await service.create("Do not search me");
    const results = await service.search("find");
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Find me");
  });

  it("should throw error when toggling non-existing todo", async () => {
    await expect(service.toggleStatus(999)).rejects.toThrow(
      "Todo with id 999 not found"
    );
  });
});

