# ROADMAP_AUDIT

Fecha de auditoria: 2026-06-01

Alcance: auditoria tecnica inicial del repo antes de implementar el roadmap. No se agregaron dependencias ni serverless functions. Las migraciones Supabase que aparecen borradas en `git status` fueron aplicadas manualmente segun confirmacion operativa, por lo que este informe no las restaura.

## Resumen ejecutivo

El repo esta bastante bien orientado para aplicar cambios por etapas: los endpoints de Vercel estan agrupados, las rutas sensibles revalidan sesion contra Supabase y el dashboard/admin ya separan contenido editorial de operaciones. El mayor riesgo inmediato no esta en la cantidad de endpoints, sino en secretos locales reales dentro de `web/.env`, en la falta de una fuente versionada local para algunas migraciones Supabase aplicadas manualmente, y en algunos puntos de autorizacion/consulta que conviene endurecer antes de crecer comentarios, reacciones o administracion.

Nivel de seguridad estimado actual: 6/10.

Actualizacion tras el primer bloque de seguridad: 6.5/10 estimado. Se elimino el fallback privado con prefijo de Vite, se separaron helpers Supabase server-side y se agrego `web/.env.example` sin valores reales.

Motivos principales:

- Buenas bases: RLS previsto para tablas publicas, API backend para Sanity writes, permisos compartidos en `web/shared/auth/permissions.ts`, endpoints consolidados y tests de function budget.
- Riesgos altos: `web/.env` contiene tokens reales no versionados; el backend de comentarios aceptaba un fallback privado con prefijo publico de Vite; algunos errores admin pueden exponer mensajes internos; faltan rate limit/anti-spam propios en comentarios.
- Riesgos medios: paginacion incompleta en dashboard y datos publicos; queries de listados traen contenido pesado; cursor de comentarios se interpola en `.or()` sin validar formato fuerte; trazabilidad incompleta de migraciones Supabase si quedan solo manuales.

## 1. Serverless functions y endpoints

Endpoints reales bajo `web/api`:

| Endpoint | Archivo | Dominio | Estado |
|---|---|---|---|
| `/api/dashboard/:resource` | `web/api/dashboard/[resource].ts` | CMS editorial Sanity | Necesario; agrupa news, matches, galleries, table, tournaments, organizations, teams, players, staff. |
| `/api/admin/:resource` | `web/api/admin/[resource].ts` | Operaciones Supabase/admin | Necesario; agrupa users, roles, footer-settings, moderation, reports, audit-log, metrics, feature-flags, auth-controls, maintenance. |
| `/api/comments` | `web/api/comments/index.ts` | Comentarios y moderacion | Necesario por validacion de noticia, auth, permisos y RLS. |
| `/api/comments/:path*` | `web/api/comments/[...path].ts` | Alias/pathful comments | Util para URLs pathful; podria eliminarse solo si se migra todo a query params y se confirma compatibilidad. |
| `/api/reactions` | `web/api/reactions/index.ts` | Reacciones | Necesario hoy para validar target Sanity publicado y mediar RLS. |

Hallazgos:

- El proyecto ya esta agrupado por dominio. `web/api/functionBudget.test.ts` espera 5 route files y evita crecimiento accidental.
- `web/vite.config.js` replica los recursos dinamicos para dev local: `DASHBOARD_API_RESOURCES`, `ADMIN_API_RESOURCES` y `PUBLIC_API_ROUTES`.
- `web/vercel.json` reescribe dashboard, admin y comments antes del fallback SPA.
- No conviene agregar funciones nuevas para el roadmap si se puede extender `dashboard/[resource]`, `admin/[resource]`, `comments` o `reactions`.
- El limite actual de Vercel ya no deberia tratarse como un numero fijo tipo "12 functions" sin verificar. La documentacion actual indica que en Hobby "Functions Created per Deployment" es dependiente del framework, con 2048 routes por deployment y 1M invocations incluidas. Con 5 route files el repo no parece cerca del limite general de rutas, pero si esta cerca de su presupuesto interno porque el test falla ante cualquier route file nuevo.

Uso de secretos por endpoint:

- `web/api/dashboard/*`: usa `SANITY_API_WRITE_TOKEN` indirectamente por `web/api/_lib/sanity.ts` para mutaciones y assets.
- `web/api/admin/[resource].ts`: usa `SUPABASE_SERVICE_ROLE_KEY` por `web/api/_lib/admin.ts`.
- `web/api/comments/index.ts`: usa publishable key + Bearer token; para borrado moderador usa `SUPABASE_SERVICE_ROLE_KEY` mediante helper admin server-side.
- `web/api/reactions/index.ts`: usa publishable key + Bearer token, no service role.

