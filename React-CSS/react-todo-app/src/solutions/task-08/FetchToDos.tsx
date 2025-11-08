import React, { useState, useEffect } from "react";
import { Todo } from "../../types";

export const FetchToDos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/todos");
        if (!res.ok) throw new Error("Failed to fetch todos");
        const data = await res.json();
        setTodos(data.slice(0, 5));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  if (loading) return <p>Loading todos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h4>Fetched ToDos</h4>
      <ul style={{ listStyleType: "none", marginTop: "1rem" }}>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} – {todo.completed ? "completed" : "not completed"}
          </li>
        ))}
      </ul>
    </div>
  );
};

