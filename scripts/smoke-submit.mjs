const WID = "cms06qmo90003so5akiizgim8";
const base = "http://localhost:3000";

async function main() {
  const submit = await fetch(`${base}/api/submissions`, {
    method: "POST",
    headers: {
      Origin: "http://localhost:5555",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      widgetId: WID,
      payload: { email: "lead@ex.com", name: "Ada" },
      _hp: "",
    }),
  });
  console.log("SUBMIT", submit.status, await submit.json());

  const codes = [];
  for (let i = 0; i < 15; i++) {
    const r = await fetch(`${base}/api/submissions`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:5555",
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.77",
      },
      body: JSON.stringify({
        widgetId: WID,
        payload: { email: `u${i}@ex.com` },
        _hp: "",
      }),
    });
    codes.push(r.status);
  }
  console.log("FLOOD", codes.join(" "));
  console.log("got429", codes.includes(429));

  const stats = await fetch(`${base}/api/dashboard/stats`, {
    headers: { Authorization: "Bearer tenant_a_key_demo_001" },
  });
  console.log("STATS", await stats.json());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
