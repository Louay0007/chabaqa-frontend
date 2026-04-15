"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, Download, Tag, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { crmApi, ContactProfile } from "@/lib/api/crm.api";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function LeadScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

export default function ContactsPage() {
  const { selectedCommunityId: communityId } = useCreatorCommunity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<ContactProfile | null>(null);


  const { data, isLoading } = useQuery({
    queryKey: ["contacts", communityId, search, minScore, maxScore, tagFilter, page],
    queryFn: () =>
      crmApi.listContacts(communityId!, {
        tags: tagFilter || undefined,
        minScore: minScore ? parseInt(minScore) : undefined,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        page,
        limit: 20,
      }),
    enabled: !!communityId,
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => crmApi.importContacts(communityId!, file),
    onSuccess: (result) => {
      toast({
        title: "Import complete",
        description: `Imported: ${result.imported}, Skipped: ${result.skipped}${result.errors.length ? `, Errors: ${result.errors.length}` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["contacts", communityId] });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
  };

  const handleExport = () => {
    const url = crmApi.exportContactsUrl(communityId!, { tags: tagFilter || undefined });
    window.open(url, "_blank");
  };

  const contacts = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">{total} contacts</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importMutation.isPending ? "Importing..." : "Import CSV"}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tag..."
            className="pl-9"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
        </div>
        <Input
          placeholder="Min score"
          className="w-28"
          type="number"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
        <Input
          placeholder="Max score"
          className="w-28"
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Tags</th>
              <th className="px-4 py-3 text-left font-medium">Lead Score</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading contacts...
                </td>
              </tr>
            )}
            {!isLoading && contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            )}
            {contacts.map((c: ContactProfile) => (
              <tr key={c._id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.userId}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {c.tags.length === 0 && (
                      <span className="text-muted-foreground text-xs">No tags</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LeadScoreBar score={c.leadScore} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/creator/marketing/contacts/${c.userId}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProfile(c)}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
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

      {/* Tag edit sheet */}
      {selectedProfile && (
        <TagEditSheet
          profile={selectedProfile}
          communityId={communityId!}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </PageShell>
  );
}

function TagEditSheet({
  profile,
  communityId,
  onClose,
}: {
  profile: ContactProfile;
  communityId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(profile.tags);

  const updateMutation = useMutation({
    mutationFn: (t: string[]) =>
      crmApi.updateContactProfile(communityId, profile.userId, { tags: t }),
    onSuccess: () => {
      toast({ title: "Tags updated" });
      queryClient.invalidateQueries({ queryKey: ["contacts", communityId] });
      onClose();
    },
  });

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag("");
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Tags</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setTags(tags.filter((x) => x !== t))}
              >
                {t} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <Button variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={() => updateMutation.mutate(tags)}
            disabled={updateMutation.isPending}
          >
            Save Tags
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

