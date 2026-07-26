"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Flag,
  Inbox,
  MapPin,
  Plus,
  Code2,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { MAX_WIDGETS_PER_TENANT } from "@/config/demo.config";

const EASE = [0.22, 1, 0.36, 1] as const;

type Widget = {
  id: string;
  type: string;
  name: string;
  embedSnippet: string;
  copy: Record<string, unknown>;
  active: boolean;
};

type Submission = {
  id: string;
  widgetId: string;
  verdict: string;
  spamScore: number;
  payload: Record<string, unknown>;
  enrichment: {
    enriched?: boolean;
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
    provider?: string;
  };
  createdAt: string;
  origin?: string | null;
};

type Stats = {
  total: number;
  accepted: number;
  flagged: number;
  countsOverTime: Array<{ date: string; count: number }>;
  topLocations: Array<{ label: string; count: number }>;
};

function StatusBadge({ verdict }: { verdict: string }) {
  const v = verdict.toUpperCase();
  const cls =
    v === "ACCEPTED"
      ? "badge-ok"
      : v === "FLAGGED"
        ? "badge-warn"
        : "badge-danger";
  return (
    <motion.span
      className={`badge ${cls}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {verdict.replace(/_/g, " ")}
    </motion.span>
  );
}

function AnimatedCount({ value }: { value: number }) {
  const shouldReduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 18,
    mass: 0.6,
  });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const [text, setText] = useState(() => value.toLocaleString());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || shouldReduce) {
      setText(value.toLocaleString());
      motionValue.set(value);
      return;
    }
    motionValue.set(0);
    const unsub = display.on("change", (v) => setText(v));
    const id = requestAnimationFrame(() => motionValue.set(value));
    return () => {
      unsub();
      cancelAnimationFrame(id);
    };
  }, [value, shouldReduce, motionValue, display, ready]);

  return <span suppressHydrationWarning>{text}</span>;
}

const LANDMASSES = [
  "M12,25 24,19 50,20 85,16 102,28 124,36 120,45 106,50 100,65 88,61 83,70 92,69 97,81 101,81 94,78 75,70 66,60 58,53 56,42 50,36 28,31 Z",
  "M105,79 118,80 128,85 145,96 141,103 137,113 132,118 124,125 118,130 112,140 111,145 107,135 109,120 103,102 99,92 Z",
  "M163,69 174,54 190,53 205,58 213,59 223,78 231,78 223,88 220,93 220,100 215,110 212,119 198,125 192,108 192,98 189,90 185,85 180,85 169,85 163,75 Z",
  "M171,51 172,47 178,43 184,38 188,34 185,30 198,21 213,20 240,20 280,14 320,18 350,24 342,33 315,45 307,53 301,59 290,69 287,80 283,89 277,74 268,69 258,82 252,69 247,65 238,67 232,75 225,77 218,68 215,58 211,54 203,52 195,50 189,46 174,54 Z",
  "M310,102 323,101 333,115 331,124 325,128 318,125 309,122 295,124 294,112 302,107 Z",
  "M135,30 125,22 120,14 135,7 155,12 158,20 138,29 Z",
  "M176,32 180,37 175,40 174,35 Z",
  "M321,46 325,52 318,58 313,57 319,50 Z",
  "M227,105 230,112 225,115 224,107 Z",
  "M275,85 285,96 283,96 277,88 Z",
  "M289,88 297,86 297,94 290,93 Z",
  "M311,91 330,98 326,99 311,94 Z",
  "M353,125 358,129 352,135 347,136 351,131 Z",
];

function WorldOutline({
  points,
}: {
  points: Array<{ lat: number; lon: number; label: string; count: number }>;
}) {
  return (
    <svg
      viewBox="0 0 360 180"
      className="w-full max-h-40"
      role="img"
      aria-label="World map of submission origins"
    >
      <defs>
        <linearGradient id="mapWash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8F5F3" />
          <stop offset="100%" stopColor="#F8FBFD" />
        </linearGradient>
      </defs>
      <rect width="360" height="180" rx="14" fill="url(#mapWash)" stroke="#E2E8F2" />
      <g stroke="#E2E8F2" strokeWidth="0.75">
        <line x1="0" y1="90" x2="360" y2="90" />
        <line x1="90" y1="0" x2="90" y2="180" />
        <line x1="180" y1="0" x2="180" y2="180" />
        <line x1="270" y1="0" x2="270" y2="180" />
      </g>
      {LANDMASSES.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="#D7E4EF"
          stroke="#B9C9D9"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      ))}
      {points.map((p, i) => {
        const x = p.lon + 180;
        const y = 90 - p.lat;
        const label = `${p.label} (${p.count})`;
        return (
          <g key={`${p.lat}-${p.lon}-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={3}
              fill="none"
              stroke="#14B8A6"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <animate
                attributeName="r"
                values="3;11"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={x}
              cy={y}
              r={3.4}
              fill="#0F766E"
              aria-label={label}
            />
          </g>
        );
      })}
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function DashboardClient({
  widgets,
  submissions,
  stats,
}: {
  widgets: Widget[];
  submissions: Submission[];
  stats: Stats;
}) {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewWidget, setPreviewWidget] = useState<Widget | null>(null);
  const [previewStatus, setPreviewStatus] = useState<
    "loading" | "ready" | "submitted" | "error" | null
  >(null);
  const atWidgetLimit = widgets.length >= MAX_WIDGETS_PER_TENANT;

  useEffect(() => {
    if (!previewWidget) return;

    const removePreview = () => {
      document
        .querySelectorAll(
          '[data-checkpoint-preview-script="true"], .wp-root, .wp-debug'
        )
        .forEach((node) => node.remove());
    };

    const matchesPreview = (event: Event) =>
      (event as CustomEvent<{ widgetId?: string }>).detail?.widgetId ===
      previewWidget.id;

    const handleReady = (event: Event) => {
      if (matchesPreview(event)) setPreviewStatus("ready");
    };
    const handleError = (event: Event) => {
      if (matchesPreview(event)) setPreviewStatus("error");
    };
    const handleSubmitted = (event: Event) => {
      if (!matchesPreview(event)) return;
      setPreviewStatus("submitted");
      // Refresh the server snapshot so stats, geo, and the ledger all reflect
      // the exact submission that just crossed the public boundary.
      router.refresh();
    };

    window.addEventListener("checkpoint:ready", handleReady);
    window.addEventListener("checkpoint:error", handleError);
    window.addEventListener("checkpoint:submitted", handleSubmitted);

    removePreview();
    setPreviewStatus("loading");
    const script = document.createElement("script");
    script.src = new URL("/widget.js", window.location.origin).toString();
    script.async = true;
    script.dataset.widgetId = previewWidget.id;
    script.dataset.debug = "true";
    script.dataset.checkpointPreviewScript = "true";
    script.onerror = () => setPreviewStatus("error");
    document.body.appendChild(script);

    return () => {
      window.removeEventListener("checkpoint:ready", handleReady);
      window.removeEventListener("checkpoint:error", handleError);
      window.removeEventListener("checkpoint:submitted", handleSubmitted);
      removePreview();
    };
  }, [previewWidget, router]);

  const geoPoints = useMemo(() => {
    const byPlace = new Map<
      string,
      { lat: number; lon: number; label: string; count: number }
    >();
    for (const s of submissions) {
      if (
        s.enrichment?.enriched &&
        typeof s.enrichment.lat === "number" &&
        typeof s.enrichment.lon === "number"
      ) {
        const lat = s.enrichment.lat;
        const lon = s.enrichment.lon;
        const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
        const existing = byPlace.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          byPlace.set(key, {
            lat,
            lon,
            label:
              [s.enrichment.city, s.enrichment.country]
                .filter(Boolean)
                .join(", ") || key,
            count: 1,
          });
        }
      }
    }
    return Array.from(byPlace.values()).slice(0, 25);
  }, [submissions]);

  const geoPulse = useMemo(() => {
    const total = submissions.length;
    let enriched = 0;
    const providers = new Map<string, number>();
    let lastLabel = "-";
    let lastAt = "";

    for (const s of submissions) {
      if (s.enrichment?.enriched) {
        enriched += 1;
        const provider = s.enrichment.provider || "unknown";
        providers.set(provider, (providers.get(provider) || 0) + 1);
        if (!lastAt) {
          lastLabel =
            [s.enrichment.city, s.enrichment.country]
              .filter(Boolean)
              .join(", ") || "-";
          lastAt = s.createdAt;
        }
      }
    }

    const topProvider = Array.from(providers.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const locationTotal = stats.topLocations.reduce((sum, l) => sum + l.count, 0);

    return {
      enriched,
      total,
      coverage: total ? Math.round((enriched / total) * 100) : 0,
      places: stats.topLocations.length,
      unenriched: Math.max(0, total - enriched),
      providerLabel: topProvider
        ? topProvider[0].startsWith("provider-")
          ? `Provider ${topProvider[0].slice("provider-".length).toUpperCase()}`
          : topProvider[0]
        : "Idle",
      providerShare: topProvider && enriched
        ? Math.round((topProvider[1] / enriched) * 100)
        : 0,
      lastLabel,
      lastAt,
      locationTotal: locationTotal || enriched,
    };
  }, [submissions, stats.topLocations]);

  async function copySnippet(id: string, snippet: string) {
    await navigator.clipboard.writeText(snippet);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function openPreview(widget: Widget) {
    setPreviewWidget((current) =>
      current?.id === widget.id ? { ...widget } : widget
    );
  }

  async function createDemoWidget() {
    if (atWidgetLimit) {
      setNotice(
        `Demo workspaces are limited to ${MAX_WIDGETS_PER_TENANT} widgets. Delete one to create another.`
      );
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      const response = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "popover",
          name: `Widget ${widgets.length + 1}`,
          copy: {
            headline: "Stay in the loop",
            body: "Leave your email and we will follow up.",
            buttonLabel: "Subscribe",
            successMessage: "You are in - thanks!",
          },
          fields: [
            { name: "email", label: "Email", type: "email", required: true },
          ],
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setNotice(payload?.error || "Could not create widget.");
        return;
      }
      window.location.reload();
    } finally {
      setCreating(false);
    }
  }

  async function deleteWidget(widget: Widget) {
    const confirmed = window.confirm(
      `Delete "${widget.name}"? Its submissions will be removed too.`
    );
    if (!confirmed) return;

    setDeletingId(widget.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/widgets/${widget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setNotice(payload?.error || "Could not delete widget.");
        return;
      }
      if (previewWidget?.id === widget.id) {
        setPreviewWidget(null);
        setPreviewStatus(null);
      }
      window.location.reload();
    } finally {
      setDeletingId(null);
    }
  }

  const statCards = [
    {
      label: "Total submissions",
      value: stats.total,
      icon: Inbox,
      tone: "text-signal",
      fog: "bg-signal-fog text-signal",
    },
    {
      label: "Accepted",
      value: stats.accepted,
      icon: CheckCircle2,
      tone: "text-ok",
      fog: "bg-emerald-50 text-ok",
    },
    {
      label: "Flagged",
      value: stats.flagged,
      icon: Flag,
      tone: "text-warn",
      fog: "bg-orange-50 text-warn",
    },
    {
      label: "Top location",
      value: null as number | null,
      display: stats.topLocations[0]?.label ?? "-",
      icon: MapPin,
      tone: "text-ink",
      fog: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-57px)] overflow-hidden">
      <div className="hero-mesh absolute inset-0 pointer-events-none opacity-80" />
      <div className="hero-orb hero-orb-a !opacity-25" aria-hidden="true" />
      <div className="hero-orb hero-orb-b !opacity-20" aria-hidden="true" />

      <div className="relative z-10 px-5 sm:px-6 py-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.section
          initial={shouldReduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2"
        >
          <div>
            <div className="section-intro-badge mb-3">
              <span className="signal-status-dot" />
              <span>Live workspace</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-muted text-sm md:text-[0.95rem] max-w-xl leading-relaxed">
              Watch leads land, copy embeds, and inspect geo-stamped submissions
              in one place.
            </p>
          </div>
          <motion.button
            whileHover={shouldReduce ? undefined : { y: -2, scale: 1.02 }}
            whileTap={shouldReduce ? undefined : { scale: 0.98 }}
            className="btn-primary !text-sm gap-2 self-start md:self-auto"
            onClick={createDemoWidget}
            disabled={creating || atWidgetLimit}
            title={
              atWidgetLimit
                ? `Demo limit is ${MAX_WIDGETS_PER_TENANT} widgets`
                : undefined
            }
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating…" : "New widget"}
          </motion.button>
        </motion.section>

        {notice && (
          <div className="rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-ink">
            {notice}
          </div>
        )}
        {/* Stats */}
        <motion.section
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: shouldReduce ? 0 : 0.08 },
            },
          }}
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={
                  shouldReduce
                    ? undefined
                    : {
                        hidden: fadeUp.hidden,
                        show: {
                          ...fadeUp.show,
                          transition: { duration: 0.5, ease: EASE },
                        },
                      }
                }
                whileHover={
                  shouldReduce ? undefined : { y: -4, transition: { duration: 0.2 } }
                }
                className="surface p-4 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono tracking-[0.12em] uppercase text-muted">
                    {card.label}
                  </span>
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-xl ${card.fog} transition-transform group-hover:scale-110`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                  </span>
                </div>
                {card.value === null ? (
                  <div className={`font-display text-lg font-bold ${card.tone}`}>
                    {card.display}
                  </div>
                ) : (
                  <div
                    className={`font-display text-3xl font-bold tracking-tight ${card.tone}`}
                  >
                    <AnimatedCount value={card.value} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.section>

        {/* Widgets */}
        <motion.section
          initial={shouldReduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-4 h-4 text-signal" />
                <h2 className="font-display text-xl font-semibold">Your widgets</h2>
              </div>
              <p className="text-xs text-muted">
                Test the real embed here, then copy the same snippet to any
                allowlisted customer origin. Demo limit: {widgets.length}/
                {MAX_WIDGETS_PER_TENANT}.
              </p>
            </div>
          </div>

          {previewWidget && (
            <motion.div
              initial={shouldReduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-col gap-3 rounded-2xl border border-signal/25 bg-signal-fog/70 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-signal">
                  Live embed test
                </p>
                <p className="mt-1 text-sm text-ink">
                  <b>{previewWidget.name}</b>{" "}
                  {previewStatus === "loading"
                    ? "is loading in the lower-right corner."
                    : previewStatus === "ready"
                      ? "is ready. Submit it to create a real ledger row."
                      : previewStatus === "submitted"
                        ? "was submitted. Stats and the ledger are refreshed."
                        : "could not mount. Check its active state and CORS configuration."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {previewStatus === "submitted" && (
                  <button
                    type="button"
                    className="btn-secondary !min-h-9 !px-3 !py-1.5 text-xs"
                    onClick={() =>
                      document
                        .getElementById("submissions")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    View new row
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary !min-h-9 !px-3 !py-1.5 text-xs"
                  onClick={() => {
                    setPreviewWidget(null);
                    setPreviewStatus(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Close test
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            className="space-y-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: shouldReduce ? 0 : 0.1 },
              },
            }}
          >
            {widgets.map((w) => (
              <motion.div
                key={w.id}
                variants={
                  shouldReduce
                    ? undefined
                    : {
                        hidden: fadeUp.hidden,
                        show: {
                          ...fadeUp.show,
                          transition: { duration: 0.5, ease: EASE },
                        },
                      }
                }
                whileHover={
                  shouldReduce
                    ? undefined
                    : { y: -3, transition: { duration: 0.2 } }
                }
                className="surface p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-display font-semibold text-lg">
                      {w.name}
                    </div>
                    <div className="text-xs text-muted mt-1 font-mono tracking-wide">
                      {w.type.toUpperCase()} · {w.id}
                    </div>
                  </div>
                  <span className="badge bg-signal-fog text-signal inline-flex items-center gap-1.5">
                    <span className="signal-status-dot !w-1.5 !h-1.5" />
                    Embed ready
                  </span>
                </div>
                <pre className="text-[12px] leading-relaxed bg-canvas border border-line rounded-xl p-3.5 overflow-x-auto signal-scroll whitespace-pre-wrap font-mono text-muted">
                  {w.embedSnippet}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <motion.button
                    whileHover={shouldReduce ? undefined : { y: -1 }}
                    whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                    className="btn-primary !text-sm gap-2"
                    onClick={() => openPreview(w)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {previewWidget?.id === w.id ? "Restart test" : "Test live"}
                  </motion.button>
                  <motion.button
                    whileHover={shouldReduce ? undefined : { y: -1 }}
                    whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                    className="btn-secondary !text-sm gap-2"
                    onClick={() => copySnippet(w.id, w.embedSnippet)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied === w.id ? "Copied" : "Copy snippet"}
                  </motion.button>
                  <motion.button
                    whileHover={shouldReduce ? undefined : { y: -1 }}
                    whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                    className="btn-secondary !text-sm gap-2 text-danger border-danger/20 hover:bg-danger/5"
                    onClick={() => deleteWidget(w)}
                    disabled={deletingId === w.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === w.id ? "Deleting…" : "Delete"}
                  </motion.button>
                </div>
              </motion.div>
            ))}
            {widgets.length === 0 && (
              <div className="surface p-8 text-center">
                <p className="text-sm text-muted mb-4">
                  No widgets yet - create your first embed.
                </p>
                <button
                  className="btn-primary !text-sm gap-2 mx-auto"
                  onClick={createDemoWidget}
                  disabled={creating || atWidgetLimit}
                >
                  <Plus className="w-4 h-4" />
                  New widget
                </button>
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* Locations + submissions */}
        <div className="grid lg:grid-cols-5 gap-4 lg:items-start">
          <motion.section
            className="surface p-5 lg:col-span-2 overflow-hidden flex flex-col"
            initial={shouldReduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-signal" />
                <h2 className="font-display text-lg font-semibold">Locations</h2>
              </div>
              <span className="font-mono text-[9px] tracking-[0.14em] text-signal uppercase">
                Live geo
              </span>
            </div>
            <WorldOutline points={geoPoints} />

            <div className="mt-3 flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                    Origin share
                  </p>
                  <p className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                    {geoPulse.places} place{geoPulse.places === 1 ? "" : "s"}
                  </p>
                </div>
                <ul className="space-y-2">
                  {stats.topLocations.map((l, i) => {
                    const share = geoPulse.locationTotal
                      ? Math.round((l.count / geoPulse.locationTotal) * 100)
                      : 0;
                    return (
                      <motion.li
                        key={l.label}
                        initial={shouldReduce ? false : { opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: i * 0.06,
                          duration: 0.4,
                          ease: EASE,
                        }}
                        className="border border-line rounded-xl px-3 py-2.5 bg-canvas/70"
                      >
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-muted truncate pr-2">
                            {l.label}
                          </span>
                          <span className="font-display font-semibold text-signal tabular-nums">
                            {l.count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-line/80 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-signal"
                              initial={
                                shouldReduce ? false : { width: 0 }
                              }
                              whileInView={
                                shouldReduce
                                  ? undefined
                                  : { width: `${Math.max(share, 6)}%` }
                              }
                              viewport={{ once: true }}
                              transition={{
                                delay: 0.15 + i * 0.05,
                                duration: 0.55,
                                ease: EASE,
                              }}
                              style={
                                shouldReduce
                                  ? { width: `${Math.max(share, 6)}%` }
                                  : undefined
                              }
                            />
                          </div>
                          <span className="font-mono text-[10px] text-muted w-8 text-right tabular-nums">
                            {share}%
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                  {stats.topLocations.length === 0 && (
                    <li className="text-sm text-muted border border-dashed border-line rounded-xl px-3 py-4 text-center">
                      No enriched locations yet. Submissions still land when
                      providers degrade.
                    </li>
                  )}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Coverage",
                    value: `${geoPulse.coverage}%`,
                    hint: `${geoPulse.enriched}/${geoPulse.total || 0}`,
                  },
                  {
                    label: "Places",
                    value: String(geoPulse.places),
                    hint: geoPulse.unenriched
                      ? `${geoPulse.unenriched} pending`
                      : "all stamped",
                  },
                  {
                    label: "Provider",
                    value: geoPulse.providerLabel,
                    hint: geoPulse.providerShare
                      ? `${geoPulse.providerShare}% of hits`
                      : "awaiting",
                  },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-xl border border-line bg-canvas/80 px-2.5 py-2.5"
                  >
                    <p className="font-mono text-[8px] tracking-[0.14em] text-muted uppercase mb-1">
                      {cell.label}
                    </p>
                    <p className="font-display text-sm font-semibold text-ink leading-tight truncate">
                      {cell.value}
                    </p>
                    <p className="font-mono text-[9px] text-muted mt-0.5 truncate">
                      {cell.hint}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-line/80 bg-signal-fog/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-mono text-[9px] tracking-[0.14em] text-signal uppercase">
                    Enrichment chain
                  </p>
                  <span className="signal-status-dot" aria-hidden="true" />
                </div>
                <p className="font-mono text-[10px] text-muted tracking-wide">
                  A {"->"} B {"->"} degrade
                </p>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  Last ping:{" "}
                  <span className="text-ink font-medium">
                    {geoPulse.lastLabel}
                  </span>
                  {geoPulse.lastAt
                    ? ` · ${geoPulse.lastAt.replace("T", " ").slice(11, 19)}`
                    : ""}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="submissions"
            className="lg:col-span-3"
            initial={shouldReduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Inbox className="w-4 h-4 text-signal" />
              <h2 className="font-display text-lg font-semibold">Submissions</h2>
            </div>
            <div className="surface overflow-x-auto signal-scroll !p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-mono tracking-[0.12em] uppercase text-muted border-b border-line bg-canvas/50">
                    <th className="p-3 w-10">#</th>
                    <th className="p-3 w-40">Time</th>
                    <th className="p-3">Widget</th>
                    <th className="p-3">Payload</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={
                        shouldReduce ? false : { opacity: 0, y: 8 }
                      }
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: Math.min(i, 12) * 0.035,
                        duration: 0.35,
                        ease: EASE,
                      }}
                      className="border-b border-line/80 align-top last:border-0 hover:bg-signal-fog/40 transition-colors"
                    >
                      <td className="p-3 text-muted font-mono text-xs">
                        {String(submissions.length - i).padStart(2, "0")}
                      </td>
                      <td className="p-3 whitespace-nowrap text-muted text-xs">
                        {s.createdAt.replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {s.widgetId.slice(0, 8)}…
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-muted">
                        {JSON.stringify(s.payload)}
                      </td>
                      <td className="p-3 text-xs">
                        {s.enrichment?.enriched
                          ? `${s.enrichment.city ?? "?"}, ${s.enrichment.country ?? "?"}`
                          : "-"}
                      </td>
                      <td className="p-3">
                        <StatusBadge verdict={s.verdict} />
                      </td>
                    </motion.tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-muted text-center">
                        No submissions yet - try fixtures/customer-site.html on
                        port 5555.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
