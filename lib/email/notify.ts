/**
 * Safe, non-throwing side-effect wrapper for submission notifications.
 * A failure here must NEVER throw past the submission handler.
 */

export type NotifyInput = {
  widgetId: string;
  submissionId: string;
  verdict: string;
  payload: Record<string, unknown>;
  to?: string;
};

async function sendViaResend(input: NotifyInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "inspect@widget-platform.local";
  const to = input.to ?? process.env.NOTIFY_TO ?? "owner@example.com";

  if (!apiKey) {
    console.info(
      `[notify:stub] submission=${input.submissionId} widget=${input.widgetId} verdict=${input.verdict} to=${to}`,
      JSON.stringify(input.payload).slice(0, 200)
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[Checkpoint] ${input.verdict} - widget ${input.widgetId}`,
      text: `Submission ${input.submissionId}\nVerdict: ${input.verdict}\n\n${JSON.stringify(input.payload, null, 2)}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

/** Fire-and-forget: catches, logs, never rethrows. */
export async function notifySubmission(input: NotifyInput): Promise<void> {
  try {
    await sendViaResend(input);
  } catch (err) {
    console.error(
      `[notify] failed (swallowed) submission=${input.submissionId}:`,
      (err as Error).message
    );
  }
}
