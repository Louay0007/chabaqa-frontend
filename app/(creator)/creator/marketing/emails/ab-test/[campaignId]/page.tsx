"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi } from "@/lib/api/crm.api";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AbTestPage({ params }: { params: { campaignId: string } }) {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmWinner, setConfirmWinner] = useState<"A" | "B" | null>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign-abtest", params.campaignId],
    queryFn: () => crmApi.getCampaignAbTest(params.campaignId),
    enabled: !!params.campaignId,
    refetchInterval: 30_000,
  });

  const pickWinnerMutation = useMutation({
    mutationFn: (winner: "A" | "B") => crmApi.pickAbTestWinner(params.campaignId, winner),
    onSuccess: () => {
      toast({ title: "Winner picked! All future sends will use the winning variant." });
      queryClient.invalidateQueries({ queryKey: ["campaign-abtest", params.campaignId] });
      setConfirmWinner(null);
    },
    onError: () => toast({ title: "Failed to pick winner", variant: "destructive" }),
  });

  const variantA = campaign?.abTest?.variantA;
  const variantB = campaign?.abTest?.variantB;

  const chartData = variantA && variantB
    ? [
        {
          metric: "Open Rate",
          "Variant A": variantA.sent > 0 ? ((variantA.opens / variantA.sent) * 100).toFixed(1) : 0,
          "Variant B": variantB.sent > 0 ? ((variantB.opens / variantB.sent) * 100).toFixed(1) : 0,
        },
        {
          metric: "Click Rate",
          "Variant A": variantA.sent > 0 ? ((variantA.clicks / variantA.sent) * 100).toFixed(1) : 0,
          "Variant B": variantB.sent > 0 ? ((variantB.clicks / variantB.sent) * 100).toFixed(1) : 0,
        },
        {
          metric: "Unsub Rate",
          "Variant A": variantA.sent > 0 ? ((variantA.unsubscribes / variantA.sent) * 100).toFixed(1) : 0,
          "Variant B": variantB.sent > 0 ? ((variantB.unsubscribes / variantB.sent) * 100).toFixed(1) : 0,
        },
      ]
    : [];

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">A/B Test Results</h1>
          {campaign && (
            <p className="text-muted-foreground text-sm">{campaign.subject}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading results...</div>
      ) : !campaign?.abTest ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No A/B test data for this campaign.
        </div>
      ) : (
        <>
          {/* Variant cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {(["A", "B"] as const).map((variant) => {
              const stats = campaign.abTest![`variant${variant}`];
              if (!stats) return null;
              const openRate = stats.sent > 0 ? ((stats.opens / stats.sent) * 100).toFixed(1) : "0.0";
              const clickRate = stats.sent > 0 ? ((stats.clicks / stats.sent) * 100).toFixed(1) : "0.0";
              const isWinner = campaign.abTest!.winner === variant;
              return (
                <div
                  key={variant}
                  className={`rounded-lg border p-6 space-y-4 ${isWinner ? "border-green-400 bg-green-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Variant {variant}</h2>
                    {isWinner && (
                      <span className="flex items-center gap-1 text-green-700 text-sm font-medium">
                        <Trophy className="h-4 w-4" /> Winner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Subject: {variant === "A" ? campaign.subject : campaign.abTest!.variantBSubject}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.sent}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{openRate}%</p>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{clickRate}%</p>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                  {!campaign.abTest!.winner && (
                    <Button
                      className="w-full"
                      variant={variant === "A" ? "default" : "outline"}
                      onClick={() => setConfirmWinner(variant)}
                    >
                      Pick Variant {variant} as Winner
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Variant A" fill="#3b82f6" />
                  <Bar dataKey="Variant B" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {confirmWinner && (
        <AlertDialog open onOpenChange={() => setConfirmWinner(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pick Variant {confirmWinner} as Winner?</AlertDialogTitle>
              <AlertDialogDescription>
                This will set Variant {confirmWinner} as the winner for this campaign. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => pickWinnerMutation.mutate(confirmWinner!)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageShell>
  );
}
