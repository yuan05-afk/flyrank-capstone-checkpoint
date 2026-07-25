import { z } from "zod";

export const widgetTypeSchema = z.enum(["popover", "signup", "cta"]);

export const createWidgetSchema = z.object({
  type: widgetTypeSchema,
  name: z.string().min(1).max(120),
  copy: z
    .object({
      headline: z.string().max(200).optional(),
      body: z.string().max(2000).optional(),
      buttonLabel: z.string().max(80).optional(),
      successMessage: z.string().max(200).optional(),
    })
    .default({}),
  fields: z
    .array(
      z.object({
        name: z.string().min(1).max(64),
        label: z.string().min(1).max(120),
        type: z.enum(["text", "email", "textarea"]).default("text"),
        required: z.boolean().default(false),
      })
    )
    .max(20)
    .default([]),
  targeting: z
    .object({
      paths: z.array(z.string()).optional(),
      devices: z.array(z.enum(["desktop", "mobile"])).optional(),
    })
    .default({}),
  active: z.boolean().optional(),
});

export const updateWidgetSchema = createWidgetSchema.partial();

const MAX_PAYLOAD_BYTES = 8_192;

export const submissionBodySchema = z.object({
  widgetId: z.string().min(1).max(64),
  payload: z.record(z.unknown()),
  /** Honeytrap - scored in service; allow any string so bots get FLAGGED not 400 */
  _hp: z.string().max(500).optional(),
});

export function assertPayloadSize(raw: string): void {
  if (Buffer.byteLength(raw, "utf8") > MAX_PAYLOAD_BYTES) {
    const err = new Error("Payload too large");
    (err as Error & { status: number }).status = 413;
    throw err;
  }
}

export { MAX_PAYLOAD_BYTES };
