import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const email = process.env.BOOTSTRAP_DIRECTOR_EMAIL;
  const name = process.env.BOOTSTRAP_DIRECTOR_NAME;
  const password = process.env.BOOTSTRAP_DIRECTOR_PASSWORD;

  if (!email || !name || !password) {
    console.error(
      "Set BOOTSTRAP_DIRECTOR_EMAIL, BOOTSTRAP_DIRECTOR_NAME, and BOOTSTRAP_DIRECTOR_PASSWORD before running this script."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("BOOTSTRAP_DIRECTOR_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`A user with email ${email} already exists. Nothing to do.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const director = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "DIRECTOR",
    },
  });

  console.log(`Director account created: ${director.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