Nota primer bloque de seguridad:

- `web/api/dashboard/[resource].ts` requiere serverless porque concentra escrituras Sanity con `SANITY_API_WRITE_TOKEN`, uploads y validacion de permisos.
- `web/api/admin/[resource].ts` requiere serverless porque opera Auth Admin, tablas privadas y RPCs con `SUPABASE_SERVICE_ROLE_KEY`.
- `web/api/comments/index.ts` y `web/api/comments/[...path].ts` requieren serverless por validacion de target publicado, auth/permisos, errores normalizados y moderacion con soft delete.
- `web/api/reactions/index.ts` sigue siendo serverless para validar targets Sanity publicados y evitar mutaciones contra drafts; no usa service role.
- El repo queda en 5 route files, cubierto por `web/api/functionBudget.test.ts`; no se agrego ninguna serverless function en este bloque.

Posibles simplificaciones futuras:

- Reacciones podrian pasar a cliente + RLS si se acepta mover la validacion de target publicado a RLS/RPC o a una comprobacion existente, pero hoy el endpoint evita reacciones a drafts y centraliza validacion de emoji.
- Comentarios publicos podrian usar cliente + RLS para CRUD basico, pero mantener `/api/comments` es razonable por validacion Sanity, moderacion, errores normalizados y compatibilidad.
- Dashboard Sanity writes no deberian pasar a cliente porque requieren token privado de Sanity.
- Admin Supabase no deberia pasar a cliente: administra `auth.admin`, tablas privadas y RPCs service-role.

## 2. Secretos y variables de entorno

Hallazgos:

- Existe `web/.env` local y no versionado. Contiene secretos reales: `SANITY_API_WRITE_TOKEN`, `SANITY_API_READ_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` y `SENTRY_AUTH_TOKEN`. No se copian valores en este informe.
- No hay `.env.example` versionado pese a que `.gitignore` permite `!.env.example`.
- No se encontro en `web/.env` una key privada de Supabase con prefijo de Vite, pero el codigo la aceptaba como fallback en `web/api/_lib/comments.ts`. Ese patron es peligroso porque cualquier variable `VITE_*` puede acabar expuesta al bundle si se usa en frontend.
- Variables `VITE_*` actuales parecen publicas: Sanity project/dataset/api version, Supabase URL/publishable key, site URLs, Sentry DSN, analytics/debug flags.
- `web/api/_lib/sanity.ts` permite leer configuracion publica de Sanity desde variables server o variables Vite publicas; el token de escritura solo se lee desde `SANITY_API_WRITE_TOKEN`, que es correcto.

Riesgos:

- Alto: si `web/.env` fue compartido, subido, copiado a logs o usado en entornos inseguros, los tokens deben rotarse.
- Medio: falta un `.env.example` sin secretos, lo que aumenta la probabilidad de copiar archivos reales.
- Medio: el fallback privado con prefijo de Vite debe quedar eliminado del codigo antes de cualquier documentacion nueva de env.

## 3. Supabase

Clientes Supabase encontrados:

- Frontend: `web/src/lib/supabase/client.ts` crea un singleton con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Frontend account/auth: `web/src/data/account.ts` lee `my_account` y actualiza `profiles`; `web/src/data/auth.ts` maneja Auth y escucha `private.user_accounts` por Realtime.
- API shared: `web/api/_lib/supabase.ts` separa cliente publico, cliente con token de usuario y cliente admin.
- API auth: `web/api/_lib/auth.ts` usa cliente con token de usuario y lee `my_account`.
- API comments: `web/api/_lib/comments.ts` usa cliente publico/usuario; el borrado moderador usa cliente admin server-side.
- API reactions: `web/api/_lib/reactions.ts` usa cliente publico/usuario y no service role.
- API admin: `web/api/_lib/admin.ts` usa cliente admin con service role.

Tablas/vistas sensibles usadas:

