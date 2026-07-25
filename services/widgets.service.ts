import {
  createWidgetSchema,
  updateWidgetSchema,
} from "@/lib/validation";
import { widgetsRepository } from "@/repositories/widgets.repository";
import type { Widget } from "@prisma/client";
import { z } from "zod";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export function buildEmbedSnippet(widgetId: string): string {
  return `<script src="${appUrl()}/widget.js" data-widget-id="${widgetId}" async></script>`;
}

function serializeWidget(widget: Widget) {
  return {
    id: widget.id,
    type: widget.type,
    name: widget.name,
    copy: JSON.parse(widget.copy),
    fields: JSON.parse(widget.fields),
    targeting: JSON.parse(widget.targeting),
    active: widget.active,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
    embedSnippet: buildEmbedSnippet(widget.id),
  };
}

export const widgetsService = {
  async create(tenantId: string, input: unknown) {
    const data = createWidgetSchema.parse(input);
    const widget = await widgetsRepository.create({
      tenantId,
      type: data.type,
      name: data.name,
      copy: JSON.stringify(data.copy),
      fields: JSON.stringify(data.fields),
      targeting: JSON.stringify(data.targeting),
      active: data.active ?? true,
    });
    return serializeWidget(widget);
  },

  async list(tenantId: string) {
    const rows = await widgetsRepository.listByTenant(tenantId);
    return rows.map(serializeWidget);
  },

  async get(tenantId: string, id: string) {
    const widget = await widgetsRepository.findByIdForTenant(id, tenantId);
    if (!widget) return null;
    return serializeWidget(widget);
  },

  async update(tenantId: string, id: string, input: unknown) {
    const data = updateWidgetSchema.parse(input);
    const patch: Record<string, unknown> = {};
    if (data.type !== undefined) patch.type = data.type;
    if (data.name !== undefined) patch.name = data.name;
    if (data.copy !== undefined) patch.copy = JSON.stringify(data.copy);
    if (data.fields !== undefined) patch.fields = JSON.stringify(data.fields);
    if (data.targeting !== undefined)
      patch.targeting = JSON.stringify(data.targeting);
    if (data.active !== undefined) patch.active = data.active;

    const widget = await widgetsRepository.updateForTenant(
      id,
      tenantId,
      patch as Parameters<typeof widgetsRepository.updateForTenant>[2]
    );
    if (!widget) return null;
    return serializeWidget(widget);
  },

  async remove(tenantId: string, id: string) {
    return widgetsRepository.deleteForTenant(id, tenantId);
  },

  async publicConfig(id: string) {
    const widget = await widgetsRepository.findByIdPublic(id);
    if (!widget) return null;
    return {
      id: widget.id,
      type: widget.type,
      copy: JSON.parse(widget.copy) as Record<string, unknown>,
      fields: JSON.parse(widget.fields) as unknown[],
      targeting: JSON.parse(widget.targeting) as Record<string, unknown>,
      updatedAt: widget.updatedAt.toISOString(),
    };
  },
};

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
