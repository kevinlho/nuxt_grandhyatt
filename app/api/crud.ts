import type { AxiosInstance } from 'axios'
import type { PageQuery, Paginated } from '~/types/pagination'

/** Standard REST CRUD for one resource, e.g. crudApi<Product, ProductInput>(http, '/products'). */
export function crudApi<T, I>(http: AxiosInstance, path: string) {
  return {
    list: async (params: PageQuery) => (await http.get<Paginated<T>>(path, { params })).data,
    get: async (id: string) => (await http.get<T>(`${path}/${id}`)).data,
    create: async (input: I) => (await http.post<T>(path, input)).data,
    update: async (id: string, input: I) => (await http.put<T>(`${path}/${id}`, input)).data,
    remove: async (id: string) => { await http.delete(`${path}/${id}`) }
  }
}

export type CrudApi<T, I> = ReturnType<typeof crudApi<T, I>>
