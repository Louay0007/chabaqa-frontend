import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Sparkles, Copy, X } from "lucide-react"
import { CreatorInsightsResponse } from "@/lib/api/creator-analytics.api"

interface AnalyticsAiInsightsProps {
  aiInsights: any
  aiInsightsMeta: any
  aiTab: string
  setAiTab: (tab: any) => void
  selectedItemTitle: string | null
  selectedItemId: string | null
  focusStepId: string | null
  focusStepTitle: string | null
  copyToClipboard: (text: string, msg: string) => Promise<void>
  setAiInsights: (data: any) => void
  setAiInsightsMeta: (meta: any) => void
  tryParseJsonObject: (input: any) => any
  toHumanParagraph: (input: any) => string
}

export function AnalyticsAiInsights({
  aiInsights,
  aiInsightsMeta,
  aiTab,
  setAiTab,
  selectedItemTitle,
  selectedItemId,
  focusStepId,
  focusStepTitle,
  copyToClipboard,
  setAiInsights,
  setAiInsightsMeta,
  tryParseJsonObject,
  toHumanParagraph
}: AnalyticsAiInsightsProps) {
  const parsed = tryParseJsonObject(aiInsights.summary)
  const derived = parsed && typeof (parsed as any).summary === "string" ? (parsed as any) : null
  const effectiveInsights: CreatorInsightsResponse = derived
    ? {
        ...aiInsights,
        summary: String(derived.summary),
        topIssues: Array.isArray(derived.topIssues) ? derived.topIssues : aiInsights.topIssues,
        fixes: Array.isArray(derived.fixes) ? derived.fixes : aiInsights.fixes,
        rewriteSuggestions: Array.isArray(derived.rewriteSuggestions)
          ? derived.rewriteSuggestions
          : aiInsights.rewriteSuggestions,
        experiments: Array.isArray(derived.experiments) ? derived.experiments : aiInsights.experiments,
        warnings: Array.from(
          new Set([
            ...(Array.isArray(aiInsights.warnings) ? aiInsights.warnings : []),
            ...(Array.isArray(derived.warnings) ? derived.warnings : []),
          ]),
        ),
      }
    : aiInsights

  const warnings = Array.isArray(effectiveInsights.warnings) ? effectiveInsights.warnings : []
  const uiWarnings = warnings
    .map((w) => String(w))
    .filter((w) => w.trim().length > 0)
    .filter((w) => !/ai response was not valid json/i.test(w))
    .filter((w) => !/returned a safe fallback summary/i.test(w))
    .filter((w) => !/response is not an object/i.test(w))
    .filter((w) => !/fallback response/i.test(w))

  const summaryText = String(effectiveInsights.summary || "")
  const humanSummary = toHumanParagraph(summaryText) || "No summary returned."
  const summaryTitle = `Insights for ${selectedItemTitle ? selectedItemTitle : selectedItemId}${focusStepId ? ` · ${focusStepTitle ? focusStepTitle : `Step ${focusStepId}`}` : ""}`

  const conclusionText = (() => {
    if (effectiveInsights.fixes?.length) {
      const actions = effectiveInsights.fixes
        .slice(0, 2)
        .map((fix) => String(fix.exactCreatorAction || fix.title || "").trim())
        .filter(Boolean)
      if (actions.length) return actions.join("\n")
    }
    if (effectiveInsights.experiments?.length) {
      const exp = effectiveInsights.experiments[0]
      if (exp?.name) return `Run an experiment: ${exp.name} (track: ${exp.successMetric}).`
    }
    return "Focus on the worst drop-off step first, simplify prerequisites, and test a clearer intro + CTA."
  })()

  const renderConfidence = (confidence: any) => {
    const value = String(confidence || "").toLowerCase()
    const label = value === "high" ? "High" : value === "med" ? "Medium" : "Low"
    const classes =
      value === "high"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : value === "med"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-slate-50 text-slate-700 border-slate-200"
    
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {label} conf
      </span>
    )
  }

  return (
    <div className="border border-indigo-100 rounded-xl bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI Explainer</h3>
            <p className="text-xs font-medium text-slate-500 mt-1 flex flex-wrap gap-1.5 items-center" dir="auto">
              <span className="truncate max-w-[200px]">{selectedItemTitle ? selectedItemTitle : selectedItemId}</span>
              {focusStepId && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 rounded">Focus: {focusStepTitle ? focusStepTitle : focusStepId}</span>
                </>
              )}
              {(aiInsightsMeta?.model || aiInsightsMeta?.cached) && <span className="text-slate-300">•</span>}
              {aiInsightsMeta?.model && <span>{aiInsightsMeta.model}</span>}
              {aiInsightsMeta?.cached && <span className="bg-slate-100 text-slate-600 px-1.5 rounded font-mono">Cached</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(humanSummary, "Copied summary")} className="h-9 gap-1.5 text-xs font-semibold">
            <Copy className="w-3.5 h-3.5" /> Copy Summary
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            onClick={() => {
              setAiInsights(null)
              setAiInsightsMeta(null)
              setAiTab("summary")
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {uiWarnings.length > 0 && (
        <div className="space-y-1.5 mb-5 p-3.5 bg-amber-50 border border-amber-100 rounded-lg relative z-10">
          {uiWarnings.slice(0, 4).map((w) => (
            <p key={String(w)} className="text-xs font-medium text-amber-800 flex items-start gap-2" dir="auto">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
              {String(w)}
            </p>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <Tabs value={aiTab} onValueChange={(v) => setAiTab(v as any)}>
          <TabsList className="flex flex-wrap h-auto bg-slate-100/80 p-1 rounded-lg border border-slate-200/50 mb-5">
            <TabsTrigger value="summary" className="text-xs font-bold px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Summary</TabsTrigger>
            <TabsTrigger value="issues" className="text-xs font-bold px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Issues</TabsTrigger>
            <TabsTrigger value="fixes" className="text-xs font-bold px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Fixes</TabsTrigger>
            <TabsTrigger value="rewrites" className="text-xs font-bold px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Rewrites</TabsTrigger>
            <TabsTrigger value="experiments" className="text-xs font-bold px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Experiments</TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
            <TabsContent value="summary" className="m-0 p-5">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-2">Analysis Target</h4>
                  <p className="text-lg font-bold text-slate-900 leading-tight" dir="auto">{summaryTitle}</p>
                </div>
                
                <div className="h-px bg-slate-100 w-full" />
                
                <div>
                  <h4 className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Key Findings</h4>
                  <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line" dir="auto">{humanSummary}</p>
                </div>
                
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  <h4 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-2">Strategic Recommendation</h4>
                  <p className="text-sm font-medium text-indigo-900 leading-relaxed whitespace-pre-line" dir="auto">{conclusionText}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="m-0 p-3">
              {effectiveInsights.topIssues?.length ? (
                <div className="space-y-3">
                  {effectiveInsights.topIssues.slice(0, 6).map((issue) => (
                    <div key={`${issue.stepId}-${issue.stepTitle}`} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-slate-900 truncate" dir="auto">{issue.stepTitle}</p>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Step {issue.stepId}</p>
                        </div>
                        {renderConfidence(issue.confidence)}
                      </div>
                      
                      {Array.isArray(issue.metricEvidence) && issue.metricEvidence.length > 0 ? (
                        <div className="mb-4">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence</h5>
                          <ul className="space-y-1.5">
                            {issue.metricEvidence.slice(0, 4).map((ev) => (
                              <li key={ev} className="text-xs font-medium text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded-md" dir="auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0" />
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      
                      {issue.hypothesis ? (
                        <div>
                          <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Hypothesis</h5>
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed" dir="auto">{issue.hypothesis}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No issues identified.
                </div>
              )}
            </TabsContent>

            <TabsContent value="fixes" className="m-0 p-3">
              {effectiveInsights.fixes?.length ? (
                <div className="space-y-3">
                  {effectiveInsights.fixes.slice(0, 8).map((fix) => (
                    <div key={fix.title} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors shadow-sm">
                      <p className="text-base font-bold text-slate-900 mb-2" dir="auto">{fix.title}</p>
                      
                      {fix.whyItHelps ? (
                        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed mb-4" dir="auto">{fix.whyItHelps}</p>
                      ) : null}
                      
                      {fix.exactCreatorAction ? (
                        <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                          <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase mb-1.5">Action Plan</p>
                          <p className="text-sm font-medium text-indigo-900 whitespace-pre-line leading-relaxed" dir="auto">{fix.exactCreatorAction}</p>
                        </div>
                      ) : null}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col justify-center">
                          <p className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase mb-1">Expected Lift</p>
                          <p className="text-sm font-bold text-slate-800" dir="auto">{fix.expectedMetricLift || "—"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col justify-center">
                          <p className="text-[10px] font-bold tracking-widest text-rose-400 uppercase mb-1">Risk Level</p>
                          <p className="text-sm font-bold text-slate-800" dir="auto">{fix.risk || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No fixes recommended.
                </div>
              )}
            </TabsContent>

            <TabsContent value="rewrites" className="m-0 p-3">
              {effectiveInsights.rewriteSuggestions?.length ? (
                <div className="space-y-4">
                  {effectiveInsights.rewriteSuggestions.slice(0, 8).map((rw, idx) => (
                    <div key={`${rw.stepId}-${rw.target}-${idx}`} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between gap-4 bg-slate-50 border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 px-2 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-600">
                            Step {rw.stepId}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 capitalize" dir="auto">
                            {rw.target}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={() => copyToClipboard(rw.text, "Copied rewrite")}>
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                        </Button>
                      </div>
                      <div className="p-5">
                        <p className="text-[15px] font-medium text-slate-800 whitespace-pre-line leading-relaxed italic border-l-4 border-indigo-200 pl-4" dir="auto">
                          "{rw.text}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No rewrite suggestions generated.
                </div>
              )}
            </TabsContent>

            <TabsContent value="experiments" className="m-0 p-3">
              {effectiveInsights.experiments?.length ? (
                <div className="space-y-4">
                  {effectiveInsights.experiments.slice(0, 6).map((exp) => (
                    <div key={exp.name} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors shadow-sm">
                      <p className="text-lg font-bold text-slate-900 mb-4" dir="auto">{exp.name}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Control</p>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] font-bold text-slate-600">A</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed" dir="auto">{exp.variantA}</p>
                        </div>
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Variant</p>
                            <span className="px-2 py-0.5 rounded bg-indigo-200 text-[10px] font-bold text-indigo-700">B</span>
                          </div>
                          <p className="text-sm font-medium text-indigo-900 whitespace-pre-line leading-relaxed" dir="auto">{exp.variantB}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Success Metric</p>
                          <p className="text-sm font-bold text-slate-800" dir="auto">{exp.successMetric}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Duration</p>
                          <p className="text-sm font-bold text-slate-800">{Number(exp.runForDays || 0)} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No experiments recommended.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
