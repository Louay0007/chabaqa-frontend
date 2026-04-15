"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi, AudienceSegment, SegmentFilter } from "@/lib/api/crm.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const FIELDS = [
  { value: "inactivity_days", label: "Inactivity Days" },
  { value: "purchase_count", label: "Purchase Count" },
  { value: "tag", label: "Tag" },
  { value: "login_count", label: "Login Count" },
  { value: "joined_days_ago", label: "Joined Days Ago" },
  { value: "lead_score", label: "Lead Score" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
];

export default function SegmentsPage() {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["segments", communityId],
    queryFn: () => crmApi.listSegments(communityId!),
    enabled: !!communityId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteSegment(id),
    onSuccess: () => {
      toast({ title: "Segment deleted" });
      queryClient.invalidateQueries({ queryKey: ["segments", communityId] });
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: (id: string) => crmApi.evaluateSegment(id),
    onSuccess: (res) => {
      toast({ title: `Segment: ${res.count} matching contacts` });
      queryClient.invalidateQueries({ queryKey: ["segments", communityId] });
    },
  });

  const segs = Array.isArray(segments) ? segments : (segments as any)?.data ?? [];

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audience Segments</h1>
          <p className="text-muted-foreground">Define reusable filter rules to target specific contacts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Segment
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading segments...</div>
      ) : segs.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No segments yet. Create one to target specific audiences.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segs.map((seg: AudienceSegment) => (
            <div key={seg._id} className="rounded-lg border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{seg.name}</h3>
                  {seg.description && (
                    <p className="text-xs text-muted-foreground">{seg.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(seg._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{seg.estimatedSize}</span>
                <span className="text-muted-foreground">contacts</span>
                {seg.lastCalculatedAt && (
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(seg.lastCalculatedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {seg.filters.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {f.field} {f.operator} {String(f.value)}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => evaluateMutation.mutate(seg._id)}
                disabled={evaluateMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Count
              </Button>
            </div>
          ))}
        </div>
      )}

      {showCreate && communityId && (
        <CreateSegmentDialog
          communityId={communityId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </PageShell>
  );
}

function CreateSegmentDialog({
  communityId,
  onClose,
}: {
  communityId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<SegmentFilter[]>([
    { field: "inactivity_days", operator: "gt", value: "" },
  ]);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      crmApi.createSegment({
        communityId,
        name,
        description,
        filters: filters.map((f) => ({ ...f, value: f.value })),
      }),
    onSuccess: () => {
      toast({ title: "Segment created" });
      queryClient.invalidateQueries({ queryKey: ["segments", communityId] });
      onClose();
    },
  });

  const handlePreview = async () => {
    if (!name) return;
    setPreviewLoading(true);
    try {
      const seg = await crmApi.createSegment({ communityId, name: `__preview__${Date.now()}`, filters });
      const result = await crmApi.evaluateSegment(seg._id);
      setPreview(result);
      await crmApi.deleteSegment(seg._id);
    } catch {
      toast({ title: "Preview failed", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateFilter = (i: number, patch: Partial<SegmentFilter>) => {
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Audience Segment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Segment name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="space-y-2">
            <p className="text-sm font-medium">Filters</p>
            {filters.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={f.field} onValueChange={(v) => updateFilter(i, { field: v as any })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={f.operator} onValueChange={(v) => updateFilter(i, { operator: v as any })}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  placeholder="Value"
                  value={String(f.value)}
                  onChange={(e) => updateFilter(i, { value: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => [...prev, { field: "inactivity_days", operator: "gt", value: "" }])}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Filter
            </Button>
          </div>

          {preview && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{preview.count} matching contacts</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={previewLoading || !name}>
            {previewLoading ? "Previewing..." : "Preview Audience"}
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save Segment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
