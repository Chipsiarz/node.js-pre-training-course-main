const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      username: "eva",
      email: "eva@example.com",
      password: "password123",
    },
  });
  console.log("Created user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

