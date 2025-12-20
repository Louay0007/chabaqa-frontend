import { apiClient } from './client'

export const manualPaymentsApi = {
    getPendingPayments: async () => {
        return apiClient.get('/payments/manual/pending')
    },

    verifyPayment: async (orderId: string, action: 'approve' | 'reject') => {
        return apiClient.post(`/payments/manual/verify/${orderId}`, { action })
    },
}
