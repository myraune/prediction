import { BookOpen } from "lucide-react";

interface ResolutionSourcesProps {
  sources: string;
}

export function ResolutionSources({ sources }: ResolutionSourcesProps) {
  return (
    <div className="rounded-xl border p-3 bg-card">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        Resolution Criteria
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{sources}</p>
    </div>
  );
}
