import { PrismaClient } from "@prisma/client";
import  {withAccelerate} from "@prisma/extension-accelerate";


const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }).$extends(withAccelerate());
  
  export default prisma;