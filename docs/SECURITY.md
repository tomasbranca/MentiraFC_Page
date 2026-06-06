# SECURITY

Fecha de revision: 2026-06-01

Este documento registra el estado actual de seguridad para Supabase, permisos de
API y validaciones server-side. No reemplaza una migracion formal; documenta el
estado auditado y el SQL de reconciliacion guardado en
`docs/supabase-rls-hardening.sql`.

## Principios actuales

- El frontend solo debe usar variables publicas `VITE_*`.
- `SUPABASE_SERVICE_ROLE_KEY` se usa solo en `web/api/**` mediante helpers
  server-side.
- `SANITY_API_WRITE_TOKEN` se usa solo en endpoints de dashboard/server.
- Las rutas de UI protegen la experiencia, pero las acciones sensibles se
  revalidan en API y/o RLS.
- No se agregan nuevas serverless functions para seguridad: se reutilizan
  `/api/admin/[resource]`, `/api/comments` y `/api/reactions`.

## Estado por entidad

| Entidad | RLS | Policies/grants | Backend | Constraints | Riesgo pendiente |
|---|---:|---|---|---|---|
| `public.profiles` | Si | Lectura autenticada; update propio por RLS; grant update solo sobre `first_name`, `last_name`. | Perfil propio desde cliente; admin via API/RPC. | PK, FK a `auth.users`, checks de nombres no vacios. | Lectura autenticada de todos los perfiles sigue siendo amplia pero esperada para autores. |
| `private.user_accounts` | Si | Usuario autenticado lee solo cuenta propia; sin grants de escritura cliente. | Autoridad de rol/activo via `my_account` y admin API. | PK/FK a `auth.users`. | Hay dos policies equivalentes de lectura propia; se puede limpiar despues sin cambiar comportamiento. |
| `public.my_account` | N/A view | `security_invoker=true`; `authenticated` tiene `SELECT`. | Usada por auth API/frontend para rol e `is_active`. | Depende de `profiles` + `private.user_accounts`. | Mantener como unica vista publica de datos privados de cuenta. |
| `public.news_comments` | Si | Select publico solo no borrados; insert usuario activo con permiso; update/delete propio; update moderador. | `/api/comments` valida token, usuario activo, permiso, ownership, target publicado, rate limit y anti-spam basico. | PK/FK, body no vacio, max length, consistencia de soft delete. | Rate limit en memoria no es distribuido entre instancias/regiones. |
| `public.comment_reports` | Si | Insert usuario activo, comentario visible, no propio; select propio o moderador; update moderador. | `/api/comments` valida reporte propio/ajeno, duplicado, reason, details, rate limit y moderacion. | Unique `(comment_id, reporter_user_id)`, FKs, checks de reason/status/details. | Cola de moderacion puede escalar mal si hay muchos reportes abiertos. |
| `public.user_reactions` | Si | Read propia; insert/update/delete propia y usuario activo. | `/api/reactions` valida token, cuenta activa, target publicado, rate limit y fuerza `user_id` del token. | Unique `(user_id, target_type, target_id)`, FK, checks target/emoji. | Los helpers RLS siguen en `public`; mover a schema privado queda como hardening posterior. |
| `public.reaction_counts` | Si | Select anon/auth; sin escritura cliente. | `/api/reactions` lee conteos. | PK `(target_type, target_id, emoji)`, checks no negativos/target/emoji. | Aceptable como dato agregado publico. |
| `private.role_permission_overrides` | Si | Sin policies publicas. | Admin API/RPC service-role-only. | Gestionado por RPC admin. | Linter marca RLS sin policies; aceptado por ser schema privado/service role. |
| `private.feature_flags` | Si | Sin policies publicas. | Admin API/RPC service-role-only. | Gestionado por RPC admin. | Igual que otras tablas privadas. |
| `private.app_runtime_settings` | Si | Sin policies publicas. | Admin API/RPC service-role-only; lectura publica reducida de mantenimiento via API. | Gestionado por RPC admin. | Igual que otras tablas privadas. |
| `private.audit_log` | Si | Sin policies publicas. | Admin API/RPC service-role-only. | Gestionado por RPC admin. | Audit log de footer puede fallar despues de guardar Sanity; queda warning. |

## Validaciones por capa

Frontend:

- Mantiene guards de UX para rutas dashboard/admin y acciones visibles.
- No es la barrera de seguridad final.

Backend/API:

- Dashboard: `authorizeDashboardRequest` valida Bearer token, usuario activo,
  rol y permiso por recurso/metodo antes de mutar Sanity.
- Admin: `authorizeAdminRequest` valida token, usuario activo y permiso admin por
  recurso antes de ejecutar handlers; las operaciones privadas usan service role.
