import React, { useState } from "react";
import { Todo } from "../../types";

export const AddToDo: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [todos, setTodos] = useState<Todo[] | any[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;

    const now = new Date().toISOString();
    const newTodo: Todo | any = {
      id: Date.now(),
      title,
      description: "",
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((prev) => [...prev, newTodo]);
    setInputValue("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, marginBottom: 12 }}
      >
        <input
          type="text"
          placeholder="Add todo"
          value={inputValue}
          onChange={handleChange}
          aria-label="Add todo"
          style={{ flex: 1, padding: "8px 10px", fontSize: 16 }}
        />
        <button type="submit" style={{ padding: "8px 12px", fontSize: 16 }}>
          Add
        </button>
      </form>

      <div>
        {todos.length === 0 ? (
          <p style={{ color: "#666" }}>No todos yet. Add your first todo!</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {todos.map((t) => (
              <li
                key={t.id}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    textDecoration: t.completed ? "line-through" : "none",
                  }}
                >
                  {t.title}
                </span>
                <small style={{ color: "#666" }}>
                  {t.completed ? "completed" : "not completed"}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

