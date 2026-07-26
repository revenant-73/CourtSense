import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  const prisma = new PrismaClient({ adapter: adapter as any });

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@tvvc.org" },
    update: {},
    create: {
      email: "admin@tvvc.org",
      name: "Director",
      password: hashedPassword,
      role: "DIRECTOR",
    },
  });

  const evaluator = await prisma.user.upsert({
    where: { email: "evaluator@tvvc.org" },
    update: {},
    create: {
      email: "evaluator@tvvc.org",
      name: "Lead Evaluator",
      password: hashedPassword,
      role: "EVALUATOR",
    },
  });

  const checkin = await prisma.user.upsert({
    where: { email: "checkin@tvvc.org" },
    update: {},
    create: {
      email: "checkin@tvvc.org",
      name: "Check-in Staff",
      password: hashedPassword,
      role: "CHECK_IN",
    },
  });

  console.log("Users seeded.");

  // Seed Demo 16U Session
  const demoSession = await prisma.tryoutSession.upsert({
    where: { id: "demo-16u-session" },
    update: {},
    create: {
      id: "demo-16u-session",
      name: "Demo 16U Tryouts",
      organization: "COURTSENSE",
      date: new Date(),
      ageGroup: "16U",
      status: "ACTIVE",
    },
  });

  console.log("Demo session created.");
  
  // Clear existing demo athletes to avoid duplicates
  const demoAthleteIds = await prisma.athlete.findMany({
    where: { sessionId: demoSession.id },
    select: { id: true }
  }).then(list => list.map(a => a.id));

  await prisma.evaluation.deleteMany({ where: { athleteId: { in: demoAthleteIds } } });
  await prisma.tag.deleteMany({ where: { athleteId: { in: demoAthleteIds } } });
  await prisma.flag.deleteMany({ where: { athleteId: { in: demoAthleteIds } } });
  await prisma.athlete.deleteMany({ where: { sessionId: demoSession.id } });

  const firstNames = ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett", "Victoria", "Madison", "Luna", "Grace", "Chloe", "Penelope", "Layla", "Riley", "Zoey", "Nora"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
  const positions = ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"];

  // Seed 30 Athletes
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    
    const athlete = await prisma.athlete.create({
      data: {
        name: `${firstName} ${lastName}`,
        age: 15,
        ageGroup: "16U",
        positionPreference: pos,
        sessionId: demoSession.id,
        // Make some athletes already checked in
        checkInStatus: i < 10,
        athleteNumber: `16${(i + 1).toString().padStart(2, '0')}`,
        checkInTime: i < 10 ? new Date() : null,
      },
    });

    // Add some random evaluations for checked-in athletes
    if (i < 5) {
      await prisma.evaluation.create({
        data: {
          athleteId: athlete.id,
          evaluatorId: evaluator.id,
          perceptionScore: Math.floor(Math.random() * 4),
          adaptabilityScore: Math.floor(Math.random() * 4),
          functionalSkillScore: Math.floor(Math.random() * 4),
          engagementScore: Math.floor(Math.random() * 4),
          teamContributionScore: Math.floor(Math.random() * 4),
          learningBehaviorScore: Math.floor(Math.random() * 4),
          notes: "Demo evaluation notes.",
        },
      });
      
      // Add a random tag
      await prisma.tag.create({
        data: {
          athleteId: athlete.id,
          name: "Ball control",
          note: "Great touch",
        },
      });
    }

    if (i === 0) {
      // Add a flag to the first player
      await prisma.flag.create({
        data: {
          athleteId: athlete.id,
          evaluatorId: evaluator.id,
          type: "Discuss",
          note: "Top tier prospect",
        },
      });
    }
  }

  console.log("30 Demo athletes seeded.");
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
