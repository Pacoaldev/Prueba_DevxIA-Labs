import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const supervisorEmail = 'supervisor@translog.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: supervisorEmail },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('supervisor123', 10);
    await prisma.user.create({
      data: {
        email: supervisorEmail,
        passwordHash,
        role: Role.SUPERVISOR,
      },
    });
    console.log(`Supervisor user created: ${supervisorEmail}`);
  } else {
    console.log(`Supervisor user already exists: ${supervisorEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
