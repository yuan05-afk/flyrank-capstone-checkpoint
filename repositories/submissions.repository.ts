import { prisma } from "@/lib/db";
import type { Submission } from "@prisma/client";

export type SubmissionCreateData = {
  widgetId: string;
  payload: string;
  enrichment: string;
  spamScore: number;
  verdict: string;
  origin?: string | null;
  ip?: string | null;
};

export const submissionsRepository = {
  async create(data: SubmissionCreateData): Promise<Submission> {
    return prisma.submission.create({ data });
  },

  async listForTenantWidget(
    tenantId: string,
    widgetId?: string
  ): Promise<Submission[]> {
    return prisma.submission.findMany({
      where: {
        widget: { tenantId },
        ...(widgetId ? { widgetId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { widget: { select: { id: true, name: true, type: true } } },
    });
  },

  async statsForTenant(tenantId: string) {
    const submissions = await prisma.submission.findMany({
      where: { widget: { tenantId } },
      select: {
        verdict: true,
        spamScore: true,
        enrichment: true,
        createdAt: true,
        widgetId: true,
      },
    });
    return submissions;
  },
};
