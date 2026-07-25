"use client";

import {
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Zap,
  Mail,
  Gauge,
  MapPin,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/BrandMark";
import { useLenis } from "@/hooks/useLenis";

const EASE = [0.22, 1, 0.36, 1] as const;

const PIPELINE =
  "M0,28 L80,28 L92,28 L100,8 L108,48 L116,28 L200,28 L212,28 L220,10 L228,46 L236,28 L340,28 L352,28 L360,12 L368,44 L376,28 L500,28 L512,28 L520,9 L528,47 L536,28 L720,28 L732,28 L740,11 L748,45 L756,28 L900,28";

function shiftPath(d: string, dx: number): string {
  return d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) =>
    `${parseFloat(x) + dx},${y}`
  );
}

const TRACE_D =
  PIPELINE +
  " " +
  shiftPath(PIPELINE, 900).replace("M900,28", "L900,28");

function SignalTrace() {
  const shouldReduce = useReducedMotion();
  return (
    <div className="signal-trace w-full overflow-hidden" aria-hidden="true">
      <svg
        className={shouldReduce ? "signal-trace-track is-static" : "signal-trace-track"}
        viewBox="0 0 1800 56"
        preserveAspectRatio="none"
      >
        <path
          d={TRACE_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-signal opacity-35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={TRACE_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          pathLength="100"
          className="signal-trace-highlight text-signal"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function HeroBackdrop() {
  const shouldReduce = useReducedMotion();
  return (
    <div className="cp-hero-backdrop" aria-hidden="true">
      <motion.div
        className="cp-hero-backdrop-art"
        initial={shouldReduce ? false : { opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {/* Dual L/R side art: keep center clear for headline */}
        <div className="cp-hero-sides">
          <div className="cp-hero-side cp-hero-side--left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/checkpoint-hero-light.png"
              alt=""
              className="cp-hero-side-image"
            />
          </div>
          <div className="cp-hero-side cp-hero-side--right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/checkpoint-hero-light.png"
              alt=""
              className="cp-hero-side-image"
            />
          </div>
        </div>
        {/* Full-bleed soft fill behind sides (CheckMyDevice dual-mask pattern) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/checkpoint-hero-light.png"
          alt=""
          className="cp-hero-backdrop-image"
        />
      </motion.div>
      <div className="cp-hero-backdrop-wash" />
    </div>
  );
}

function AnimatedHeadline() {
  const shouldReduce = useReducedMotion();
  const line = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 28, filter: "blur(12px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      };

  return (
    <h1 className="font-display font-bold tracking-tight leading-[1.05] text-ink text-balance mb-6">
      <motion.span
        className="block text-[2.35rem] sm:text-5xl md:text-[3.6rem]"
        {...line}
        transition={{ delay: 0.12, duration: 0.7, ease: EASE }}
      >
        Embed once.
      </motion.span>
      <motion.span
        className="block text-[2.35rem] sm:text-5xl md:text-[3.6rem] hero-gradient-text"
        {...line}
        transition={{ delay: 0.28, duration: 0.75, ease: EASE }}
      >
        Capture leads safely.
      </motion.span>
    </h1>
  );
}

const TYPEWRITER =
  "One script. Popover, signup, or CTA. Validated, rate-limited, geo-enriched, and filed to your dashboard - without trusting the open internet blindly.";

function PitchTypewriter() {
  const shouldReduce = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    "typing"
  );

  useEffect(() => {
    if (shouldReduce) {
      setTyped(TYPEWRITER);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (typed.length < TYPEWRITER.length) {
        t = setTimeout(
          () => setTyped(TYPEWRITER.slice(0, typed.length + 1)),
          18
        );
      } else {
        t = setTimeout(() => setPhase("holding"), 2400);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("deleting"), 900);
    } else if (typed.length > 0) {
      t = setTimeout(() => setTyped(typed.slice(0, -1)), 8);
    } else {
      t = setTimeout(() => setPhase("typing"), 500);
    }
    return () => clearTimeout(t);
  }, [shouldReduce, typed, phase]);

  return (
    <div
      className="max-w-2xl mx-auto mb-10 text-left surface !shadow-none border-signal/15 bg-white/70 backdrop-blur-sm px-4 py-3.5"
      aria-label={TYPEWRITER}
    >
      <div className="flex items-center gap-2 mb-2" aria-hidden="true">
        <span className="signal-status-dot" />
        <span className="font-mono text-[9px] tracking-[0.18em] text-signal uppercase">
          Live intake message
        </span>
      </div>
      <p
        className="font-mono text-[0.78rem] md:text-[0.86rem] text-muted leading-relaxed min-h-[4.6em] md:min-h-[3.1em]"
        aria-hidden="true"
      >
        <span className="text-signal mr-2">&gt;</span>
        {typed}
        <span className="typing-cursor" />
      </p>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  id,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
  icon: LucideIcon;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className="max-w-2xl mx-auto text-center mb-10 md:mb-12"
      initial={
        shouldReduce ? false : { opacity: 0, y: 28, filter: "blur(8px)" }
      }
      whileInView={
        shouldReduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      <div className="section-intro-badge">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
        <span>{eyebrow}</span>
      </div>
      <h2
        id={id}
        className="font-display text-3xl md:text-[2.55rem] font-bold tracking-tight leading-[1.12] mb-4"
      >
        {title}
      </h2>
      <p className="text-[0.95rem] text-muted leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ScrollChapter({
  children,
  className = "",
  labelledBy,
  label,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  label?: string;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      className={`landing-chapter ${className}`}
      aria-labelledby={labelledBy}
      aria-label={label}
      initial={shouldReduce ? false : { opacity: 0, y: 48 }}
      whileInView={shouldReduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

const features = [
  {
    id: "embed",
    num: "01",
    label: "EMBED",
    title: "One-line script",
    desc: "Drop a single tag on any origin. Config loads cached and CORS-open like a CDN asset.",
    icon: Code2,
  },
  {
    id: "widgets",
    num: "02",
    label: "WIDGETS",
    title: "Popover · Signup · CTA",
    desc: "Three widget types, one pipeline. Customize copy and fields without shipping a new build.",
    icon: Layers3,
  },
  {
    id: "cors",
    num: "03",
    label: "CORS",
    title: "Origin-aware writes",
    desc: "Submissions echo allowlisted origins only - never a wildcard on the write path.",
    icon: Globe2,
  },
  {
    id: "rate",
    num: "04",
    label: "RATE LIMIT",
    title: "Token-bucket guard",
    desc: "Per IP + widgetId. Floods get 429 + Retry-After without taking the process down.",
    icon: Gauge,
  },
  {
    id: "spam",
    num: "05",
    label: "SPAM",
    title: "Honeytrap lane",
    desc: "Bots that autofill every field trip a silent trap and land as FLAGGED - not 500.",
    icon: ShieldCheck,
  },
  {
    id: "geo",
    num: "06",
    label: "GEO",
    title: "Fallback enrichment",
    desc: "Provider A → B → unenriched. Location never fails the submission itself.",
    icon: MapPin,
  },
];

const trust = [
  {
    label: "TENANT SCOPE",
    value: "ISOLATED",
    icon: Lock,
    description: "Every admin query is scoped from the session key - never a client-supplied tenant id.",
  },
  {
    label: "VALIDATION",
    value: "ZOD BOUNDARY",
    icon: ShieldCheck,
    description: "Malformed and oversized payloads get honest 4xx before business logic runs.",
  },
  {
    label: "SIDE EFFECTS",
    value: "SAFE WRAP",
    icon: Mail,
    description: "Email/webhook failures are logged and swallowed - submissions still return 201.",
  },
  {
    label: "TIME TO EMBED",
    value: "< 1 MIN",
    icon: Zap,
    description: "Copy the snippet, paste it on a foreign origin, watch leads appear in the dashboard.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create a widget",
    body: "Pick popover, signup, or CTA. Set fields and copy from the dashboard.",
  },
  {
    n: "02",
    title: "Paste the snippet",
    body: "One script tag on any site. Config fetches cross-origin with cache headers.",
  },
  {
    n: "03",
    title: "Inspect the ledger",
    body: "Submissions arrive validated, stamped, geo-marked, and ready to act on.",
  },
];

export default function LandingPage() {
  const shouldReduce = useReducedMotion();
  const lenisRef = useLenis();

  const fadeUp = (delay: number) =>
    shouldReduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: EASE },
        };

  const handleBrandClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.2 });
      return;
    }
    window.scrollTo({ top: 0, behavior: shouldReduce ? "auto" : "smooth" });
  };

  return (
    <div
      id="landing-top"
      className="min-h-[100dvh] flex flex-col bg-canvas text-ink selection:bg-signal/15 selection:text-signal"
    >
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <BrandLockup href="#landing-top" onClick={handleBrandClick} />
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary !py-2 !px-3.5 !text-sm !rounded-xl"
            >
              Open dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="cp-hero-chapter relative overflow-hidden min-h-[calc(100dvh-56px)] flex flex-col"
          aria-label="Checkpoint introduction"
        >
          <HeroBackdrop />
          <div className="hero-orb hero-orb-a" aria-hidden="true" />
          <div className="hero-orb hero-orb-b" aria-hidden="true" />

          <div className="relative z-10 flex-1 flex flex-col justify-center container mx-auto max-w-4xl px-5 sm:px-6 text-center pt-16 pb-10 cp-hero-content">
            <motion.div
              {...fadeUp(0.05)}
              className="inline-flex items-center gap-2 self-center mb-6 rounded-full border border-signal/20 bg-signal-fog/80 px-3 py-1.5 backdrop-blur-sm"
            >
              <BrandMark size={16} />
              <span className="font-mono text-[10px] tracking-[0.16em] text-signal uppercase">
                Embeddable lead capture
              </span>
            </motion.div>

            <AnimatedHeadline />
            <PitchTypewriter />

            <motion.div
              {...fadeUp(0.85)}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
            >
              <Link
                href="/login"
                className="btn-primary gap-2 px-7 h-11 text-sm w-full sm:w-auto"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 h-11 text-sm font-semibold rounded-xl border-2 border-line bg-surface/90 text-ink hover:border-signal/35 hover:bg-signal-fog transition-colors w-full sm:w-auto backdrop-blur-sm"
              >
                View dashboard
              </Link>
            </motion.div>

            <motion.p
              {...fadeUp(1)}
              className="text-xs text-muted font-mono tracking-wide"
            >
              Demo key · tenant_a_key_demo_001
            </motion.p>
          </div>

          <div className="relative z-10 hero-trace-wrap mt-auto">
            <SignalTrace />
          </div>
        </section>

        {/* How it works */}
        <ScrollChapter className="py-16 md:py-20" labelledBy="how-heading">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <SectionIntro
              eyebrow="How it works"
              title="Three steps from snippet to ledger."
              description="Built for marketers who need a widget today and engineers who refuse to ship an unhardened public endpoint."
              id="how-heading"
              icon={Sparkles}
            />
            <div className="grid md:grid-cols-3 gap-4">
              {steps.map((step, i) => (
                <motion.article
                  key={step.n}
                  tabIndex={0}
                  className="surface p-6 group outline-none cursor-default transition-all duration-200 hover:-translate-y-1 hover:border-signal/40 hover:shadow-soft focus-visible:-translate-y-1 focus-visible:border-signal/40 focus-visible:shadow-soft focus-visible:ring-2 focus-visible:ring-signal/30"
                  initial={
                    shouldReduce
                      ? {}
                      : { opacity: 0, y: 40, filter: "blur(6px)" }
                  }
                  whileInView={
                    shouldReduce
                      ? {}
                      : { opacity: 1, y: 0, filter: "blur(0px)" }
                  }
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
                >
                  <p className="font-mono text-[10px] tracking-[0.18em] text-signal mb-3">
                    STEP {step.n}
                  </p>
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-signal group-focus-visible:text-signal transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {step.body}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </ScrollChapter>

        {/* Features */}
        <ScrollChapter
          className="py-16 md:py-20 bg-surface/50 border-y border-line"
          labelledBy="features-heading"
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <SectionIntro
              eyebrow="Hardened by default"
              title="Six checks between the open web and your ledger."
              description="Every public write is inspected before it lands. The point of Checkpoint is the boundary - not a pretty form alone."
              id="features-heading"
              icon={ShieldCheck}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.id}
                    tabIndex={0}
                    className="group relative p-5 rounded-2xl border border-line bg-surface overflow-hidden flex flex-col gap-4 outline-none cursor-default transition-all duration-200 hover:border-signal/45 hover:shadow-soft focus-visible:border-signal/45 focus-visible:shadow-soft focus-visible:ring-2 focus-visible:ring-signal/30"
                    initial={
                      shouldReduce
                        ? {}
                        : { opacity: 0, y: 48, filter: "blur(6px)" }
                    }
                    whileInView={
                      shouldReduce
                        ? {}
                        : { opacity: 1, y: 0, filter: "blur(0px)" }
                    }
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{
                      delay: (i % 3) * 0.1,
                      duration: 0.55,
                      ease: EASE,
                    }}
                    onMouseEnter={(e) => {
                      if (!shouldReduce)
                        e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onFocus={(e) => {
                      if (!shouldReduce)
                        e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="block w-1.5 h-1.5 rounded-full bg-muted/40" />
                        <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
                          {f.num} {f.label}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-signal-fog text-signal group-hover:bg-signal group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-[0.98rem] mb-1.5 group-hover:text-signal transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-[0.82rem] text-muted leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ScrollChapter>

        {/* Trust strip */}
        <ScrollChapter className="py-16 md:py-20" labelledBy="trust-heading">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <SectionIntro
              eyebrow="Built to ship"
              title="Promises you can verify."
              description="The same patterns you’d demand in a multi-tenant SaaS - tenant isolation, boundary validation, and side effects that can’t sink the primary write."
              id="trust-heading"
              icon={Lock}
            />
            <div className="surface overflow-hidden !p-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <span className="signal-status-dot" />
                  <span className="font-mono text-[10px] tracking-[0.17em] text-signal uppercase">
                    Active platform guarantees
                  </span>
                </div>
                <span className="font-mono text-[9px] tracking-[0.15em] text-muted uppercase">
                  4 checks / 0 shortcuts
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {trust.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.article
                      key={item.label}
                      tabIndex={0}
                      className="cp-trust-item group relative p-6 border-line sm:border-r last:border-r-0 lg:[&:nth-child(2)]:border-r border-b lg:border-b-0 last:border-b-0 outline-none cursor-default"
                      initial={shouldReduce ? {} : { opacity: 0, y: 28 }}
                      whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
                      whileHover={
                        shouldReduce
                          ? {}
                          : { backgroundColor: "rgba(15, 118, 110, 0.045)" }
                      }
                      whileFocus={
                        shouldReduce
                          ? {}
                          : { backgroundColor: "rgba(15, 118, 110, 0.045)" }
                      }
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        delay: index * 0.08,
                        duration: 0.5,
                        ease: EASE,
                      }}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <Icon
                          className="w-5 h-5 text-muted group-hover:text-signal group-focus-visible:text-signal group-hover:-translate-y-0.5 transition-all"
                          strokeWidth={1.6}
                        />
                        <span className="font-mono text-[9px] tracking-[0.14em] text-ok uppercase">
                          Pass 0{index + 1}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] tracking-[0.16em] text-muted uppercase mb-2">
                        {item.label}
                      </p>
                      <p className="font-display text-lg font-bold mb-2 group-hover:text-signal group-focus-visible:text-signal transition-colors">
                        {item.value}
                      </p>
                      <p className="text-[0.76rem] leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollChapter>

        {/* Final CTA */}
        <ScrollChapter className="py-16 md:py-24" labelledBy="cta-heading">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
            <motion.div
              initial={
                shouldReduce
                  ? {}
                  : { opacity: 0, y: 30, filter: "blur(8px)" }
              }
              whileInView={
                shouldReduce
                  ? {}
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.65, ease: EASE }}
              className="surface p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute inset-0 hero-mesh opacity-60 pointer-events-none" />
              <div className="relative">
                <BrandMark size={40} className="mx-auto mb-5" />
                <h2
                  id="cta-heading"
                  className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3"
                >
                  Ready to file your first lead?
                </h2>
                <p className="text-muted mb-8 max-w-md mx-auto">
                  Sign in with the demo key, copy an embed snippet, and open the
                  fixture site on port 5555 - the full cross-origin proof.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/login" className="btn-primary gap-2 px-7 h-11">
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-7 h-11 text-sm font-semibold rounded-xl border border-line bg-surface hover:border-signal/40 transition-colors"
                  >
                    Open dashboard
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </ScrollChapter>
      </main>

      <footer className="border-t border-line py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="#landing-top"
            onClick={handleBrandClick}
            className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
            aria-label="Scroll to top"
          >
            <BrandMark size={20} />
            <span className="font-display text-sm font-semibold">
              Checkpoint
            </span>
          </a>
          <p className="text-xs text-muted text-center sm:text-right">
            Embeddable widgets · hardened public intake · tenant-isolated
            dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}
