import React from "react";
import { TodoItemProps } from "../../types";

export const ToDoItem: React.FC<TodoItemProps> = ({ todo }) => {
  return (
    <div
      style={{
        marginBottom: "8px",
        padding: "4px 8px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        backgroundColor: todo.completed ? "#e6ffe6" : "#fff",
      }}
    >
      <span
        style={{
          textDecoration: todo.completed ? "line-through" : "none",
          fontWeight: 500,
        }}
      >
        {todo.title}
      </span>{" "}
      — <em>{todo.completed ? "completed" : "not completed"}</em>
    </div>
  );
};

