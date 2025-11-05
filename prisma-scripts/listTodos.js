const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const todos = await prisma.todo.findMany({
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(todos, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

