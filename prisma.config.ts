import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  // The orm section tells the Prisma CLI how to run the Prisma ORM
  orm: {
    // The adapter tells the CLI how to run `prisma generate` and `prisma db execute`
    adapter: { raw: "@prisma/client" },
    // The family tells the CLI which Prisma family to use
    family: { raw: "prisma" },
    // The target tells the CLI which ORM target to use
    target: { raw: "prisma-client-js" },
  },
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});