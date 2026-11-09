# Nuxt CMS

Nuxt 4 + Nuxt UI v4 + Axios. Dummy data by default.

```bash
npm install
cp .env.example .env
npm run dev
```
Logins (password `password`): `admin@` · `employee@` · `manager@` · `ceo@example.com`

## Structure
```
app/
  types/            # User, Product, Auth, Pagination (interfaces only)
  api/
    http.ts         # axios + bearer + auto refresh token
    crud.ts         # crudApi<T, I>(http, '/path') -> list/get/create/update/remove
    auth.ts         # login / refresh / logout
    mock/           # in-memory versions with the same shape (dummy mode)
    index.ts        # createApi(): picks real vs mock — register new resources here
  plugins/api.client.ts  # provides $api
  utils/            # tokenStorage, validators (auto-imported)
  composables/      # useAuth, useCrud(api, label, validate?)
  middleware/auth.global.ts  # route guard
  layouts/ pages/ components/  # UI
```
Pages call `$api` directly, usually through `useCrud`.

### Adding a new resource (e.g. Article)
1. `types/article.ts` — `Article` + `ArticleInput`
2. `api/index.ts` — `articles: crudApi<Article, ArticleInput>(http, '/articles')` (+ a `mockCrud` line for dummy mode)
3. optional `validateArticle` in `utils/validators.ts`
4. `pages/articles/index.vue` with `useCrud($api.articles, 'Article', validateArticle)` + a form modal

## Switching to the real API
Set `NUXT_PUBLIC_USE_DUMMY=false` and `NUXT_PUBLIC_API_BASE_URL`. Expected endpoints:

| Method | Path | Body / Response |
|---|---|---|
| POST | /auth/login | `{email,password}` → `{tokens:{accessToken,refreshToken}, user}` |
| POST | /auth/refresh | `{refreshToken}` → `{accessToken,refreshToken}` |
| POST | /auth/logout | – |
| GET | /users?page&pageSize&search | `{items,total,page,pageSize}` |
| GET/PUT/DELETE | /users/:id | |
| POST | /users | |
| (same) | /products | |

Adjust response mapping inside `api/*` if your backend shape differs — nothing else changes.

## Auto refresh flow
1. Request interceptor attaches `Authorization: Bearer <access>`.
2. On 401, the first failing request calls `/auth/refresh` (via a bare axios instance, no interceptors).
3. Other 401s during that time await the **same** refresh promise, then retry with the new token.
4. If refresh fails → tokens cleared → redirect to `/login`.
5. Requests flagged `{ skipAuth: true }` (login/refresh) are never retried.

## Sekar Batik storefront sync

The CMS is the admin for the `ecommerce-batik` store.

- **Products** carry the storefront fields: `slug`, `gender` (Wanita/Pria/Unisex), `category` (Kain/Kemeja/Blouse/Dress/Scarf), `origin`, `technique`, `pattern`, `colors[3]`, `description`, `material`, `dimensions` and per-size `variants[{ size, stock }]`. `stock` is the computed total. `isActive` = visible in shop.
- **Orders** (`/orders`) are created by the store's checkout; the CMS lists them and changes `status` (pending → paid → shipped → completed / cancelled) via `PUT /orders/:id { status }`.
- Contract: `app/types/product.ts`, `app/types/order.ts` ↔ `ecommerce-batik/types/catalog.ts`.

go_koecms still needs: the new product fields, `/orders` (GET list/get, PUT status), and public `GET /shop/products` + `POST /shop/orders` (see ecommerce-batik README).

## RBAC (roles & permissions)

- `types/rbac.ts` — permission keys (`users.view`, `workflows.approve`, …) and `Role { key, name, level, permissions }`. `'*'` = all.
- `User.role` stores `Role.key`. Login returns the user **with resolved `permissions`, `roleName`, `roleLevel`**.
- Pages declare `definePageMeta({ permission: 'users.view' })` → enforced in `middleware/auth.global.ts`.
- In components: `const { can } = usePermission()` → `v-if="can('users.manage')"`. Nav items hide automatically.
- `/roles` manages roles, their permissions and their **approval level** (employee 1 → manager 2 → CEO 3).
- UI checks are cosmetic — the backend must enforce every permission.

## Workflow module (multi-level approval)

- `/workflows/templates` (`workflows.manage`) — approval flows, e.g. *Purchase Request: Manager → CEO*.
- `/workflows` — tabs *Waiting for me* (`workflows.approve`), *My requests* (`workflows.create`), *All* (`workflows.view_all`).
- `/workflows/:id` — approval chain, approve / reject (reason required) / cancel / mark completed.

Rules (mirrored in `api/mock/workflow.ts`; implement the same in go_koecms):
1. On submit, the template's steps are copied onto the request.
2. Steps whose role level ≤ requester's level are `skipped` (a manager's request goes straight to the CEO).
3. Steps are decided in order, only by a user whose role = step role (+ `workflows.approve`), never by the requester. `'*'` can override.
4. Last approval → `approved` (the requester may continue, then `completed`). Any rejection → `rejected`. Requester may `cancel` while pending.

