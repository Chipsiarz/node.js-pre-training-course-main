import React from "react";
import { TodoItemProps } from "../../types";
import "./StyledToDoItem.css";

export const StyledToDoItem: React.FC<TodoItemProps> = ({ todo }) => {
  return (
    <div className={todo.completed ? "todo-item completed" : "todoItem"}>
      {todo.title}
    </div>
  );
};

