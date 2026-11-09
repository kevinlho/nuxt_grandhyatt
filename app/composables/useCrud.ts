import type { PageQuery, Paginated } from '~/types/pagination'

interface CrudService<T, I> {
  list(q: PageQuery): Promise<Paginated<T>>
  create(i: I): Promise<T>
  update(id: string, i: I): Promise<T>
  remove(id: string): Promise<void>
}

/** Generic list + CRUD state for a management screen. */
export function useCrud<T extends { id: string }, I>(
  service: CrudService<T, I>,
  label: string,
  validate?: (input: I) => string | undefined
) {
  const toast = useToast()
  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const query = reactive<PageQuery>({ page: 1, pageSize: 10, search: '' })

  async function load() {
    loading.value = true
    try {
      const res = await service.list({ ...query })
      items.value = res.items
      total.value = res.total
    } catch (e) {
      toast.add({ title: `Failed to load ${label}`, description: (e as Error).message, color: 'error' })
    } finally { loading.value = false }
  }

  async function save(input: I, id?: string) {
    const invalid = validate?.(input)
    if (invalid) {
      toast.add({ title: 'Save failed', description: invalid, color: 'error' })
      return false
    }
    saving.value = true
    try {
      id ? await service.update(id, input) : await service.create(input)
      toast.add({ title: `${label} ${id ? 'updated' : 'created'}`, color: 'success' })
      await load()
      return true
    } catch (e) {
      toast.add({ title: 'Save failed', description: (e as Error).message, color: 'error' })
      return false
    } finally { saving.value = false }
  }

  async function remove(id: string) {
    try {
      await service.remove(id)
      toast.add({ title: `${label} deleted`, color: 'success' })
      if (items.value.length === 1 && query.page > 1) query.page--
      await load()
    } catch (e) {
      toast.add({ title: 'Delete failed', description: (e as Error).message, color: 'error' })
    }
  }

  let t: ReturnType<typeof setTimeout>
  watch(() => query.search, () => { clearTimeout(t); t = setTimeout(() => { query.page = 1; load() }, 300) })
  watch(() => query.page, load)

  watch(() => Object.entries(query).filter(([k]) => !['page', 'pageSize', 'search'].includes(k)).map(([, v]) => v).join('|'), () => { query.page = 1; load() })

  return { items, total, loading, saving, query, load, save, remove }
}