- `public.profiles`: datos personales basicos; escritura actual desde cliente para perfil propio y desde admin API para operacion.
- `private.user_accounts`: rol e `is_active`; autoridad operativa.
- `my_account`: lectura de cuenta actual para frontend/API.
- `public.news_comments`: cuerpo de comentarios y soft delete.
- `public.comment_reports`: reportes y moderacion.
- `public.user_reactions`: reaccion propia por usuario/target.
- `public.reaction_counts`: conteos agregados, probablemente vista o tabla derivada.
- `private.role_permission_overrides`, `private.feature_flags`, `private.app_runtime_settings`, `private.audit_log`: operacion admin por service role/RPC.

Operaciones que deberian depender de RLS:

- `profiles.update`: solo el usuario propio o backend admin.
- `my_account.select`: solo cuenta propia.
- `user_reactions.insert/update/delete`: solo `auth.uid()` igual a `user_id`; idealmente unique `(user_id, target_type, target_id)`.
- `reaction_counts.select`: lectura publica solo de conteos, sin datos personales.
- `news_comments.insert/update/delete`: usuario activo; update/delete propio por `user_id`; soft delete moderador solo por permiso/RPC/API.
- `comment_reports.insert`: usuario activo, no propio, unique por `(comment_id, reporter_user_id)`; lectura propia o moderador.
- Tablas `private.*`: no expuestas al Data API; acceso por RPC `admin_*` y service role.

Riesgos:

- Medio: helpers de Supabase estan duplicados entre `auth.ts`, `comments.ts` y `reactions.ts` (`getBearerToken`, config, create client). Conviene extraerlos despues de estabilizar el roadmap, no ahora.
- Medio: `comments.ts` usa service role como bypass para borrado moderador. Es aceptable si se conserva backend auth, pero no debe aceptar un service key con prefijo `VITE_`.
- Medio: las migraciones Supabase no estan disponibles como fuente versionada local en el estado actual. Si se aplicaron manualmente, conviene generar una migracion de reconciliacion o documentar el SQL exacto antes de tocar RLS/RPC.

## 4. Permisos

Estado actual:

- `web/shared/auth/permissions.ts` define roles, jerarquia, permisos core, recursos dashboard y recursos admin.
- UI: `RequirePermission`, `RequireDashboardPermission`, `usePermission` y `useDashboardPermission` ocultan rutas/acciones.
- API dashboard: cada `_handler.ts` llama `authorizeDashboardRequest(request, resource)`.
- API admin: `web/api/admin/[resource].ts` llama `authorizeAdminRequest(request, resource)` salvo `maintenance?public=1`, que es lectura publica reducida intencional.
- API comments: `authorizeUser` y `authorizeModerator` revalidan token, `my_account`, `is_active` y permisos.
- API reactions: revalida user id desde token y fuerza `user_id` del token en insert/update/delete.

Permisos solo frontend o principalmente frontend:

- La navegacion admin en `web/src/presentation/admin/adminNavigation.ts` muestra todas las secciones si el usuario tiene `viewAdminPanel`; no hay guard UI por recurso admin. El backend si valida por recurso, asi que es mas un riesgo UX que una brecha directa.
- Botones CRUD del dashboard usan `useDashboardPermission`, pero la API tambien revalida por metodo/recurso.

Acciones sensibles con backend/API:

- Dashboard CRUD Sanity.
- Admin users/roles/feature flags/maintenance/audit/metrics.
- Comentarios: crear, editar, borrar propio, borrar como moderador, reportar, cerrar reportes.
- Reacciones: set/delete como usuario autenticado.

Riesgos de llamada manual:

- Bajo/medio: llamar dashboard/admin manualmente exige token valido y permisos backend.
- Medio: `mapAdminErrorToStatus` devuelve `error.message` por defecto; algun error inesperado de Supabase/Sanity podria filtrar detalle interno.
- Medio: footer-settings guarda en Sanity y si falla audit log solo hace `console.warn`; queda inconsistencia de trazabilidad para un cambio admin.

## 5. SQL/GROQ/Query Injection

Hallazgos positivos:

- Las queries GROQ publicas usan parametros `$slug`, `$id`, `$targetId`, `$tournamentId` en vez de interpolar input de usuario.
- `web/src/data/sanity/sanityFetch.ts` y `web/api/_lib/sanity.ts` serializan params con `URLSearchParams` y `JSON.stringify`.
- Sort de comentarios esta whitelisteado (`newest`/`oldest`) y limit se normaliza con maximo.
- Dashboard inputs se validan con Zod antes de mutar Sanity.

Riesgos:

