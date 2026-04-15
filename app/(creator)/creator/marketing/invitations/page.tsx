"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { useToast } from "@/components/ui/use-toast";
import {
    communityInvitationsApi,
    CommunityInvitation,
    InvitationStats,
} from "@/lib/api/community-invitations.api";
import { InvitationList } from "../contacts/components/invitation-list";
import { InvitationStatsCards } from "../contacts/components/invitation-stats-cards";
import { SingleInviteDialog } from "../contacts/components/single-invite-dialog";
import { ImportContactsDialog } from "../contacts/components/import-contacts-dialog";

const PAGE_LIMIT = 20;

export default function InvitationsPage() {
    const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard();
    const { toast } = useToast();

    const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const [stats, setStats] = useState<InvitationStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalInvitations, setTotalInvitations] = useState(0);

    const [isSingleInviteOpen, setIsSingleInviteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const fetchInvitations = useCallback(
        async (page: number = 1) => {
            if (!selectedCommunityId) return;
            try {
                setLoading(true);
                setError(null);
                const response = await communityInvitationsApi.getInvitations(
                    selectedCommunityId,
                    { page, limit: PAGE_LIMIT },
                );
                setInvitations(response.invitations ?? []);
                setCurrentPage(response.page ?? page);
                setTotalInvitations(response.total ?? 0);
                setTotalPages(
                    Math.max(1, Math.ceil((response.total ?? 0) / (response.limit ?? PAGE_LIMIT))),
                );
            } catch (err: any) {
                setError(err?.message ?? "Failed to load invitations");
                setInvitations([]);
            } finally {
                setLoading(false);
            }
        },
        [selectedCommunityId],
    );

    const fetchStats = useCallback(async () => {
        if (!selectedCommunityId) return;
        try {
            setStatsLoading(true);
            setStatsError(null);
            const data = await communityInvitationsApi.getStats(selectedCommunityId);
            setStats(data);
        } catch (err: any) {
            setStatsError(err?.message ?? "Failed to load stats");
            setStats(null);
        } finally {
            setStatsLoading(false);
        }
    }, [selectedCommunityId]);

    useEffect(() => {
        if (!selectedCommunityId) return;
        fetchInvitations(1);
        fetchStats();
    }, [fetchInvitations, fetchStats, selectedCommunityId]);

    const refresh = () => {
        fetchInvitations(currentPage);
        fetchStats();
    };

    const handleResend = async (invitation: CommunityInvitation) => {
        try {
            setActionLoadingId(invitation._id);
            await communityInvitationsApi.resendInvitation(invitation._id);
            toast({ title: "Invitation resent", description: `Invitation resent to ${invitation.email}` });
            await fetchInvitations(currentPage);
        } catch (err: any) {
            toast({ title: "Error", description: err?.message ?? "Failed to resend", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRevoke = async (invitation: CommunityInvitation) => {
        try {
            setActionLoadingId(invitation._id);
            await communityInvitationsApi.revokeInvitation(invitation._id);
            toast({ title: "Invitation revoked" });
            await fetchInvitations(currentPage);
        } catch (err: any) {
            toast({ title: "Error", description: err?.message ?? "Failed to revoke", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = async (invitation: CommunityInvitation) => {
        if (!window.confirm("Delete this invitation?")) return;
        try {
            setActionLoadingId(invitation._id);
            await communityInvitationsApi.deleteInvitation(invitation._id);
            toast({ title: "Invitation deleted" });
            await fetchInvitations(currentPage);
        } catch (err: any) {
            toast({ title: "Error", description: err?.message ?? "Failed to delete", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    if (!selectedCommunity) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Please select a community to manage invitations.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (guard) return guard;

    return (
        <PageShell className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Community Invitations</h1>
                    <p className="text-gray-500">
                        Invite members to {selectedCommunity.name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportOpen(true)}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Contacts
                    </Button>
                    <Button onClick={() => setIsSingleInviteOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Invite Someone
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <InvitationStatsCards
                stats={stats}
                loading={statsLoading}
                error={statsError}
            />

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* List */}
            <InvitationList
                invitations={invitations}
                loading={loading}
                actionLoadingId={actionLoadingId}
                pagination={{
                    page: currentPage,
                    limit: PAGE_LIMIT,
                    total: totalInvitations,
                    totalPages,
                }}
                onPageChange={(page) => fetchInvitations(page)}
                onResend={handleResend}
                onRevoke={handleRevoke}
                onDelete={handleDelete}
            />

            {/* Single invite dialog */}
            {selectedCommunityId && (
                <SingleInviteDialog
                    open={isSingleInviteOpen}
                    onOpenChange={setIsSingleInviteOpen}
                    communityId={selectedCommunityId}
                    onSuccess={refresh}
                />
            )}

            {/* Import contacts dialog */}
            {selectedCommunityId && (
                <ImportContactsDialog
                    open={isImportOpen}
                    onOpenChange={setIsImportOpen}
                    communityId={selectedCommunityId}
                    onSuccess={refresh}
                />
            )}
        </PageShell>
    );
}
