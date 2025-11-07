import React from "react";
import { TodoListProps } from "../../types";

/**
 * Task 1: ToDoList Component
 */
export const ToDoList: React.FC<TodoListProps> = ({ todos }) => {
  if (!todos || todos.length === 0) {
    return <p>No todos available.</p>;
  }

  return (
    <div>
      <h3>Todo List</h3>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} – {todo.completed ? "completed" : "not completed"}
          </li>
        ))}
      </ul>
    </div>
  );
};

