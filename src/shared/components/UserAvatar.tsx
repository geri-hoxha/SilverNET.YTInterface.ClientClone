import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  src?: string | null;
  className?: string;
  /** seed used to pick a deterministic color when no image is provided */
  seed?: string;
}

const AVATAR_COLOR = "bg-purple-500";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  const initials = getInitials(name);
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
      <AvatarFallback className={cn("text-white text-xs font-semibold", AVATAR_COLOR)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
