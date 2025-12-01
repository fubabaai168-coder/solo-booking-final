import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = 'ab620a6f-085a-4977-ad46-dc94891a778a'; // The ID causing the error

  // Upsert: Create if not exists
  const resource = await prisma.resource.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name: 'Solo Success Bistro',
      description: 'Manually fixed via SoloAI',
      type: 'restaurant'
    },
  });
  console.log('✅ Resource fixed:', resource);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

