/**
 * Widget DOM renderer - TypeScript mirror of the logic in public/widget.js.
 * Kept here so the render contract is reviewable without opening the IIFE.
 */

export type WidgetConfig = {
  id: string;
  type: "popover" | "signup" | "cta" | string;
  copy: {
    headline?: string;
    body?: string;
    buttonLabel?: string;
    successMessage?: string;
  };
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    required?: boolean;
  }>;
};

export function buildWidgetMarkup(config: WidgetConfig): string {
  const headline = escapeHtml(config.copy.headline ?? "Stay in the loop");
  const body = escapeHtml(config.copy.body ?? "");
  const btn = escapeHtml(config.copy.buttonLabel ?? "Submit");
  const fields = (config.fields ?? [])
    .map((f) => {
      const input =
        f.type === "textarea"
          ? `<textarea name="${escapeAttr(f.name)}" ${f.required ? "required" : ""} rows="3"></textarea>`
          : `<input name="${escapeAttr(f.name)}" type="${escapeAttr(f.type ?? "text")}" ${f.required ? "required" : ""} />`;
      return `<label class="wp-field"><span>${escapeHtml(f.label)}</span>${input}</label>`;
    })
    .join("");

  return `
    <div class="wp-shell" data-wp-type="${escapeAttr(config.type)}">
      <div class="wp-ticket">
        <div class="wp-brand">Checkpoint</div>
        <h2 class="wp-headline">${headline}</h2>
        <p class="wp-body">${body}</p>
        <form class="wp-form" novalidate>
          ${fields}
          <input type="text" name="_hp" value="" tabindex="-1" autocomplete="off" class="wp-hp" aria-hidden="true" />
          <button type="submit" class="wp-submit">${btn}</button>
        </form>
        <div class="wp-status" hidden></div>
      </div>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
