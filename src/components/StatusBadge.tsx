import Badge from "./ui/Badge";

const STATUS_CONFIG: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  new: { label: "New", variant: "info" },
  classifying: { label: "Classifying…", variant: "muted" },
  classified: { label: "Classified", variant: "info" },
  drafting: { label: "Drafting…", variant: "muted" },
  drafted: { label: "Drafted", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "muted" },
  copied: { label: "Copied", variant: "success" },
  posted_manually: { label: "Posted Manually", variant: "success" },
  auto_posted: { label: "Auto-Posted", variant: "success" },
  false_positive: { label: "False Positive", variant: "muted" },
  error: { label: "Error", variant: "danger" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
