import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * One PrismaClient per server process, created on first use. Creating it lazily means
 * `next build` and tooling can import modules that use `db` without a DATABASE_URL.
 * In development, the client is kept on globalThis so hot reload doesn't open new pools.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  // Cache in every environment: one pool per process (dev hot reload reuses it too).
  globalForPrisma.prisma = client;
  return client;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value: unknown = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