- Medio: `web/api/_lib/comments.ts` decodifica cursor base64 y luego interpola `createdAt` e `id` dentro de `.or(...)`. Aunque el cursor lo genera el server, un cliente puede fabricar uno. Validar `createdAt` como fecha ISO y `id` como UUID antes de armar el filtro.
- Bajo/medio: `querySanity` acepta strings de query arbitrarios desde codigo interno. No es un problema directo, pero al agregar filtros busqueda/sort no interpolar texto en el GROQ.
- Bajo: `studio/functions/sync-standings-snapshot/index.js` usa GROQ con `competition == "Torneo"` literal; no es injection, pero si una dependencia fragil de string.

No se encontraron `.rpc()` publicos con nombres construidos desde input de usuario. Los RPC admin se llaman con nombres constantes en `web/api/_lib/admin.ts`.

## 6. Paginacion dashboard

Estado actual:

- Dashboard noticias, partidos, galerias, clubes/equipos, torneos, organizadores, jugadores, staff y tabla usan React Query simple con `queryKeys.dashboard.*.all`.
- Los endpoints `fetchDashboard*` devuelven arrays completos.
- Las queries GROQ de dashboard no tienen `[offset...limit]` ni cursor.
- No hay patron reutilizable de paginacion para dashboard CRUD.

Listados que cargan todo:

- `dashboardNewsListQuery`: todas las noticias e incluye `content[]`, que es pesado para listado.
- `dashboardMatchListQuery`: todos los partidos e incluye `playedPlayers` y eventos/goles segun proyeccion.
- `dashboardGalleryListQuery`: todas las galerias e incluye todas las fotos con dimensiones.
- `dashboardTournamentListQuery`: todos los torneos con counts.
- `dashboardOrganizationListQuery`, `dashboardTeamListQuery`, `dashboardPlayerListQuery`, `dashboardStaffListQuery`, `dashboardTableListQuery`: todos los documentos.

Riesgos:

- Medio: al crecer contenido, el dashboard se degrada por payloads grandes y filtros cliente.
- Medio: las galerias y noticias son los primeros candidatos a payload pesado por fotos y contenido rico.
- Bajo/medio: las invalidaciones ya estan ordenadas por helper/queryKeys; se puede incorporar paginacion sin rediseñar todo si se define un contrato por recurso.

## 7. Datos publicos

Estado actual:

- `getInitialData()` carga full bootstrap para rutas genericas: news, galleries, players, staff, finished games, goal events del año, tournament, teams, tournament games, latest game y footer.
- Home ya tiene `home-critical` y datos diferidos, lo cual es una mejora importante.
- News detail y gallery detail usan payload especifico por slug.
- Public news listing `NEWS_QUERY` trae resumen, no `content[]`.
- Public gallery listing `GALLERIES_QUERY` trae todas las fotos de cada galeria, no solo hero/resumen.
- Public finished games/history trae todos los partidos finalizados y eventos/playedPlayers.

Riesgos:

- Medio: `/galerias` puede cargar demasiadas imagenes y metadata de golpe.
- Medio: historial/record y tabla consumen todos los partidos finalizados; con muchos años conviene paginar o filtrar por temporada/torneo.
- Bajo: `/noticias` no trae contenido completo, esta bien para listado.

## 8. Partidos

Modelo actual:

- Sanity `games` tiene `rival`, `date`, `location`, `competition`, `tournament`, `state`, `result`, `playedPlayers`.
- `result` esta oculto cuando `state !== "finalizado"` y en dominio web es `GameResult | null`.
- El adapter web conserva `result: null` para partidos por jugar y descarta finalizados sin marcador valido.
- `playedPlayers` se carga al finalizar para contabilizar partidos jugados por jugador y se usa en estadisticas.
- No existe implementacion real de `calledPlayers`/convocatoria y ya no esta planteada como pendiente del modelo liviano.

Riesgos:

- Medio: cualquier UI nueva debe tratar `result: null` como partido por jugar o dato incompleto, nunca como empate.
- Medio: `competition === "Torneo"` aparece como string de negocio en schema, validacion, queries y funcion de snapshots. Antes de internacionalizar o cambiar copy, conviene separar enum estable de label visible.
- Bajo: `playedPlayers` cubre "jugaron", no "convocados". No conviene mezclarlo con convocatoria en el roadmap sin nuevo campo claro.

## 9. Snapshots de tabla

Estado actual:

