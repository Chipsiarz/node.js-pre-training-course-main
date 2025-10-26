// NestJS Controller for /todos
import { Controller, Get } from "@nestjs/common";

@Controller("todos")
export class TodosController {
  @Get()
  getTodos() {
    return [
      { id: 1, title: "Buy milk", completed: false },
      { id: 2, title: "Walk the dog", completed: true },
      { id: 3, title: "Finish homework", completed: false },
    ];
  }
}
