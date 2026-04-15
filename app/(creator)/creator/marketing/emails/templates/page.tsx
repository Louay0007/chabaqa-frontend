"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi, EmailTemplate } from "@/lib/api/crm.api";
import { useRouter } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  announcement: "bg-blue-100 text-blue-800",
  newsletter: "bg-purple-100 text-purple-800",
  promotion: "bg-orange-100 text-orange-800",
  welcome: "bg-green-100 text-green-800",
  reminder: "bg-yellow-100 text-yellow-800",
  custom: "bg-gray-100 text-gray-800",
};

export default function TemplatesPage() {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates", communityId],
    queryFn: () => crmApi.listTemplates(communityId!),
    enabled: !!communityId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteTemplate(id),
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["email-templates", communityId] });
    },
  });

  const tmplList = Array.isArray(templates) ? templates : (templates as any)?.data ?? [];

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Reusable email templates for your campaigns</p>
        </div>
        <Button onClick={() => router.push("/creator/marketing/emails/templates/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading templates...</div>
      ) : tmplList.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No templates yet. Create one to speed up campaign creation.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tmplList.map((t: EmailTemplate) => (
            <div key={t._id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
              {/* Preview */}
              <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full p-3 text-xs overflow-hidden opacity-60"
                    dangerouslySetInnerHTML={{ __html: t.content.slice(0, 500) }}
                  />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.custom}`}>
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Used {t.usageCount}×</span>
                  {t.isGlobal && <Badge variant="secondary" className="text-xs">Global</Badge>}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/creator/marketing/emails/templates/${t._id}`)}
                  >
                    <Eye className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(t._id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