- `standingsState` es documento editable actual por torneo.
- `standingsSnapshots` conserva solo `current` y `previous`, read-only en Studio.
- `studio/functions/sync-standings-snapshot` genera snapshots desde eventos de documento Sanity.
- `createSnapshotId(tournamentId, snapshotRole)` crea ids estables por torneo+rol y usa `createOrReplace`.
- La web trae los snapshots `current` y `previous` del torneo activo en `TOURNAMENT_QUERY`.
- `positionChange = previousPosition - currentPosition`; positivo significa subio posiciones.
- La funcion filtra partidos por `state == "finalizado"`, `tournament._ref` y `date < snapshotDate`.

Riesgos:

- Bajo: snapshots legacy sin `snapshotRole` pueden existir hasta la proxima publicacion de tabla del torneo, cuando la Function los elimina de forma controlada.
- Medio: sin migraciones versionadas actuales, los cambios de snapshots/RPC/RLS quedan mas dificiles de reproducir.

## 10. Reacciones

Confirmacion:

- Reacciones ya existen.
- UI activa en `NewsDetail` y `PlayerDetail` mediante `EmojiReactionBar`.
- El backend soporta `targetType`: `news`, `player`, `game`.
- Se guardan en Supabase: `user_reactions`; se leen conteos desde `reaction_counts`.
- Usan serverless function `/api/reactions` y Supabase con publishable key + Bearer token.

Seguridad:

- `setReaction` y `removeReaction` obtienen `userId` desde `supabase.auth.getUser(token)` y usan ese id, no uno enviado por el cliente.
- `normalizeReactionTarget` bloquea drafts y limita tipos.
- `ensureReactionTargetExists` valida en Sanity que el target exista publicado.

Riesgos:

- Bajo/medio: los listados publicos no parecen cargar conteos de reacciones; cada detalle carga estado por target, lo cual esta bien ahora pero puede volverse N+1 si se agregan reacciones a listados.
- Medio: mantener RLS de `user_reactions` como barrera final; el endpoint ayuda pero no debe ser la unica defensa.

## 11. Comentarios

Confirmacion:

- Comentarios ya existen para noticias.
- Se guardan en Supabase: `news_comments` y `comment_reports`.
- La API `/api/comments` maneja listado, creacion, edicion, borrado propio, borrado moderador, reportes y cola de moderacion.
- La UI usa paginacion infinita con cursor y carga por noticia.

Partes concentradas:

- `web/api/_lib/comments.ts` concentra validacion, auth, acceso Supabase, DTO/adapters, repository queries, moderation, errores y cursor.
- `web/api/comments/index.ts` concentra routing HTTP para muchos subflujos.

Controles existentes:

- Normaliza cuerpo de comentario entre 1 y 2000 caracteres.
- Normaliza sort y limit.
- Valida `is_active` y rol desde `my_account`.
- Bloquea usuarios baneados/inactivos.
- Bloquea reportar comentario propio.
- Mapea errores frecuentes a mensajes publicos sin detalles internos.

Riesgos:

- Alto/medio: no hay rate limit ni control anti-spam propio para crear comentarios/reportes. Depende de Supabase/Auth/RLS o de limites externos.
- Medio: cursor de comentarios necesita validacion fuerte antes de `.or(...)`.
- Medio: `listCommentModeration` trae hasta 200 reportes abiertos para deduplicar por comentario y luego pagina; puede escalar mal si hay muchos reportes.
- Medio: service role para borrado moderador es util, pero debe quedar aislado y nunca disponible con prefijo publico.
- Bajo/medio: conviene separar `comments.ts` en validacion, auth, repository, service, DTO/mapper, errores y moderacion antes de ampliar features.

## Riesgos por severidad

### Criticos / altos

1. `web/.env` local contiene tokens reales. Rotar si pudieron haber salido de la maquina o de logs.
2. El codigo aceptaba una key privada de Supabase con prefijo de Vite como fallback en backend de comentarios. Ese fallback debe permanecer eliminado y conviene auditar envs de Vercel.
3. No hay rate limit/anti-spam propio para comentarios/reportes.

### Medios

1. Migraciones Supabase aplicadas manualmente sin fuente versionada local visible en el estado actual.
2. Cursor de comentarios interpolado en filtro `.or()` sin validacion de fecha/UUID.
3. Dashboard y galerias publicas cargan datasets completos y contenido pesado.
4. Admin error mapper puede filtrar `error.message`.
5. `competition == "Torneo"` es una regla de negocio basada en label/string.
6. Admin UI no oculta cada seccion por permiso especifico, aunque la API si revalida.
7. Audit log de footer-settings puede fallar despues de guardar en Sanity y quedar solo en warning.

