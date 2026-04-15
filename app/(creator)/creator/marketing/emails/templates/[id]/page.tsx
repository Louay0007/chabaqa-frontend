"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GripVertical, Trash2, Save, Eye, Type, Image, Square, Minus, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi } from "@/lib/api/crm.api";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Block types ──────────────────────────────────────────────────────────────

type BlockType = "heading" | "paragraph" | "image" | "button" | "divider" | "spacer";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  props: Record<string, string>;
}

const DEFAULT_PROPS: Record<BlockType, Record<string, string>> = {
  heading: { level: "h2", color: "#111827", align: "left" },
  paragraph: { color: "#374151", align: "left" },
  image: { alt: "", width: "100%" },
  button: { href: "#", color: "#ffffff", background: "#3b82f6", align: "center" },
  divider: { color: "#e5e7eb" },
  spacer: { height: "24px" },
};

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  heading: <Type className="h-4 w-4" />,
  paragraph: <Type className="h-3 w-3" />,
  image: <Image className="h-4 w-4" />,
  button: <Square className="h-4 w-4" />,
  divider: <Minus className="h-4 w-4" />,
  spacer: <Columns className="h-4 w-4" />,
};

const VARIABLES = ["{{userName}}", "{{communityName}}", "{{email}}", "{{date}}"];

function blockToHtml(block: Block): string {
  switch (block.type) {
    case "heading": {
      const level = block.props.level || "h2";
      return `<${level} style="color:${block.props.color};text-align:${block.props.align};">${block.content}</${level}>`;
    }
    case "paragraph":
      return `<p style="color:${block.props.color};text-align:${block.props.align};">${block.content}</p>`;
    case "image":
      return `<img src="${block.content}" alt="${block.props.alt}" style="width:${block.props.width};max-width:100%;" />`;
    case "button":
      return `<div style="text-align:${block.props.align || "center"}"><a href="${block.props.href}" style="display:inline-block;padding:10px 20px;background:${block.props.background};color:${block.props.color};border-radius:6px;text-decoration:none;">${block.content}</a></div>`;
    case "divider":
      return `<hr style="border-color:${block.props.color};" />`;
    case "spacer":
      return `<div style="height:${block.props.height};"></div>`;
    default:
      return block.content;
  }
}

function blocksToHtml(blocks: Block[]): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">${blocks.map(blockToHtml).join("\n")}</div>`;
}

/** Embeds the blocks JSON into the saved HTML so it can be restored on load. */
function serializeContent(blocks: Block[]): string {
  const encoded = encodeURIComponent(JSON.stringify(blocks));
  return `<!-- BLOCKS:${encoded} -->\n${blocksToHtml(blocks)}`;
}

/** Extracts the blocks array from previously serialized content, or null if not present. */
function deserializeBlocks(content: string): Block[] | null {
  // encodeURIComponent always encodes '>' as '%3E', so '-->' can never appear inside the payload
  const match = content?.match(/^<!-- BLOCKS:(.*?) -->/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Block[];
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Editor Page ──────────────────────────────────────────────────────────────

export default function TemplateEditorPage({ params }: { params: { id: string } }) {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const isNew = params.id === "new";

  const [name, setName] = useState("Untitled Template");
  const [subject, setSubject] = useState("Your subject here");
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uid(), type: "heading", content: "Hello, {{userName}}!", props: DEFAULT_PROPS.heading },
    { id: uid(), type: "paragraph", content: "Welcome to {{communityName}}.", props: DEFAULT_PROPS.paragraph },
    { id: uid(), type: "button", content: "Get Started", props: DEFAULT_PROPS.button },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const { data: template } = useQuery({
    queryKey: ["email-template", communityId, params.id],
    queryFn: async () => {
      const t = await crmApi.getTemplate(communityId!, params.id);
      setName(t.name);
      setSubject(t.subject);
      const restored = deserializeBlocks(t.content);
      if (restored && restored.length > 0) setBlocks(restored);
      return t;
    },
    enabled: !!communityId && !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = serializeContent(blocks);
      const variables = VARIABLES.filter((v) =>
        blocks.some((b) => b.content.includes(v) || Object.values(b.props).some((p) => p.includes(v)))
      );
      if (isNew) {
        return crmApi.createTemplate({
          communityId: communityId!,
          name,
          subject,
          content,
          variables,
          category: "custom",
          isGlobal: false,
        } as any);
      } else {
        return crmApi.updateTemplate(params.id, { name, subject, content, variables });
      }
    },
    onSuccess: () => {
      toast({ title: "Template saved" });
      queryClient.invalidateQueries({ queryKey: ["email-templates", communityId] });
      router.push("/creator/marketing/emails/templates");
    },
  });

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: uid(),
      type,
      content: type === "heading" ? "New Heading" : type === "button" ? "Click Here" : type === "image" ? "https://placehold.co/600x200" : "New text block",
      props: { ...DEFAULT_PROPS[type] },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelected(newBlock.id);
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelected(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const selectedBlock = blocks.find((b) => b.id === selected);

  return (
    <PageShell className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-2 bg-background">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          className="w-48 h-8 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          className="flex-1 h-8 text-sm"
          placeholder="Subject line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
          <Eye className="mr-1 h-4 w-4" /> {preview ? "Edit" : "Preview"}
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-1 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Block palette */}
        <div className="w-48 border-r p-3 space-y-1 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Blocks</p>
          {(["heading", "paragraph", "image", "button", "divider", "spacer"] as BlockType[]).map((type) => (
            <button
              key={type}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => addBlock(type)}
            >
              {BLOCK_ICONS[type]}
              <span className="capitalize">{type}</span>
            </button>
          ))}
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Variables</p>
            {VARIABLES.map((v) => (
              <button
                key={v}
                className="block w-full text-left text-xs text-blue-600 hover:underline px-1 py-0.5"
                onClick={() => {
                  if (selectedBlock) {
                    updateBlock(selectedBlock.id, { content: selectedBlock.content + v });
                  }
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {preview ? (
            <div
              className="bg-white shadow rounded max-w-2xl mx-auto p-6"
              dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks) }}
            />
          ) : (
            <div className="bg-white shadow rounded max-w-2xl mx-auto p-6 space-y-2">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={`group relative rounded border-2 p-2 cursor-pointer transition-colors ${
                    selected === block.id ? "border-blue-400 bg-blue-50" : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => setSelected(block.id)}
                >
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: blockToHtml(block) }}
                    className="pointer-events-none"
                  />
                  {selected === block.id && (
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button
                        className="rounded p-0.5 hover:bg-white text-muted-foreground text-xs"
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }}
                        disabled={idx === 0}
                      >↑</button>
                      <button
                        className="rounded p-0.5 hover:bg-white text-muted-foreground text-xs"
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }}
                        disabled={idx === blocks.length - 1}
                      >↓</button>
                      <button
                        className="rounded p-0.5 hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Click a block type on the left to start building
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Properties */}
        {selectedBlock && !preview && (
          <div className="w-56 border-l p-4 overflow-y-auto space-y-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Properties</p>
            <div>
              <p className="text-xs mb-1 text-muted-foreground">Content</p>
              {selectedBlock.type === "image" ? (
                <Input
                  value={selectedBlock.content}
                  onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                  placeholder="Image URL"
                />
              ) : (
                <Textarea
                  rows={3}
                  value={selectedBlock.content}
                  onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                />
              )}
            </div>
            {Object.entries(selectedBlock.props).map(([key, val]) => (
              <div key={key}>
                <p className="text-xs mb-1 text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                <Input
                  value={val}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      props: { ...selectedBlock.props, [key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
