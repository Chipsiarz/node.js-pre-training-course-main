const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const todo = await prisma.todo.create({
    data: {
      title: "New todo via ORM",
      description: "Created by createTodo.js",
      status: "active",
      user: { connect: { id: 1 } },
    },
  });
  console.log("Created todo:", todo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

