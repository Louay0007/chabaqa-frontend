"use client";

import { useEffect, useState } from "react";
import {
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    GitBranch,
    Grip,
    Loader2,
    Mail,
    MessageSquare,
    Plus,
    Tag,
    Trash2,
    Users,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
    automationWorkflowsApi,
    AutomationWorkflow,
    WorkflowStep,
    WorkflowTrigger,
    WorkflowActionType,
    CreateWorkflowDto,
} from "@/lib/api/automation-workflows.api";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

function nanoid(len = 8): string {
    return Math.random().toString(36).slice(2, 2 + len);
}

const TRIGGER_OPTIONS: { value: WorkflowTrigger; label: string }[] = [
    { value: "MEMBER_JOINED", label: "Member Joined" },
    { value: "PURCHASE_COMPLETED", label: "Purchase Completed" },
    { value: "COURSE_COMPLETED", label: "Course Completed" },
    { value: "COURSE_STARTED", label: "Course Started" },
    { value: "CHALLENGE_JOINED", label: "Challenge Joined" },
    { value: "INACTIVITY", label: "Inactivity (N days without login)" },
    { value: "TAG_ADDED", label: "Tag Added" },
    { value: "CUSTOM_EVENT", label: "Custom Event" },
];

const ACTION_OPTIONS: { value: WorkflowActionType; label: string; icon: React.ElementType }[] = [
    { value: "SEND_EMAIL", label: "Send Email", icon: Mail },
    { value: "SEND_DM", label: "Send DM / Notification", icon: MessageSquare },
    { value: "ADD_TAG", label: "Add Tag", icon: Tag },
    { value: "REMOVE_TAG", label: "Remove Tag", icon: Tag },
    { value: "GRANT_ACCESS", label: "Grant Access", icon: Users },
    { value: "REVOKE_ACCESS", label: "Revoke Access", icon: Users },
    { value: "ADD_TO_SEGMENT", label: "Add to Segment", icon: Users },
    { value: "NOTIFY_CREATOR", label: "Notify Creator", icon: Zap },
];

const CONDITION_FIELDS = [
    { value: "courseStarted", label: "Has started a course" },
    { value: "courseCompleted", label: "Has completed a course" },
    { value: "hasPurchased", label: "Has made a purchase" },
    { value: "isActive", label: "Is active (logged in last 7 days)" },
    { value: "hasTag", label: "Has a specific tag" },
];

const CONDITION_OPERATORS = [
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
    { value: "gt", label: "greater than" },
    { value: "lt", label: "less than" },
    { value: "exists", label: "exists" },
    { value: "not_exists", label: "does not exist" },
];

// ── Step editor ───────────────────────────────────────────────────────────────

