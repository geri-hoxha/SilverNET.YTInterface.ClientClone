import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApiError } from "@/shared/api/errors";
import { issuesApi } from "../api";
import type { IssueExportFormat, IssueListParams } from "../types";

const FORMAT_OPTIONS: {
  value: IssueExportFormat;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
}[] = [
  {
    value: 0,
    label: "Excel",
    description: ".xlsx spreadsheet",
    icon: FileSpreadsheet,
  },
  {
    value: 1,
    label: "CSV",
    description: "Comma-separated values",
    icon: FileText,
  },
  {
    value: 2,
    label: "PDF",
    description: "Portable document",
    icon: FileText,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Omit<IssueListParams, "page" | "pageSize">;
}

export function ExportIssuesDialog({ open, onOpenChange, filters }: Props) {
  const [format, setFormat] = useState<IssueExportFormat>(0);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await issuesApi.export({
        ...filters,
        format: Number(format) as IssueExportFormat,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as ApiError).message ?? "Failed to export issues");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export issues</DialogTitle>
          <DialogDescription>
            Choose a file format for your export.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-yellow-500/40 bg-yellow-50 px-3 py-2.5 text-sm text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-100">
          The export will use the filters currently applied in the filter bar.
        </div>

        <RadioGroup
          value={String(format)}
          onValueChange={(value) => setFormat(Number(value) as IssueExportFormat)}
          className="gap-3"
        >
          {FORMAT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const id = `export-format-${option.value}`;
            return (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem value={String(option.value)} id={id} className="mt-1" />
                <Label htmlFor={id} className="flex flex-1 cursor-pointer items-start gap-2 font-normal">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              "Export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