| Method | Path | Body |
|---|---|---|
| CRUD | /roles | `RoleInput` |
| CRUD | /workflow-templates | `WorkflowTemplateInput` |
| GET | /workflows?scope=mine\|inbox\|all&status&page&pageSize&search | → `Paginated<WorkflowRequest>` |
| GET | /workflows/inbox/count | → `{count}` |
| GET | /workflows/:id | |
| POST | /workflows | `{templateId,title,description,amount?}` |
| POST | /workflows/:id/approve · /reject · /cancel · /complete | `{comment?}` (reject: required) |

## Departments

- `types/department.ts` — `Department { code, name, description, headUserId? }`; `User.departmentId` links each user (null = unassigned).
- `/departments` (`departments.view` / `departments.manage`) — add, edit, delete; member count + head. Deleting is refused while users still belong to it.
- `/users` — department column, department picker in the form, filter `?department=<id>|none`.
- List endpoints accept extra equality filters as query params (e.g. `GET /users?departmentId=<id>`, `none` = unassigned).

| Method | Path | Body |
|---|---|---|
| CRUD | /departments | `DepartmentInput` (DELETE → 409 if it still has users) |
| (users) | /users | now includes `departmentId` |

## AI Assistant (chatbot)

`/assistant` (permission `chatbot.use`) — chat with an agentic AI; type a question and/or attach images
(button, paste or drag-drop; max 4 × 5 MB, PNG/JPG/WEBP/GIF). Enter sends, Shift+Enter new line, Stop cancels.

- `types/chat.ts` contract · `api/chat.ts` real client · `api/mock/chat.ts` dummy agent (type "error" to simulate a failure)
- `composables/useChat.ts` conversations (kept in memory for the tab; the server keeps history by `conversationId`)
- Agent base URL: `NUXT_PUBLIC_CHAT_API_URL` (empty = `NUXT_PUBLIC_API_BASE_URL`). Bearer token is sent like other calls.

```
POST {chatApiUrl}/chat            Content-Type: multipart/form-data
  message         string
  conversationId  string   (omit on the first message)
  images          file     (repeat the field per image)

200 → { "conversationId": "conv_123",
        "message": { "id": "m1", "role": "assistant", "content": "markdown text",
                     "attachments": [], "createdAt": "2026-11-07T08:00:00Z" } }
4xx/5xx → { "message": "error text" }
```
Replies support basic markdown (bold, italic, code, lists, links). Timeout is 120 s.

## Assets

`/assets` — asset register: list, **add**, **edit**, **mark deprecated / restore**. Assets are never deleted.
Fields: tag (auto-numbered per category, e.g. `GH-IT-0004`), name, category, department, location, condition, purchase date, value, notes,
`status` (`active` | `deprecated`), `deprecatedAt`, `deprecatedReason`.
Filters: search, status (default Active), category, department. Totals count active assets only.

| Permission | Allows | Default roles |
|---|---|---|
| `assets.view` | open the page | Admin, CEO, Manager, Employee, Editor |
| `assets.create` | Add Asset | Admin, Manager, Editor |
| `assets.edit` | Edit | Admin, Manager, Editor |
| `assets.deprecate` | Mark deprecated (reason required) / Restore | Admin, Manager |

| Method | Path | |
|---|---|---|
| GET | /assets?page&pageSize&search&status&category&departmentId | `Paginated<Asset>` |
| POST | /assets | `AssetInput` → 409 if tag exists |
| PUT | /assets/:id | `AssetInput` (also used to deprecate/restore) |

## Document Library

`/documents` — employees upload files; each file is **auto-sorted** into a document type using that type's keywords
(`utils/documents.ts` → `suggestCategory`; longest matching keyword wins, images fall back to `media`, everything else to `other`),
which the uploader confirms. Browse by category folder, search (title, file name, tags), filter (department, file type,
my uploads, archived), sort (newest/oldest/name/size), list or grid view, preview PDF/images, download.
Uploader or `documents.manage` can edit details and archive/restore (no hard delete).

Visibility: `everyone`, or `department` = same department, the uploader, or `documents.manage`.

| Permission | Allows | Default roles |
|---|---|---|
| `documents.view` | browse, preview, download | all roles |
| `documents.upload` | upload; edit/archive own files | Admin, CEO, Manager, Employee, Editor |
| `documents.manage` | edit/archive any file, see every department | Admin, CEO, Manager |
| `documents.types` | manage document types | Admin, Manager |

| Method | Path | |
|---|---|---|
| GET | /documents?page&pageSize&search&category&departmentId&kind&status&sort&mine | `Paginated<DocumentFile>` (visibility enforced server-side) |
| GET | /documents/counts?(same filters, no category) | `{ sop: 4, policy: 2, … }` |
| GET | /documents/:id | |
| POST | /documents (multipart: file, title, description, category, tags[], departmentId, visibility) | `DocumentFile` with `url` |
| PUT | /documents/:id | `DocumentMeta` |
| POST | /documents/:id/archive · /restore | |
| CRUD | /document-types | `DocumentTypeInput { key, name, icon, description, keywords[], isActive }` |

**Document types** (`/documents/types`): add / edit / activate-deactivate / delete. The key is locked once documents use it;
delete is refused while documents use the type (deactivate instead — no new uploads, existing files keep it).
The form has a "test a file name" box that previews which type the keywords would pick.

Next phase (AI Copilot reference): on publish, the backend extracts text (Docling/OCR) → chunks → embeddings (bge-m3) → pgvector,
keeping `departmentId`/`visibility` on each chunk so retrieval respects the same access rules.