function StepEditor({
    step,
    index,
    total,
    allStepIds,
    onChange,
    onDelete,
    onMoveUp,
    onMoveDown,
}: {
    step: WorkflowStep;
    index: number;
    total: number;
    allStepIds: string[];
    onChange: (updated: WorkflowStep) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const update = (patch: Partial<WorkflowStep>) =>
        onChange({ ...step, ...patch });

    const getStepIcon = () => {
        if (step.type === "wait") return <Clock className="w-4 h-4 text-orange-500" />;
        if (step.type === "condition") return <GitBranch className="w-4 h-4 text-purple-500" />;
        if (step.actionType === "SEND_EMAIL") return <Mail className="w-4 h-4 text-blue-500" />;
        if (step.actionType === "SEND_DM") return <MessageSquare className="w-4 h-4 text-green-500" />;
        if (step.actionType?.includes("TAG")) return <Tag className="w-4 h-4 text-yellow-500" />;
        return <Zap className="w-4 h-4 text-chabaqa-primary" />;
    };

    const getStepLabel = () => {
        if (step.type === "wait") return `Wait ${step.waitHours ?? "?"} hours`;
        if (step.type === "condition") return `Condition: ${step.conditionField ?? "?"}`;
        const action = ACTION_OPTIONS.find(a => a.value === step.actionType);
        return action?.label ?? step.actionType ?? "Action";
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Step header */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="w-6 h-6 rounded-full bg-chabaqa-primary/10 flex items-center justify-center text-xs font-semibold text-chabaqa-primary flex-shrink-0">
                    {index + 1}
                </div>
                {getStepIcon()}
                <span className="text-sm font-medium flex-1 truncate">
                    {getStepLabel()}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveUp}
                        disabled={index === 0}
                    >
                        <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveDown}
                        disabled={index === total - 1}
                    >
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCollapsed((c) => !c)}
                    >
                        {collapsed ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronUp className="w-3 h-3" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-500"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {!collapsed && (
                <div className="p-3 space-y-3">
                    {/* Step type selector */}
                    <div className="grid grid-cols-3 gap-2">
                        {(["action", "wait", "condition"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() =>
                                    update({
                                        type: t,
                                        actionType: undefined,
                                        actionConfig: undefined,
                                    })
                                }
                                className={cn(
                                    "py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                    step.type === t
                                        ? "bg-chabaqa-primary text-white border-chabaqa-primary"
                                        : "border-gray-200 hover:border-chabaqa-primary/50",
                                )}
                            >
                                {t === "action" && "Action"}
                                {t === "wait" && "Wait"}
                                {t === "condition" && "Condition"}
                            </button>
                        ))}
                    </div>

                    {/* Wait config */}
                    {step.type === "wait" && (
                        <div className="space-y-2">
                            <Label className="text-xs">Wait duration (hours)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={step.waitHours ?? ""}
                                onChange={(e) =>
                                    update({ waitHours: Number(e.target.value) })
                                }
                                placeholder="e.g. 24"
                            />
                        </div>
                    )}

                    {/* Action config */}
                    {step.type === "action" && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">Action type</Label>
                                <Select
                                    value={step.actionType ?? ""}
                                    onValueChange={(v) =>
                                        update({
                                            actionType: v as WorkflowActionType,
                                            actionConfig: {},
                                        })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select action..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACTION_OPTIONS.map((a) => (
                                            <SelectItem
                                                key={a.value}
                                                value={a.value}
                                            >
                                                {a.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* SEND_EMAIL config */}
                            {step.actionType === "SEND_EMAIL" && (
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-xs">
                                            Subject
                                        </Label>
                                        <Input
                                            value={
                                                step.actionConfig?.subject ?? ""
                                            }
                                            onChange={(e) =>
                                                update({
                                                    actionConfig: {
                                                        ...(step.actionConfig ??
                                                            {}),
                                                        subject: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Welcome to {{communityName}}!"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            Content
                                        </Label>
                                        <Textarea
                                            value={
                                                step.actionConfig?.content ?? ""
                                            }
                                            onChange={(e) =>
                                                update({
                                                    actionConfig: {
                                                        ...(step.actionConfig ??
                                                            {}),
                                                        content: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Hi {{userName}}, ..."
                                            rows={4}
                                            className="mt-1 font-mono text-xs"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`html-${step.stepId}`}
                                            checked={
                                                step.actionConfig?.isHtml ??
                                                false
                                            }
                                            onCheckedChange={(v) =>
                                                update({
                                                    actionConfig: {
                                                        ...(step.actionConfig ??
                                                            {}),
                                                        isHtml: v,
                                                    },
                                                })
                                            }
                                        />
                                        <Label
                                            htmlFor={`html-${step.stepId}`}
                                            className="text-xs"
                                        >
                                            HTML content
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {/* SEND_DM config */}
                            {step.actionType === "SEND_DM" && (
                                <div>
                                    <Label className="text-xs">Message</Label>
                                    <Textarea
                                        value={
                                            step.actionConfig?.message ?? ""
                                        }
                                        onChange={(e) =>
                                            update({
                                                actionConfig: {
                                                    ...(step.actionConfig ?? {}),
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="Hey {{userName}}, ..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* ADD/REMOVE TAG config */}
                            {(step.actionType === "ADD_TAG" ||
                                step.actionType === "REMOVE_TAG") && (
                                <div>
                                    <Label className="text-xs">Tag name</Label>
                                    <Input
                                        value={
                                            step.actionConfig?.tagName ?? ""
                                        }
                                        onChange={(e) =>
                                            update({
                                                actionConfig: {
                                                    ...(step.actionConfig ?? {}),
                                                    tagName: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="e.g. graduate"
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* NOTIFY_CREATOR config */}
                            {step.actionType === "NOTIFY_CREATOR" && (
                                <div>
                                    <Label className="text-xs">
                                        Notification message
                                    </Label>
                                    <Input
                                        value={
                                            step.actionConfig?.message ?? ""
                                        }
                                        onChange={(e) =>
                                            update({
                                                actionConfig: {
                                                    ...(step.actionConfig ?? {}),
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="{{userName}} just completed the course!"
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* ADD_TO_SEGMENT config */}
                            {step.actionType === "ADD_TO_SEGMENT" && (
                                <div>
                                    <Label className="text-xs">Segment name</Label>
                                    <Input
                                        value={
                                            step.actionConfig?.segmentName ?? ""
                                        }
                                        onChange={(e) =>
                                            update({
                                                actionConfig: {
                                                    ...(step.actionConfig ?? {}),
                                                    segmentName: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="e.g. vip-members"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Condition config */}
                    {step.type === "condition" && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">Condition field</Label>
                                <Select
                                    value={step.conditionField ?? ""}
                                    onValueChange={(v) =>
                                        update({ conditionField: v })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Choose field..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONDITION_FIELDS.map((f) => (
                                            <SelectItem
                                                key={f.value}
                                                value={f.value}
                                            >
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Operator</Label>
                                    <Select
                                        value={step.conditionOperator ?? ""}
                                        onValueChange={(v) =>
                                            update({
                                                conditionOperator: v as any,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Operator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONDITION_OPERATORS.map((o) => (
                                                <SelectItem
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">
                                        Expected value
                                    </Label>
                                    <Input
                                        value={step.conditionValue ?? ""}
                                        onChange={(e) =>
                                            update({
                                                conditionValue: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. true / false"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">
                                        If TRUE → step
                                    </Label>
                                    <Select
                                        value={step.trueBranchStepId ?? "_end"}
                                        onValueChange={(v) =>
                                            update({
                                                trueBranchStepId:
                                                    v === "_end"
                                                        ? undefined
                                                        : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_end">
                                                End workflow
                                            </SelectItem>
                                            {allStepIds
                                                .filter(
                                                    (id) =>
                                                        id !== step.stepId,
                                                )
                                                .map((id) => (
                                                    <SelectItem
                                                        key={id}
                                                        value={id}
                                                    >
                                                        Step {id}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">
                                        If FALSE → step
                                    </Label>
                                    <Select
                                        value={
                                            step.falseBranchStepId ?? "_end"
                                        }
                                        onValueChange={(v) =>
                                            update({
                                                falseBranchStepId:
                                                    v === "_end"
                                                        ? undefined
                                                        : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_end">
                                                End workflow
                                            </SelectItem>
                                            {allStepIds
                                                .filter(
                                                    (id) =>
                                                        id !== step.stepId,
                                                )
                                                .map((id) => (
                                                    <SelectItem
                                                        key={id}
                                                        value={id}
                                                    >
                                                        Step {id}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next step (for non-condition steps) */}
                    {step.type !== "condition" && index < total - 1 && (
                        <div>
                            <Label className="text-xs text-gray-400">
                                Continues to next step automatically
                            </Label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function WorkflowBuilder({
    open,
    onOpenChange,
    communityId,
    initialWorkflow,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    communityId: string;
    initialWorkflow?: AutomationWorkflow;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const isEdit = !!initialWorkflow;

    const [name, setName] = useState(initialWorkflow?.name ?? "");
    const [description, setDescription] = useState(
        initialWorkflow?.description ?? "",
    );
    const [trigger, setTrigger] = useState<WorkflowTrigger>(
        initialWorkflow?.trigger ?? "MEMBER_JOINED",
    );
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(
        initialWorkflow?.triggerConfig ?? {},
    );
    const [steps, setSteps] = useState<WorkflowStep[]>(
        initialWorkflow?.steps ?? [],
    );
    const [saving, setSaving] = useState(false);

    // Reset when dialog opens with new workflow
    useEffect(() => {
        if (open) {
            setName(initialWorkflow?.name ?? "");
            setDescription(initialWorkflow?.description ?? "");
            setTrigger(initialWorkflow?.trigger ?? "MEMBER_JOINED");
            setTriggerConfig(initialWorkflow?.triggerConfig ?? {});
            setSteps(initialWorkflow?.steps ?? []);
        }
    }, [open, initialWorkflow]);

    const addStep = (type: "action" | "wait" | "condition") => {
        const newStep: WorkflowStep = {
            stepId: `s${nanoid()}`,
            type,
            waitHours: type === "wait" ? 24 : undefined,
        };
        const updated = [...steps, newStep];
        // Wire nextStepId for linear steps
        const wired = wireNextStepIds(updated);
        setSteps(wired);
    };

    const wireNextStepIds = (list: WorkflowStep[]): WorkflowStep[] => {
        return list.map((step, i) => {
            if (step.type === "condition") return step;
            const next = list[i + 1];
            return { ...step, nextStepId: next?.stepId };
        });
    };

    const updateStep = (index: number, updated: WorkflowStep) => {
        const copy = [...steps];
        copy[index] = updated;
        setSteps(wireNextStepIds(copy));
    };

    const deleteStep = (index: number) => {
        const copy = steps.filter((_, i) => i !== index);
        setSteps(wireNextStepIds(copy));
    };

    const moveStep = (index: number, direction: "up" | "down") => {
        const copy = [...steps];
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= copy.length) return;
        [copy[index], copy[target]] = [copy[target], copy[index]];
        setSteps(wireNextStepIds(copy));
    };

    const save = async () => {
        if (!name.trim()) {
            toast({
                title: "Name required",
                description: "Please enter a workflow name.",
                variant: "destructive",
            });
            return;
        }
        if (steps.length === 0) {
            toast({
                title: "No steps",
                description: "Add at least one step to your workflow.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const dto = {
                name: name.trim(),
                description: description.trim() || undefined,
                trigger,
                triggerConfig:
                    Object.keys(triggerConfig).length > 0
                        ? triggerConfig
                        : undefined,
                communityId,
                steps,
            };

            if (isEdit && initialWorkflow) {
                await automationWorkflowsApi.updateWorkflow(
                    initialWorkflow._id,
                    dto,
                );
                toast({ title: "Workflow updated" });
            } else {
                await automationWorkflowsApi.createWorkflow(dto);
                toast({
                    title: "Workflow created",
                    description:
                        "Toggle it on when you're ready to activate it.",
                });
            }
            onSuccess();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message ?? "Failed to save workflow",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const allStepIds = steps.map((s) => s.stepId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Workflow" : "New Workflow"}
                    </DialogTitle>
                    <DialogDescription>
                        Build a multi-step automation that runs automatically
                        when the trigger fires.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label>Workflow name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder='e.g. "Onboarding Sequence"'
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Description (optional)</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does this workflow do?"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Trigger */}
                    <div className="space-y-2">
                        <Label>Trigger *</Label>
                        <Select
                            value={trigger}
                            onValueChange={(v) => {
                                setTrigger(v as WorkflowTrigger);
                                setTriggerConfig({});
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TRIGGER_OPTIONS.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Inactivity extra config */}
                        {trigger === "INACTIVITY" && (
                            <div className="mt-2">
                                <Label className="text-xs">
                                    Minimum inactive days
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={triggerConfig.minInactiveDays ?? "14"}
                                    onChange={(e) =>
                                        setTriggerConfig((c) => ({
                                            ...c,
                                            minInactiveDays: Number(
                                                e.target.value,
                                            ),
                                        }))
                                    }
                                    className="mt-1 w-40"
                                    placeholder="14"
                                />
                            </div>
                        )}
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Steps ({steps.length})</Label>
                            <p className="text-xs text-gray-400">
                                Steps run in order, top to bottom
                            </p>
                        </div>

                        {steps.length === 0 ? (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                                <p className="text-sm">No steps yet</p>
                                <p className="text-xs mt-1">
                                    Add a step below to start building
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {steps.map((step, i) => (
                                    <div key={step.stepId} className="relative">
                                        {i < steps.length - 1 && (
                                            <div className="absolute left-[22px] top-full w-0.5 h-2 bg-gray-200 z-10" />
                                        )}
                                        <StepEditor
                                            step={step}
                                            index={i}
                                            total={steps.length}
                                            allStepIds={allStepIds}
                                            onChange={(updated) =>
                                                updateStep(i, updated)
                                            }
                                            onDelete={() => deleteStep(i)}
                                            onMoveUp={() =>
                                                moveStep(i, "up")
                                            }
                                            onMoveDown={() =>
                                                moveStep(i, "down")
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add step buttons */}
                        <div className="flex items-center gap-2 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addStep("action")}
                                className="flex-1 text-xs"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Action
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addStep("wait")}
                                className="flex-1 text-xs"
                            >
                                <Clock className="w-3 h-3 mr-1" />
                                Wait
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addStep("condition")}
                                className="flex-1 text-xs"
                            >
                                <GitBranch className="w-3 h-3 mr-1" />
                                Condition
                            </Button>
                        </div>
                    </div>

                    {/* Variable reference */}
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                        <p className="font-semibold mb-1">
                            Available template variables:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                "{{userName}}",
                                "{{userEmail}}",
                                "{{communityName}}",
                            ].map((v) => (
                                <code
                                    key={v}
                                    className="bg-blue-100 px-1.5 py-0.5 rounded"
                                >
                                    {v}
                                </code>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saving}>
                        {saving && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isEdit ? "Save Changes" : "Create Workflow"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
