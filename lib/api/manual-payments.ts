import { apiClient } from './client'

export const manualPaymentsApi = {
    getPendingPayments: async () => {
        return apiClient.get('/payments/manual/pending')
    },

    getHistory: async (params?: { status?: string; page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.set('status', params.status)
        if (typeof params?.page === 'number') searchParams.set('page', String(params.page))
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
        const qs = searchParams.toString()
        return apiClient.get(`/payments/manual/history${qs ? `?${qs}` : ''}`)
    },

    verifyPayment: async (orderId: string, action: 'approve' | 'reject') => {
        return apiClient.post(`/payments/manual/verify/${orderId}`, { action })
    },
}
