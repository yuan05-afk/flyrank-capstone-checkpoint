import Link from "next/link";
import type { MouseEventHandler } from "react";

/**
 * Checkpoint brand mark: embed brackets + check.
 * Reads as "embeddable" and "checkpoint" at favicon size.
 */
export function BrandMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#0F766E" />
      {/* Left embed bracket < */}
      <path
        d="M24 16 12 32l12 16"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right embed bracket > */}
      <path
        d="M40 16l12 16-12 16"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkpoint check */}
      <path
        d="M25 33.5 30.5 39 41 25"
        stroke="#14B8A6"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  size = 28,
  onClick,
}: {
  href?: string;
  size?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const className =
    "inline-flex items-center gap-2.5 transition-opacity hover:opacity-80";
  const contents = (
    <>
      <BrandMark size={size} />
      <span className="font-display font-semibold text-ink tracking-tight text-[1.05rem]">
        Checkpoint
      </span>
    </>
  );

  if (onClick) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={className}
        aria-label="Checkpoint"
      >
        {contents}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {contents}
    </Link>
  );
}
