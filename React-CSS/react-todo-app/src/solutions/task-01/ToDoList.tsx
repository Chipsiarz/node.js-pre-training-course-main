import React from "react";
import { TodoListProps } from "../../types";

export const ToDoList: React.FC<TodoListProps> = ({ todos }) => {
  if (!todos || todos.length === 0) {
    return <p>No todos available.</p>;
  }

  return (
    <div>
      <h3>Todo List</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} - {todo.completed ? "completed" : "not completed"}
          </li>
        ))}
      </ul>
    </div>
  );
};

