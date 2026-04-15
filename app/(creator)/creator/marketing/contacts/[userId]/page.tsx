"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, ShoppingCart, Mail, MousePointer, LogIn, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi, ContactActivity } from "@/lib/api/crm.api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const activityIcons: Record<string, React.ReactNode> = {
  email_open: <Mail className="h-4 w-4 text-blue-500" />,
  email_click: <MousePointer className="h-4 w-4 text-purple-500" />,
  purchase: <ShoppingCart className="h-4 w-4 text-green-500" />,
  login: <LogIn className="h-4 w-4 text-gray-500" />,
  tag_added: <Tag className="h-4 w-4 text-yellow-500" />,
  imported: <ArrowLeft className="h-4 w-4 text-gray-400" />,
};

const activityLabels: Record<string, string> = {
  email_open: "Opened email",
  email_click: "Clicked link in email",
  purchase: "Made a purchase",
  login: "Logged in",
  content_view: "Viewed content",
  tag_added: "Tag added",
  unsubscribed: "Unsubscribed",
  imported: "Imported",
};

export default function ContactDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const userId = params.userId;

  const [page, setPage] = useState(1);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["contact-profile", communityId, userId],
    queryFn: () => crmApi.getContactProfile(communityId!, userId),
    enabled: !!communityId,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["contact-timeline", communityId, userId, page],
    queryFn: () => crmApi.getContactTimeline(communityId!, userId, { page, limit: 20 }),
    enabled: !!communityId,
  });

  const recalcMutation = useMutation({
    mutationFn: () => crmApi.recalculateScore(communityId!, userId),
    onSuccess: (res) => {
      toast({ title: `Lead score recalculated: ${res.score}` });
      queryClient.invalidateQueries({ queryKey: ["contact-profile", communityId, userId] });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) =>
      crmApi.updateContactProfile(communityId!, userId, { notes }),
    onSuccess: () => {
      toast({ title: "Notes saved" });
      queryClient.invalidateQueries({ queryKey: ["contact-profile", communityId, userId] });
    },
  });

  const activities: ContactActivity[] = (timeline as any)?.items ?? [];
  const total = (timeline as any)?.total ?? 0;
  const score = (profile as any)?.leadScore ?? 0;

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Contact Profile</h1>
      </div>

      {profileLoading ? (
        <div className="text-muted-foreground">Loading profile...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">User ID</p>
              <p className="font-mono text-sm">{userId}</p>
            </div>

            {/* Lead Score Gauge */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lead Score</p>
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"}
                      strokeWidth="3"
                      strokeDasharray={`${score} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {score}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => recalcMutation.mutate()}
                  disabled={recalcMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {((profile as any)?.tags ?? []).map((t: string) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
                {((profile as any)?.tags ?? []).length === 0 && (
                  <span className="text-muted-foreground text-xs">No tags</span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border p-6 space-y-3 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
            <NotesEditor
              initial={(profile as any)?.notes ?? ""}
              onSave={(notes) => updateNotesMutation.mutate(notes)}
              saving={updateNotesMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Activity Timeline ({total})</h2>
        {timelineLoading ? (
          <div className="text-muted-foreground">Loading timeline...</div>
        ) : activities.length === 0 ? (
          <div className="text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a._id} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {activityIcons[a.type] ?? <div className="h-4 w-4 rounded-full bg-gray-300" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activityLabels[a.type] ?? a.type}</p>
                  {a.metadata?.url && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{a.metadata.url}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(a.occurredAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
        {total > 20 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function NotesEditor({
  initial,
  onSave,
  saving,
}: {
  initial: string;
  onSave: (notes: string) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-2">
      <Textarea
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes about this contact..."
      />
      <Button size="sm" onClick={() => onSave(value)} disabled={saving}>
        {saving ? "Saving..." : "Save Notes"}
      </Button>
    </div>
  );
}
