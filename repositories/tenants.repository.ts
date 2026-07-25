import { prisma } from "@/lib/db";
import type { Tenant } from "@prisma/client";

export const tenantsRepository = {
  async findByApiKey(apiKey: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { apiKey } });
  },

  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  },

  async list(): Promise<Tenant[]> {
    return prisma.tenant.findMany({ orderBy: { createdAt: "asc" } });
  },
};
