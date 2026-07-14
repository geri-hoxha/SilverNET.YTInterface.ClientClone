import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-red-500",
];

function hashIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

function initials(name: string, max = 3) {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, max)
      .map((p) => p[0]!.toUpperCase())
      .join("");
  }
  return cleaned.slice(0, max).toUpperCase();
}

interface EntityLogoProps {
  name: string;
  seed?: string;
  src?: string | null;
  shortCode?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Square logo tile used for organizations & projects (YouTrack-style).
 * Renders an image if provided, otherwise a colored tile with initials.
 */
export function EntityLogo({ name, seed, src, shortCode, size = "md", className }: EntityLogoProps) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  if (src) {
    return <img src={src} alt={name} className={cn("ring-border rounded-md object-cover ring-1", sizes[size], className)} />;
  }
  const label = (shortCode || initials(name)).slice(0, 4);
  const color = PALETTE[hashIndex(seed ?? name, PALETTE.length)];
  return (
    <div className={cn("flex items-center justify-center rounded-md font-bold tracking-tight text-white", sizes[size], color, className)} aria-hidden>
      {label}
    </div>
  );
}
