import React, { useState } from "react";
import { Todo } from "../../types";

export const FilteredToDoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const addTodo = () => {
    if (!inputValue.trim()) return;
    const newTodo: Todo = {
      id: Date.now(),
      title: inputValue.trim(),
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue("");
  };

  const completeTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: true } : todo
      )
    );
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Filtered ToDo List</h3>

      <input
        type="text"
        placeholder="Add todo"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button onClick={addTodo}>Add</button>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("active")}>Active</button>
        <button onClick={() => setFilter("completed")}>Completed</button>
      </div>

      <ul style={{ listStyleType: "none", marginTop: "1rem" }}>
        {filteredTodos.length === 0 ? (
          <p>No todos to display.</p>
        ) : (
          filteredTodos.map((todo) => (
            <li
              key={todo.id}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                marginBottom: "0.5rem",
              }}
            >
              {todo.title}{" "}
              {!todo.completed && (
                <button onClick={() => completeTodo(todo.id)}>Complete</button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

