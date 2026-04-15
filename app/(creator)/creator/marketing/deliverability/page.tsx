"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi } from "@/lib/api/crm.api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

export default function DeliverabilityPage() {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["deliverability-summary", communityId],
    queryFn: () => crmApi.getDeliverabilityHealth(communityId!),
    enabled: !!communityId,
    refetchInterval: 60_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["deliverability-history", communityId],
    queryFn: () => crmApi.getDeliverabilityHistory(communityId!),
    enabled: !!communityId,
  });

  const { data: suppressions = [], isLoading: suppLoading } = useQuery({
    queryKey: ["suppressions", communityId],
    queryFn: () => crmApi.listSuppressions(communityId!),
    enabled: !!communityId,
  });

  const removeMutation = useMutation({
    mutationFn: ({ email }: { email: string }) => crmApi.removeSuppression(communityId!, email),
    onSuccess: () => {
      toast({ title: "Contact removed from suppression list" });
      queryClient.invalidateQueries({ queryKey: ["suppressions", communityId] });
    },
  });

  const histList = Array.isArray(history) ? history : (history as any)?.data ?? [];
  const suppList = Array.isArray(suppressions) ? suppressions : (suppressions as any)?.data ?? [];

  const chartData = histList.slice(-30).map((d: any) => ({
    date: format(new Date(d.date), "MMM d"),
    bounceRate: d.sent > 0 ? ((d.bounces / d.sent) * 100).toFixed(2) : 0,
    spamRate: d.sent > 0 ? ((d.spamComplaints / d.sent) * 100).toFixed(2) : 0,
    unsubRate: d.sent > 0 ? ((d.unsubscribes / d.sent) * 100).toFixed(2) : 0,
  }));

  const score = summary?.score ?? 0;
  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const ScoreIcon = score >= 80 ? ShieldCheck : score >= 60 ? AlertTriangle : XCircle;

  // Compute aggregates from bounceRate etc.
  const bounceRateDisplay = summary ? `${(summary.bounceRate * 100).toFixed(2)}%` : "0%";
  const spamRateDisplay = summary ? `${(summary.spamRate * 100).toFixed(2)}%` : "0%";
  const unsubRateDisplay = summary ? `${(summary.unsubscribeRate * 100).toFixed(2)}%` : "0%";

  return (
    <PageShell className="container mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Deliverability</h1>
        <p className="text-muted-foreground">Monitor your sending health and suppression list</p>
      </div>

      {summaryLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : summary ? (
        <>
          {/* Health summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="col-span-1 rounded-lg border p-5 flex flex-col items-center justify-center">
              <ScoreIcon className={`h-8 w-8 mb-2 ${scoreColor}`} />
              <p className={`text-3xl font-bold ${scoreColor}`}>{score}</p>
              <p className="text-xs text-muted-foreground mt-1">Health Score</p>
              <span className={`mt-2 text-xs px-2 py-0.5 rounded-full ${
                summary.status === "healthy" ? "bg-green-100 text-green-700" :
                summary.status === "warning" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {summary.status}
              </span>
            </div>
            {[
              { label: "Sent (30d)", value: summary.totalSent?.toLocaleString() ?? "0" },
              { label: "Bounce Rate", value: bounceRateDisplay },
              { label: "Spam Rate", value: spamRateDisplay },
              { label: "Unsub Rate", value: unsubRateDisplay },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border p-5 flex flex-col justify-center">
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* 30-day chart */}
          {chartData.length > 0 && (
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-4">30-Day Rate History</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="bounceRate" stroke="#ef4444" name="Bounce" dot={false} />
                  <Line type="monotone" dataKey="spamRate" stroke="#f59e0b" name="Spam" dot={false} />
                  <Line type="monotone" dataKey="unsubRate" stroke="#8b5cf6" name="Unsub" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No deliverability data yet. Data appears after sending campaigns.
        </div>
      )}

      {/* Suppression list */}
      <div className="rounded-lg border">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold">Suppression List</h3>
          <span className="text-sm text-muted-foreground">{suppList.length} contacts</span>
        </div>
        {suppLoading ? (
          <div className="p-5 text-muted-foreground">Loading...</div>
        ) : suppList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Suppression list is empty.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Reason</th>
                <th className="px-4 py-2 text-left font-medium">Source</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {suppList.map((s: any) => (
                <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.reason === "unsubscribe" ? "bg-orange-100 text-orange-700" :
                      s.reason === "bounce" ? "bg-red-100 text-red-700" :
                      s.reason === "spam_complaint" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {s.reason}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{s.source}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate({ email: s.email })}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
