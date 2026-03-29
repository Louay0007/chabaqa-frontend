'use client';


import { useTranslations } from 'next-intl';
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useAnalyticsInsights } from '@/hooks/use-creator-analytics';

interface AIInsightsPanelProps {
  communityId: string;
  contentType?: string;
  contentId?: string;
  plan: string;
}

export function AIInsightsPanel({ communityId, contentType, contentId, plan }: AIInsightsPanelProps) {
  const t = useTranslations('analytics');
  const mutation = useAnalyticsInsights();

  const handleGenerate = () => {
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    mutation.mutate({ communityId, contentType: contentType as any, contentId: contentId ?? '', from, to });
  };

  const insights = (mutation.data as any)?.data?.data ?? (mutation.data as any)?.data ?? null;
  const isLoading = mutation.isPending;

  if (plan === 'starter') return null;

  return (
    <div className="rounded-xl border border-[var(--bd)] p-4 bg-gradient-to-br from-purple-50/50 to-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--p)]" />
          <h3 className="font-semibold text-[var(--t1)]">{t('insights.title')}</h3>
        </div>
        {!mutation.data && !isLoading && (
          <button
            onClick={handleGenerate}
            className="text-sm px-3 py-1.5 rounded-lg bg-[var(--p)] text-white hover:bg-[var(--p-dark)] transition-colors"
          >
            {t('insights.generate')}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--t3)]">
          <div className="w-4 h-4 border-2 border-[var(--p)] border-t-transparent rounded-full animate-spin" />
          {t('insights.loading')}
        </div>
      )}

      {insights && !isLoading && (
        <div className="space-y-3">
          {insights.summary && (
            <p className="text-sm text-[var(--t2)]">{insights.summary}</p>
          )}
          {insights.topIssues?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                {t('insights.issues')}
              </div>
              {insights.topIssues.map((issue: string, i: number) => (
                <p key={i} className="text-sm text-[var(--t2)] ps-5">• {issue}</p>
              ))}
            </div>
          )}
          {insights.fixes?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {t('insights.fixes')}
              </div>
              {insights.fixes.map((fix: string, i: number) => (
                <p key={i} className="text-sm text-[var(--t2)] ps-5">• {fix}</p>
              ))}
            </div>
          )}
          {insights.experiments?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-[var(--p)]">
                <Lightbulb className="w-4 h-4" />
                {t('insights.experiments')}
              </div>
              {insights.experiments.map((exp: string, i: number) => (
                <p key={i} className="text-sm text-[var(--t2)] ps-5">• {exp}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
