const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const id = Number(process.argv[2]);
  if (!id) {
    console.error("Usage: node updateTodo.js <id>");
    process.exit(1);
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: {
      status: "completed",
      title: "Updated title (via script)",
    },
  });
  console.log("Updated todo:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

