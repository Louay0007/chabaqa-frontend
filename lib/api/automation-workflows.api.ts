import { apiClient } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type WorkflowTrigger =
    | 'MEMBER_JOINED'
    | 'PURCHASE_COMPLETED'
    | 'COURSE_COMPLETED'
    | 'COURSE_STARTED'
    | 'CHALLENGE_JOINED'
    | 'INACTIVITY'
    | 'TAG_ADDED'
    | 'CUSTOM_EVENT';

export type WorkflowActionType =
    | 'SEND_EMAIL'
    | 'SEND_DM'
    | 'GRANT_ACCESS'
    | 'REVOKE_ACCESS'
    | 'ADD_TAG'
    | 'REMOVE_TAG'
    | 'ADD_TO_SEGMENT'
    | 'NOTIFY_CREATOR'
    | 'WAIT';

export type WorkflowStepType = 'action' | 'condition' | 'wait';

export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'exists' | 'not_exists';

export interface WorkflowStep {
    stepId: string;
    type: WorkflowStepType;
    // action
    actionType?: WorkflowActionType;
    actionConfig?: Record<string, any>;
    // wait
    waitHours?: number;
    // condition
    conditionField?: string;
    conditionOperator?: ConditionOperator;
    conditionValue?: any;
    trueBranchStepId?: string;
    falseBranchStepId?: string;
    // linear
    nextStepId?: string;
}

export interface AutomationWorkflow {
    _id: string;
    communityId: string;
    creatorId: string;
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    triggerConfig?: Record<string, any>;
    steps: WorkflowStep[];
    isActive: boolean;
    isPaused: boolean;
    enrolledCount: number;
    completedCount: number;
    createdAt: string;
    updatedAt: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'failed';

export interface StepHistoryEntry {
    stepId: string;
    executedAt: string;
    result?: string;
}

export interface WorkflowEnrollment {
    _id: string;
    workflowId: string;
    communityId: string;
    userId: string;
    currentStepId: string;
    status: EnrollmentStatus;
    resumeAt?: string;
    context: Record<string, any>;
    stepHistory: StepHistoryEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowStepBreakdown {
    stepId: string;
    executionCount: number;
    actionType?: string;
}

export interface WorkflowStats {
    workflowId: string;
    enrolledCount: number;
    completedCount: number;
    activeCount: number;
    cancelledCount: number;
    failedCount: number;
    completionRate: number;
    stepBreakdown: WorkflowStepBreakdown[];
}

export interface EnrollmentListResponse {
    data: WorkflowEnrollment[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateWorkflowDto {
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    triggerConfig?: Record<string, any>;
    communityId: string;
    steps: WorkflowStep[];
}

export interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    trigger?: WorkflowTrigger;
    triggerConfig?: Record<string, any>;
    steps?: WorkflowStep[];
}

// ============================================================================
// API Client
// ============================================================================

export const automationWorkflowsApi = {
    // Templates — no auth required
    async getTemplates(): Promise<Omit<CreateWorkflowDto, 'communityId'>[]> {
        const response = await apiClient.get<any>('/automation-workflows/templates');
        return response.data;
    },

    // CRUD
    async createWorkflow(dto: CreateWorkflowDto): Promise<AutomationWorkflow> {
        const response = await apiClient.post<any>('/automation-workflows', dto);
        return response.data;
    },

    async getWorkflows(communityId: string): Promise<AutomationWorkflow[]> {
        const response = await apiClient.get<any>(`/automation-workflows/community/${communityId}`);
        return response.data;
    },

    async getWorkflow(workflowId: string): Promise<AutomationWorkflow> {
        const response = await apiClient.get<any>(`/automation-workflows/${workflowId}`);
        return response.data;
    },

    async updateWorkflow(workflowId: string, dto: UpdateWorkflowDto): Promise<AutomationWorkflow> {
        const response = await apiClient.put<any>(`/automation-workflows/${workflowId}`, dto);
        return response.data;
    },

    async deleteWorkflow(workflowId: string): Promise<void> {
        await apiClient.delete(`/automation-workflows/${workflowId}`);
    },

    // Status controls
    async toggleWorkflow(workflowId: string, active: boolean): Promise<AutomationWorkflow> {
        const response = await apiClient.patch<any>(`/automation-workflows/${workflowId}/toggle`, { active });
        return response.data;
    },

    async pauseWorkflow(workflowId: string): Promise<AutomationWorkflow> {
        const response = await apiClient.patch<any>(`/automation-workflows/${workflowId}/pause`, {});
        return response.data;
    },

    async resumeWorkflow(workflowId: string): Promise<AutomationWorkflow> {
        const response = await apiClient.patch<any>(`/automation-workflows/${workflowId}/resume`, {});
        return response.data;
    },

    // Analytics
    async getWorkflowStats(workflowId: string): Promise<WorkflowStats> {
        const response = await apiClient.get<any>(`/automation-workflows/${workflowId}/stats`);
        return response.data;
    },

    // Enrollments — pass query params as a flat object (second arg to apiClient.get)
    async listEnrollments(
        workflowId: string,
        params?: { page?: number; limit?: number; status?: string }
    ): Promise<EnrollmentListResponse> {
        // Build a flat params object, omitting undefined values so the
        // ValidationPipe never sees unknown keys (e.g. a stray `params` wrapper).
        const query: Record<string, any> = {};
        if (params?.page !== undefined) query['page'] = params.page;
        if (params?.limit !== undefined) query['limit'] = params.limit;
        if (params?.status !== undefined) query['status'] = params.status;
        const response = await apiClient.get<any>(
            `/automation-workflows/${workflowId}/enrollments`,
            query,
        );
        return response.data;
    },

    async getMemberJourney(workflowId: string, userId: string): Promise<WorkflowEnrollment> {
        const response = await apiClient.get<any>(`/automation-workflows/${workflowId}/enrollments/${userId}`);
        return response.data;
    },
};