### Bajos

1. Duplicacion de helpers Supabase entre auth/comments/reactions.
2. `/api/comments/[...path].ts` cuenta como route file extra para compatibilidad pathful.
3. Reacciones en listados podrian generar N+1 si se agregan sin endpoint agregado de conteos.
4. Normalizacion 0-0 de partidos por jugar requiere disciplina de UI con `state`.

## Orden recomendado de implementacion

1. Secretos y entorno: rotar tokens si aplica, mantener `.env.example`, eliminar cualquier key privada con prefijo de Vite del codigo y auditar variables en Vercel.
2. Supabase/RLS trazable: reconstruir o documentar migraciones manuales actuales; confirmar politicas de `profiles`, `my_account`, `news_comments`, `comment_reports`, `user_reactions`, `reaction_counts` y RPC admin.
3. Comentarios hardening: validar cursor, agregar rate limit/anti-spam, separar modulos internos sin cambiar contrato HTTP.
4. Admin hardening: sanitizar errores por defecto, decidir si cada pagina admin debe tener guard UI por permiso especifico, asegurar audit log transaccional o compensacion.
5. Paginacion dashboard: definir contrato comun `{items,nextCursor,total?}` y empezar por noticias/galerias/partidos.
6. Datos publicos pesados: optimizar `/galerias` y `/historial` con resumen/paginacion/filtros por año o torneo.
7. Partidos: introducir enum estable para competencia o campo `competitionType` antes de tocar snapshots/torneos.
8. Snapshots: estrategia de recomputo de fechas posteriores y acceso a historial largo bajo demanda.
9. Reacciones en listados: solo si el producto lo pide, usando conteos agregados por lote.

## Que NO conviene tocar todavia

- No agregar nuevas serverless functions: extender superficies existentes.
- No migrar comentarios/reacciones directo a cliente + RLS hasta verificar RLS real y mantener validacion de target publicado.
- No implementar convocatoria/calledPlayers: hoy `playedPlayers` significa jugadores que jugaron y se carga al finalizar.
- No cambiar labels de competencia ni reemplazar `"Torneo"` sin introducir primero un enum estable.
- No hacer paginacion global de todo el dashboard de una sola vez; definir patron y aplicar por recursos de mayor peso.
- No ampliar la reescritura de helpers Supabase mas alla de la separacion ya aplicada hasta cerrar RLS/cursor.
- No tocar UI/performance visual mientras la auditoria esta orientada a seguridad/arquitectura.

## Archivos relevantes

- `web/api/functionBudget.test.ts`
- `web/api/_lib/supabase.ts`
- `web/api/dashboard/[resource].ts`
- `web/api/admin/[resource].ts`
- `web/api/comments/index.ts`
- `web/api/comments/[...path].ts`
- `web/api/reactions/index.ts`
- `web/api/_lib/auth.ts`
- `web/api/_lib/admin.ts`
- `web/api/_lib/comments.ts`
- `web/api/_lib/reactions.ts`
- `web/api/_lib/sanity.ts`
- `web/shared/auth/permissions.ts`
- `web/src/lib/supabase/client.ts`
- `web/src/data/account.ts`
- `web/src/data/auth.ts`
- `web/src/data/comments.ts`
- `web/src/data/reactions.ts`
- `web/src/data/getInitialData.ts`
- `web/src/data/getRouteInitialData.ts`
- `web/src/data/sanity/sanityFetch.ts`
- `web/src/data/sanity/queries/news.queries.ts`
- `web/src/data/sanity/queries/galleries.queries.ts`
- `web/src/data/sanity/queries/games.queries.ts`
- `web/src/data/sanity/queries/tournaments.queries.ts`
- `web/src/data/sanity/adapters/games.adapter.ts`
- `web/src/data/sanity/adapters/tournaments.adapter.ts`
- `web/src/types/models.ts`
- `studio/schemas/games.schema.js`
- `studio/schemas/standingsState.schema.js`
- `studio/schemas/standingsSnapshots.schema.js`
- `studio/functions/sync-standings-snapshot/index.js`
- `studio/functions/sync-standings-snapshot/standingsSnapshot.js`
- `DATA_MODEL.md`
- `docs/AI_AGENT_SETUP.md`

## Fuentes externas consultadas

- Vercel Limits: https://vercel.com/docs/limits
- Vercel Functions Limits: https://vercel.com/docs/functions/limitations
