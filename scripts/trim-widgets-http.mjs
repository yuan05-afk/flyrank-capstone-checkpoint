/**
 * Trim the live Checkpoint demo tenant to KEEP widgets via authenticated HTTP.
 * Uses session cookie + already-shipped DELETE /api/widgets/:id.
 *
 *   node scripts/trim-widgets-http.mjs
 */
const BASE = (
  process.env.CHECKPOINT_URL || "https://checkpoint-flyrank.vercel.app"
).replace(/\/$/, "");
const KEY = process.env.DEMO_API_KEY || "tenant_a_key_demo_001";
const KEEP = Number(process.env.KEEP_WIDGETS || 3);

function cookieFromResponse(response) {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  if (raw.length) return raw.map((part) => part.split(";")[0]).join("; ");
  const single = response.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey: KEY }),
  });
  if (!login.ok) throw new Error(`login failed ${login.status}: ${await login.text()}`);
  const cookie = cookieFromResponse(login);
  if (!cookie) throw new Error("login did not return a session cookie");

  const headers = { cookie };
  const list = await fetch(`${BASE}/api/widgets`, { headers });
  if (!list.ok) throw new Error(`list failed ${list.status}: ${await list.text()}`);
  const { widgets } = await list.json();
  const sorted = [...widgets].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  console.log(`found ${sorted.length} widgets; keeping ${KEEP}`);
  sorted.forEach((w, i) => console.log(`  ${i + 1}. ${w.name}`));

  if (sorted.length <= KEEP) {
    console.log("nothing to trim");
    return;
  }

  for (const widget of sorted.slice(KEEP)) {
    const res = await fetch(`${BASE}/api/widgets/${widget.id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      throw new Error(
        `delete failed for ${widget.name}: ${res.status} ${await res.text()}`
      );
    }
    console.log(`deleted ${widget.name}`);
  }

  const after = await fetch(`${BASE}/api/widgets`, { headers });
  const body = await after.json();
  console.log(
    `kept ${body.widgets.length}: ${body.widgets.map((w) => w.name).join(", ")}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
