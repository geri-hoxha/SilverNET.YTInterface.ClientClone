import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  src?: string | null;
  className?: string;
  /** seed used to pick a deterministic color when no image is provided */
  seed?: string;
}

const PALETTE = [
  "bg-rose-400",
  "bg-pink-400",
  "bg-fuchsia-400",
  "bg-purple-400",
  "bg-violet-400",
  "bg-indigo-400",
  "bg-blue-400",
  "bg-sky-400",
  "bg-cyan-400",
  "bg-teal-400",
  "bg-emerald-400",
  "bg-amber-400",
];

function pickColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, src, className, seed }: UserAvatarProps) {
  const initials = getInitials(name);
  const color = pickColor(seed ?? name ?? "?");
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
      <AvatarFallback className={cn("text-white text-xs font-semibold", color)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
