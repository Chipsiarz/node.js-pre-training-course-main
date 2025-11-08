import React from "react";
import { ActiveCountProps } from "../../types";

export const ActiveCount: React.FC<ActiveCountProps> = ({ todos }) => {
  const activeCount = todos.filter((todo) => !todo.completed).length;
  const text =
    activeCount === 1 ? "1 active todo" : `${activeCount} active todos`;

  return (
    <div>
      <p>{text}</p>
    </div>
  );
};

