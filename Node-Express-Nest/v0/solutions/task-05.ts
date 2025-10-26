// NestJS Controller for /todos
import { Controller, Get } from "@nestjs/common";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Controller("todos")
export class TodosController {
  @Get()
  getTodos(): Todo[] {
    return [
      { id: 1, title: "Buy milk", completed: false },
      { id: 2, title: "Walk the dog", completed: true },
      { id: 3, title: "Finish homework", completed: false },
    ];
  }
}
