import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MAX_VISIBLE = 3;

type ProjectOptionBadgesMode = "table" | "modal";

export function ProjectOptionBadges({ items, emptyLabel, mode }: { items: string[]; emptyLabel: string; mode: ProjectOptionBadgesMode }) {
  if (!items.length) {
    return <span className="text-muted-foreground text-xs italic">{emptyLabel}</span>;
  }

  if (mode === "modal") {
    return (
      <div className="flex min-w-0 flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-xs font-normal text-nowrap" title={item}>
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  const visible = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <div className="flex min-w-0 gap-1">
      {visible.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs font-normal text-nowrap" title={item}>
          {item}
        </Badge>
      ))}

      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-5.5 shrink-0 rounded-md px-1.5 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
              +{hiddenCount}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-auto max-w-xs p-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">All ({items.length})</p>
            <div className="flex flex-wrap gap-1">
              {items.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