- Comentarios: valida target publicado, cuenta activa, permisos, ownership,
  reporte ajeno, duplicados, payloads grandes, rate limit y estados de
  moderacion.
- Reacciones: valida target publicado, token, cuenta activa y fuerza `user_id`
  desde Supabase Auth; limita cambios abusivos.

Base de datos:

- RLS esta activo en tablas sensibles publicas y privadas.
- Constraints cubren reportes duplicados, una reaccion por usuario/entidad,
  FKs, campos no vacios, soft delete consistente y conteos no negativos.
- Helpers `SECURITY DEFINER` usados por RLS ya no son ejecutables por `anon`.

## Reglas anti-injection

- No concatenar input de usuario dentro de SQL, GROQ ni filtros PostgREST.
- Supabase debe usar query builder (`.eq()`, `.in()`, `.order()`, `.limit()`)
  y RPCs whitelisteadas. Los RPC admin aceptados estan tipados en
  `web/api/_lib/admin.ts`.
- GROQ debe recibir valores dinamicos por `params`, nunca interpolados dentro
  del string de query. Las interpolaciones permitidas son fragmentos/proyecciones
  constantes definidos en codigo.
- IDs Supabase se validan como UUID antes de llegar a `.eq()` o RPC.
- IDs Sanity se validan por longitud y whitelist de caracteres. Las rutas
  publicas bloquean `drafts.*`; dashboard permite drafts solo para flujos
  autenticados de CMS.
- Slugs publicos se validan con formato canonico antes de consultar Sanity.
- `sort`, `limit` y `cursor` se normalizan con whitelists/maximos. Cursores de
  comentarios requieren fecha ISO y UUID antes de construir filtros `.or()`.

## Rate limit, anti-spam y logs

Reglas actuales implementadas server-side en `web/api/_lib/rateLimit.ts`:

- Crear comentarios: maximo 5 por minuto y 30 por hora por usuario.
- Editar comentarios propios: maximo 10 por minuto y 60 por hora por usuario.
- Borrar comentarios propios o moderar comentarios/reportes: maximo 10-30
  acciones por minuto segun accion.
- Reportar comentarios: maximo 10 reportes por hora por usuario.
- Cambiar o quitar reacciones: maximo 30 cambios por minuto por usuario.
- Mutaciones admin (`users`, `roles`, `feature-flags`, `maintenance`,
  `footer-settings`): maximo 20 por minuto por admin.
- Si existe header proxy de IP (`x-forwarded-for`, `x-real-ip` o
  `x-vercel-forwarded-for`), comentarios y reacciones aplican un limite extra
  de 120 escrituras por minuto por IP.

Anti-spam aplicado:

- Comentarios mantienen trim, minimo 1 caracter, maximo 2000 caracteres y
  rechazo de tags HTML.
- Comentarios repetidos exactamente iguales por el mismo usuario/noticia se
  bloquean por una ventana corta de 1 minuto.
- Reportes mantienen whitelist de reason, details maximo 500 caracteres,
  bloqueo de reporte propio y unique constraint anti-duplicado.
- Reacciones requieren usuario autenticado, cuenta activa, target publicado y
  emoji unico valido.
- Payloads con `Content-Length` excesivo se rechazan antes de parsear JSON en
  comentarios/reportes/reacciones.

Logs server-side:

- Se registran eventos sanitizados para token ausente/invalido, permiso
  denegado, usuario inactivo, rate limit activado, cambios sensibles admin,
  moderacion de comentarios/reportes y errores 5xx en APIs sensibles.
- Los logs no incluyen tokens, cookies, service keys ni payloads completos. Los
  identificadores usados para rate limit se loguean hasheados.
- El audit log persistente admin sigue pasando por RPC `admin_*`/`audit_log`.

Limitacion conocida: el rate limit actual es en memoria por instancia de
serverless function. Es suficiente como primera barrera simple, pero no es un
limite distribuido fuerte entre cold starts, regiones o instancias paralelas.
Si el trafico crece, conviene mover los eventos de rate limit a una tabla
privada de Supabase o a un store externo compartido como Redis/Upstash.

## Acciones que requieren service role

- Auth admin y listado/gestion de usuarios.
- RPCs `admin_*`.
- Mutaciones de tablas `private.*`.
- Soft delete moderador de comentarios cuando se necesita bypass controlado de
  RLS despues de validar permisos en API.

## Pendientes

- Evaluar rate limit distribuido persistente para reemplazar la memoria local
  si hay abuso real o multiples regiones activas.
- Mover helpers `SECURITY DEFINER` de RLS fuera del schema `public` o aislarlos
  en una migracion dedicada.
- Limpiar policy duplicada de `private.user_accounts` cuando haya ventana segura.
- Mantener SQL versionado/reconciliado para cambios Supabase manuales.
