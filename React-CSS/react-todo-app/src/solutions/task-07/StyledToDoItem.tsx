import React from "react";
import { TodoItemProps } from "../../types";
import "./StyledToDoItem.css";

export const StyledToDoItem: React.FC<TodoItemProps> = ({ todo }) => {
  return (
    <div className={todo.completed ? "todo-item completed" : "todo-item"}>
      <span>{todo.title}</span>
      {todo.completed && <span> (completed)</span>}
    </div>
  );
};

