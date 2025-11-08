import React, { useState } from "react";
import { Todo } from "../../types";

export const CompleteToDoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");

  const addTodo = () => {
    if (!inputValue.trim()) return;
    const newTodo: Todo = {
      id: Date.now(),
      title: inputValue,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue("");
  };

  const markCompleted = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: true } : todo
      )
    );
  };

  return (
    <div>
      <h3>Complete ToDo List</h3>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Add todo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul style={{ listStyleType: "none", marginTop: "1rem" }}>
        {todos.length === 0 && <p>No todos yet.</p>}
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                marginRight: "8px",
              }}
            >
              {todo.title}
            </span>
            {todo.completed ? (
              <span>(completed)</span>
            ) : (
              <button onClick={() => markCompleted(todo.id)}>Complete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

