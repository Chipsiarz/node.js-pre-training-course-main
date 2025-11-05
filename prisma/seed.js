import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.create({
    data: {
      username: "alice",
      email: "alice@example.com",
      password: "password123",
      todos: {
        create: [
          {
            title: "Buy groceries",
            description: "Milk, bread, eggs",
            status: "active",
          },
          { title: "Call mom", status: "completed" },
          { title: "Finish project", status: "active" },
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "bob",
      email: "bob@example.com",
      password: "securepass",
      todos: {
        create: [
          { title: "Read a book", status: "completed" },
          { title: "Go to gym", status: "active" },
          { title: "Clean the kitchen", status: "active" },
        ],
      },
    },
  });

  console.log({ user1, user2 });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

