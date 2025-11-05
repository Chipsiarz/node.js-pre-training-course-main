const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const id = Number(process.argv[2]);
  if (!id) {
    console.error("Usage: node deleteTodo.js <id>");
    process.exit(1);
  }

  const deleted = await prisma.todo.delete({ where: { id } });
  console.log("Deleted todo:", deleted);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

