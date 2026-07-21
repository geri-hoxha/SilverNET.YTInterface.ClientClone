export function ProjectDetailReadonly({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
      <p className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}
