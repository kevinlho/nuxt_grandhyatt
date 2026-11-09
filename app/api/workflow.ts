import type { AxiosInstance } from 'axios'
import type { PageQuery, Paginated } from '~/types/pagination'
import type { WorkflowRequest, WorkflowRequestInput, WorkflowScope, WorkflowStatus } from '~/types/workflow'

export type WorkflowQuery = PageQuery & { scope: WorkflowScope; status?: WorkflowStatus | '' }

export const workflowApi = (http: AxiosInstance) => ({
  list: async (params: WorkflowQuery) => (await http.get<Paginated<WorkflowRequest>>('/workflows', { params })).data,
  get: async (id: string) => (await http.get<WorkflowRequest>(`/workflows/${id}`)).data,
  /** number of requests waiting for the current user's decision (nav badge) */
  inboxCount: async () => (await http.get<{ count: number }>('/workflows/inbox/count')).data.count,
  submit: async (input: WorkflowRequestInput) => (await http.post<WorkflowRequest>('/workflows', input)).data,
  approve: async (id: string, comment?: string) => (await http.post<WorkflowRequest>(`/workflows/${id}/approve`, { comment })).data,
  reject: async (id: string, comment: string) => (await http.post<WorkflowRequest>(`/workflows/${id}/reject`, { comment })).data,
  cancel: async (id: string) => (await http.post<WorkflowRequest>(`/workflows/${id}/cancel`)).data,
  complete: async (id: string, comment?: string) => (await http.post<WorkflowRequest>(`/workflows/${id}/complete`, { comment })).data
})

export type WorkflowApi = ReturnType<typeof workflowApi>
