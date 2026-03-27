import "dotenv/config";
import { defineConfig } from "prisma/config";

const useMaster = process.env.PRISMA_SCHEMA === 'master';

export default defineConfig({
  schema: useMaster ? "prisma/master.schema.prisma" : "prisma/schema.prisma",
  datasource: {
    url: useMaster ? process.env.MASTER_DATABASE_URL : process.env.DATABASE_URL,
  },
});
