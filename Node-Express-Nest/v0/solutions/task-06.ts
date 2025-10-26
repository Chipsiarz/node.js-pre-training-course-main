// NestJS Service for ToDos
import { Injectable, NotFoundException } from "@nestjs/common";
import { Todo } from "./task-05";

@Injectable()
export class TodosService {
  private todos: Todo[] = [
    { id: 1, title: "Buy milk", completed: false },
    { id: 2, title: "Walk the dog", completed: true },
  ];

  getTodos(): Todo[] {
    return this.todos;
  }

  addTodo(title: string): Todo {
    const newTodo: Todo = {
      id: this.todos.length + 1,
      title,
      completed: false,
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  markCompleted(id: number): Todo {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) throw new NotFoundException(`Todo with id ${id} not found`);
    todo.completed = true;
    return todo;
  }
}
