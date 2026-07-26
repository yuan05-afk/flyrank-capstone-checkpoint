import { prisma } from "@/lib/db";
import type { Widget } from "@prisma/client";

export type WidgetCreateData = {
  tenantId: string;
  type: string;
  name: string;
  copy: string;
  fields: string;
  targeting: string;
  active?: boolean;
};

export type WidgetUpdateData = Partial<
  Omit<WidgetCreateData, "tenantId">
>;

export const widgetsRepository = {
  async create(data: WidgetCreateData): Promise<Widget> {
    return prisma.widget.create({ data });
  },

  async listByTenant(tenantId: string): Promise<Widget[]> {
    return prisma.widget.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.widget.count({ where: { tenantId } });
  },

  async findByIdForTenant(
    id: string,
    tenantId: string
  ): Promise<Widget | null> {
    return prisma.widget.findFirst({ where: { id, tenantId } });
  },

  async findByIdPublic(id: string): Promise<Widget | null> {
    return prisma.widget.findFirst({ where: { id, active: true } });
  },

  async updateForTenant(
    id: string,
    tenantId: string,
    data: WidgetUpdateData
  ): Promise<Widget | null> {
    const existing = await prisma.widget.findFirst({ where: { id, tenantId } });
    if (!existing) return null;
    return prisma.widget.update({ where: { id }, data });
  },

  async deleteForTenant(id: string, tenantId: string): Promise<boolean> {
    const existing = await prisma.widget.findFirst({ where: { id, tenantId } });
    if (!existing) return false;
    await prisma.widget.delete({ where: { id } });
    return true;
  },
};
