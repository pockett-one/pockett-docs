import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const mems = await prisma.projectMember.findMany({
      include: {
        persona: {
          include: { rbacPersona: true }
        }
      },
      take: 5
    })
    console.log(JSON.stringify(mems, null, 2))
}
main().catch(console.error)
