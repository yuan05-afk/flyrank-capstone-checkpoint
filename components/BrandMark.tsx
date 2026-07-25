import Link from "next/link";
import type { MouseEventHandler } from "react";

/**
 * Checkpoint brand mark: a lead signal crossing a validated boundary.
 * Uses one bold metaphor plus a live status light so it stays clear at 16px.
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
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#0F1118" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="13.25"
        fill="none"
        stroke="#252A35"
        strokeWidth="1.5"
      />
      {/* Incoming and accepted lead signal */}
      <path
        d="M10 32H25M39 32H54"
        stroke="#16A9AB"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Scanner posts form the checkpoint boundary */}
      <path
        d="M25 18V46M39 18V46"
        stroke="#DCE6E8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Validated payload */}
      <path
        d="m28 32 3 3 6-7"
        stroke="#2FA84F"
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Live platform status */}
      <circle cx="50" cy="14" r="5.25" fill="#0F1118" />
      <circle cx="50" cy="14" r="3.75" fill="#2FA84F" />
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
