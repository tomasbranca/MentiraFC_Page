# Modelo de datos

Este documento describe el modelo actual de datos de Mentira FC en Sanity y como lo consume la web.

Fuente principal:

- Esquemas editoriales: `studio/schemas/*.schema.js`
- Queries y adaptadores web: `web/src/data/sanity/*`
- Modelos de dominio: `web/src/types/models.ts`

## Resumen

Hoy existen estos documentos de Sanity:

| Documento | Descripcion | Estado |
|---|---|---|
| `players` | Jugadores del plantel | Activo |
| `staff` | Staff y cuerpo tecnico del plantel | Activo |
| `news` | Noticias y notas editoriales | Activo |
| `galleries` | Galerias de fotos asociadas a partidos finalizados | Activo |
| `games` | Partidos de Mentira FC | Activo |
| `events` | Eventos asociados a partidos, hoy solo goles | Activo |
| `teams` | Equipos, rivales y equipo principal | Activo |
| `tournaments` | Torneos con organizador, reglas de tabla y participantes oficiales | Activo |
| `standingsState` | Tabla actual editable por torneo | Activo |
| `standingsSnapshots` | Tabla publicada generada por torneo | Activo |
| `organizations` | Organizadores/marcas de torneos | Activo |
| `footerSettings` | Contacto, redes, links y sponsors del footer publico | Activo |

## Convenciones generales

- Todos los documentos tienen los campos nativos de Sanity (`_id`, `_type`, `_createdAt`, `_updatedAt`, etc.).
- Las imagenes son assets de Sanity. En la web normalmente se consumen como URL resuelta (`imageUrl`, `logoUrl`) o como referencia de asset segun el caso.
- Las relaciones se modelan con campos `reference`.
- Los `slug` se usan para URLs publicas en jugadores y noticias.
- La web no consume los esquemas crudos directamente: primero valida respuestas con Zod y despues adapta a modelos de dominio.

## `players`

Representa un jugador del plantel.

Schema: `studio/schemas/players.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `name` | `string` | Si | Nombre del jugador. |
| `lastName` | `string` | Si | Apellido del jugador. |
| `number` | `number` | Si | Numero de camiseta. Minimo `0`. |
| `position` | `string` | Si | Posicion principal. Valores: `arq`, `def`, `med`, `del`. |
| `dominantFoot` | `string` | No | Pie habil. Valores: `right`, `left`. |
| `birthDate` | `date` | No | Fecha de nacimiento. |
| `photo` | `image` | No | Foto del jugador, con hotspot. |
| `isActive` | `boolean` | No | Controla si el jugador aparece en el plantel publico. Por defecto `true`. Los documentos inactivos conservan referencias historicas. |
| `slug` | `slug` | Si | Slug canonico para URL publica. Se genera desde nombre y apellido. |

Uso en web:

- Query principal: `PLAYERS_QUERY` (solo jugadores con `isActive != false`)
- Query de detalle: `PLAYER_BY_SLUG_OR_ID_QUERY` (sin filtrar por `isActive`, para conservar URLs historicas)
- Modelo de dominio: `Player`
- La web deriva `fullName` como `${name} ${lastName}`.
- Las estadisticas de goles no viven en `players`; se calculan desde `events` de tipo `goal`.

Relaciones actuales:

- `events.player -> players`

Relaciones faltantes/proximas:

- Agregar atributos editables del jugador.
- Agregar mapa de posiciones para representar mejor posicion principal, posiciones secundarias o ubicacion en cancha.
- Agregar redes sociales del jugador.
- Contabilizar partidos jugados desde `games.playedPlayers` en partidos finalizados, no cargarlos manualmente en el jugador.
- Agregar premios internos en cada jugador.

## `staff`

Representa integrantes del staff o cuerpo tecnico del plantel.

Schema: `studio/schemas/staff.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `name` | `string` | Si | Nombre del integrante. |
| `lastName` | `string` | Si | Apellido del integrante. |
| `role` | `string` | Si | Rol que cumple en el equipo. |
| `birthDate` | `date` | No | Fecha de nacimiento. |
| `photo` | `image` | No | Foto del integrante, con hotspot. |
| `slug` | `slug` | Si | Slug canonico para URL publica. Se genera desde nombre y apellido. |

Uso en web:

- Query principal: `STAFF_QUERY`
- Query de detalle: `STAFF_BY_SLUG_OR_ID_QUERY`
- Modelo de dominio: `StaffMember`
- La web deriva `fullName` como `${name} ${lastName}`.
- No se contabilizan goles y no tiene numero de camiseta.

Relaciones actuales:

- No tiene referencias a otros documentos.

Relaciones faltantes/proximas:

- Agregar redes sociales del integrante.

## `news`

Representa una noticia o articulo editorial.

Schema: `studio/schemas/news.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `title` | `string` | Si | Titulo de la noticia. |
| `description` | `string` | Si | Bajada o descripcion corta. |
| `content` | `array` de `block`, `image` y `video` | Si | Contenido rico Portable Text. Los bloques de texto permiten `h2`, `h3`, citas, listas, negrita, cursiva, subrayado y enlaces; las imagenes internas exigen `alt` y pueden llevar epigrafe. |
| `image` | `image` | Si | Imagen principal, con hotspot. Incluye `alt` obligatorio para accesibilidad y SEO. |
| `date` | `datetime` | Si | Fecha de publicacion o referencia editorial. Tiene valor inicial automatico. |
| `slug` | `slug` | Si | Slug para URL publica. Se genera desde `title`. |

Uso en web:

- Query principal: `NEWS_QUERY`
- Query de detalle: `NEWS_BY_SLUG_QUERY`
- Queries relacionadas: `SUGGESTED_NEWS_QUERY`, `FALLBACK_NEWS_QUERY`
- Modelo de dominio: `NewsItem`
- El dashboard puede guardar cambios como documentos `drafts.*` de Sanity. Las queries publicas fuerzan contenido publicado y excluyen drafts.

Relaciones actuales:

- No tiene referencias a otros documentos.

Relaciones faltantes/proximas:

- Relacionar noticias con datos del sitio: `players`, futuro `staff`, `games`, `tournaments`, etc.
- Agregar votaciones dentro o asociadas a noticias.
- Agregar comentarios en noticias, probablemente vinculados al futuro modelo de `usuarios`.

## `galleries`

Representa una galeria de fotos asociada a un partido finalizado.

Schema: `studio/schemas/galleries.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `game` | `reference -> games` | Si | Partido finalizado al que pertenece la galeria. |
| `slug` | `slug` | Si | Slug para URL publica. |
| `photos` | `array` de fotos | Si | Fotos de la galeria. Debe tener al menos una foto. |
| `photos[].image` | `image` | Si | Imagen de la galeria, con hotspot. |
| `photos[].isHero` | `boolean` | No | Marca la foto usada como hero en la card. Debe haber exactamente una. |
| `photos[].alt` | `string` | Si | Texto alternativo de la foto. |
| `photos[].caption` | `string` | No | Epigrafe opcional. |

Uso en web:

- Query principal: `GALLERIES_QUERY`
- Query de detalle: `GALLERY_BY_SLUG_QUERY`
- Modelo de dominio: `GalleryItem`, `GalleryImage`
- El listado se ordena por fecha del partido, de mas reciente a mas vieja.
- El titulo publico se deriva del partido: torneo, Mentira FC, goles, rival y goles del rival.
- El detalle muestra todas las fotos en un bento grid basado en la dimension de cada imagen y cada foto tiene descarga.

Relaciones actuales:

- `galleries.game -> games`

## `games`

Representa un partido de Mentira FC contra un rival.

Schema: `studio/schemas/games.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `rival` | `reference -> teams` | Si | Equipo rival. |
| `date` | `datetime` | Si | Fecha y hora del partido. |
| `location` | `string` | Si | Ubicacion del partido. |
| `competition` | `string` | Si | Tipo de competencia. Valores: `Torneo`, `Copa`, `Amistoso`. |
| `tournament` | `reference -> tournaments` | Si para `Torneo`; invalido para otros tipos | Torneo asociado. Se oculta si `competition !== "Torneo"`, salvo que exista una referencia vieja para poder limpiarla. |
| `state` | `string` | Si | Estado del partido. Valores conocidos: `por_jugar`, `finalizado`. Valores desconocidos se normalizan a `desconocido` en la web. |
| `result` | `object \| null` | Si cuando `state == "finalizado"` | Resultado real del partido. Debe ser `null` o ignorarse cuando `state !== "finalizado"`. |
| `result.goalsFor` | `number` | Si cuando `state == "finalizado"` | Goles de Mentira FC. Minimo `0`. |
| `result.goalsAgainst` | `number` | Si cuando `state == "finalizado"` | Goles del rival. Minimo `0`. |
| `playedPlayers` | `array reference -> players` | Solo al finalizar | Jugadores que jugaron. Es la fuente para partidos jugados por jugador. |

Uso en web:

- Ultimos partidos: `LATEST_GAMES_QUERY`
- Partidos finalizados: `FINISHED_GAMES_QUERY`
- Partidos finalizados de torneo: `FINISHED_TOURNAMENT_GAMES_QUERY`, solo con `competition == "Torneo"` y `tournament` definido.
- Home: `HOME_CRITICAL_QUERY`
- Modelo de dominio: `Game`

Reglas:

- `Game.result` en la web es `GameResult | null`.
- Los partidos `por_jugar` no tienen resultado y deben mostrarse como `VS` o equivalente, nunca como `0-0`.
- Los calculos deportivos ignoran partidos sin `result` valido.
- No existe convocatoria en el modelo. Solo se cargan `playedPlayers` al finalizar el partido.

La web embebe los goles del partido con una subquery a `events`:

```groq
*[_type == "events" && game._ref == ^._id && type == "goal"]
```

Relaciones actuales:

- `games.rival -> teams`
- `games.tournament -> tournaments`
- `events.game -> games`

Relaciones faltantes/proximas:

- Agregar asistencia en eventos de gol si se decide calcular estadisticas de asistencias.

## `events`

Representa un evento ocurrido en un partido. Actualmente se usa solo para goles.

Schema: `studio/schemas/events.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `game` | `reference -> games` | Si | Partido al que pertenece el evento. |
| `type` | `string` | Si | Tipo de evento. Hoy solo existe `goal`. |
| `scorerKind` | `string` | Si | Clasificacion del gol a favor de Mentira FC: `roster` (plantel), `guest` (invitado al partido) u `opponent_own_goal` (gol en propia del rival). |
| `player` | `reference -> players` | Condicional | Jugador del plantel cuando `scorerKind === "roster"`. |
| `guestName` | `string` | Condicional | Nombre del invitado cuando `scorerKind === "guest"`. |
| `order` | `number` | Si | Numero de gol en el partido. Minimo `1`. |

Los eventos solo registran goles a favor de Mentira FC. Los goles del rival viven en `games.result.goalsAgainst` sin eventos asociados.

Uso en web:

- Query global de goles: `GOAL_EVENTS_QUERY`
- Subqueries dentro de `games` para traer goles por partido.
- Modelos de dominio: `MatchEvent`, `GoalEvent`
- Estadisticas: `getTopScorers`, `getPlayerStats`

Relaciones actuales:

- `events.game -> games`
- `events.player -> players`

Relaciones faltantes/proximas:

- Agregar la opcion de indicar asistencias, por ejemplo con una referencia `assist -> players` en eventos de tipo `goal`.

## `teams`

Representa equipos. Sirve tanto para rivales como para identificar el equipo principal de Mentira FC.

Schema: `studio/schemas/teams.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `name` | `string` | Si | Nombre del equipo. |
| `logo` | `image` | Si | Escudo del equipo. |
| `isMain` | `boolean` | Si | Marca si es el equipo principal. Valor inicial `false`. |

Uso en web:

- Query principal: `TEAMS_QUERY`
- Modelo de dominio: `TeamRef`
- Se usa en tablas de posiciones y partidos.
- `isMain` permite calcular estadisticas del equipo principal en la tabla hibrida.

Relaciones actuales:

- `games.rival -> teams`
- `standingsState.rows[].team -> teams`
- `standingsSnapshots.rows[].team -> teams`

Relaciones faltantes/proximas:

- No agregar mas campos por ahora. El modelo actual esta bien como esta.

## `tournaments`

Representa un torneo o competencia organizada por una organizacion.

Schema: `studio/schemas/tournaments.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `name` | `string` | Si | Nombre del torneo. |
| `organization` | `reference -> organizations` | Si | Organizador del torneo. |
| `active` | `boolean` | Si | Indica si es el torneo activo que consume la web. |
| `primaryPrizeSlots` | `number` | Si | Cantidad de equipos que clasifican al primer premio. Valor inicial `1`. |
| `secondaryPrizeSlots` | `number` | Si | Cantidad de equipos que clasifican al segundo premio. Valor inicial `4`. |
| `participants` | `array` | Si | Lista oficial de equipos que pueden cargarse manualmente en `standingsState.rows`. No incluye Mentira FC. |
| `participants[].team` | `reference -> teams` | Si | Equipo participante del torneo. |
| `participants[].status` | `string` | Si | Estado del participante. Valores: `active`, `replaced`, `withdrawn`. |
| `participants[].activeFromMatchday` | `number` | No | Fecha desde la cual el equipo cuenta como participante activo. |
| `participants[].activeUntilMatchday` | `number` | No | Fecha hasta la cual el equipo cuenta como participante activo. |
| `participants[].notes` | `text` | No | Nota interna para reemplazos, retiros u otros ajustes. |

Uso en web:

- Query principal: `TOURNAMENT_QUERY`
- Modelo de dominio: `Tournament`
- La web busca el primer torneo con `active == true`.
- La tabla sale del unico documento `standingsSnapshots` publicado para el torneo activo, preferentemente con ID deterministico `standings-snapshot-{tournamentId}-current`.
- Si no hay tabla publicada, la web no arma una tabla desde `tournaments`: espera que exista `standingsState` y que la Function genere el documento publicado.
- La tabla publicada conserva las mismas estadisticas editables (`wins`, `draws`, `losses`, `goalsFor`, `goalsAgainst`) y suma solo `position` y `previousPosition` por fila. Mentira FC se agrega automaticamente con esa misma forma de estadisticas.
- La web deriva `played`, `points`, `goalDiff`, el movimiento visible y `type` (`primaryPrize`, `secondaryPrize`, `normal`) desde la tabla publicada; esos valores derivados no se guardan en Sanity.
- `participants` no se carga en la web publica: funciona como lista editorial oficial para validar la carga de `standingsState`.

Relaciones actuales:

- `tournaments.organization -> organizations`
- `tournaments.participants[].team -> teams`
- `standingsState.tournament -> tournaments`
- `standingsSnapshots.tournament -> tournaments`
- `games.tournament -> tournaments`

Relaciones faltantes/proximas:

- No agregar mas campos por ahora. La tabla editorial vive en `standingsState` y la lista oficial de equipos vive en `tournaments.participants`.

## `standingsState`

Representa la tabla actual editable de un torneo. Es el documento que se modifica fecha a fecha.

Schema: `studio/schemas/standingsState.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `tournament` | `reference -> tournaments` | Si | Torneo al que pertenece la tabla actual. Debe existir un solo documento por torneo. |
| `matchdayNumber` | `number` | Si | Numero explicito de fecha que se usara para generar el snapshot. |
| `label` | `string` | No | Etiqueta visible, por ejemplo `Fecha 7`. |
| `snapshotDate` | `datetime` | Si | Fecha de actualizacion de la tabla. Tambien es el corte usado para calcular Mentira FC. No depende de `_updatedAt`. |
| `rows` | `array` | Si | Filas editables de rivales/equipos del torneo. No se carga Mentira FC. |
| `rows[].team` | `reference -> teams` | Si | Equipo de la fila. |
| `rows[].wins` | `number` | Si | Partidos ganados. |
| `rows[].draws` | `number` | Si | Partidos empatados. |
| `rows[].losses` | `number` | Si | Partidos perdidos. |
| `rows[].goalsFor` | `number` | Si | Goles a favor. |
| `rows[].goalsAgainst` | `number` | Si | Goles en contra. |

Uso en backend:

- `sync-standings-snapshot` escucha creaciones y actualizaciones publicadas de `standingsState`.
- La Function valida que todas las filas pertenezcan a `tournaments.participants` activos para esa fecha.
- La Function rechaza la generacion del snapshot si falta un participante activo, sobra un equipo, hay duplicados o se cargo Mentira FC manualmente.
- La Function calcula Mentira FC desde `games` finalizados del torneo con `date < snapshotDate`, ordena la tabla y guarda `position` y `previousPosition`.
- La Function escribe un unico documento publicado con ID deterministico por torneo: `standings-snapshot-{tournamentId}-current`.
- Si se publica sin cambiar `matchdayNumber`, la Function recalcula estadisticas y posiciones pero conserva la `previousPosition` ya guardada en cada fila.
- Si se publica cambiando `matchdayNumber`, la Function toma la `position` publicada de la jornada anterior y la guarda como nueva `previousPosition` antes de escribir la posicion actual.
- Si no existe tabla publicada y todas las filas estan en cero, la Function ordena alfabeticamente y guarda esa posicion como base anterior (`previousPosition`) para que la primera fecha real pueda comparar contra una posicion previa.

Relaciones actuales:

- `standingsState.tournament -> tournaments`
- `standingsState.rows[].team -> teams`

## `standingsSnapshots`

Representa la tabla de posiciones publicada que consume la web. Hay un solo documento publicado por torneo; la posicion anterior se guarda dentro de cada fila.

Schema: `studio/schemas/standingsSnapshots.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `tournament` | `reference -> tournaments` | Si | Torneo al que pertenece la tabla generada. |
| `matchdayNumber` | `number` | Si | Numero explicito de fecha visible y editorial. No se usa para conservar historial largo. |
| `label` | `string` | No | Etiqueta visible, por ejemplo `Fecha 7`. |
| `snapshotDate` | `datetime` | Si | Fecha de actualizacion de la tabla y corte unico usado para calcular Mentira FC. No depende de `_updatedAt`. |
| `rows` | `array` | Si | Filas generadas automaticamente con las mismas estadisticas del editable, mas posiciones. |
| `rows[].team` | `reference -> teams` | Si | Equipo de la fila. |
| `rows[].wins` | `number` | Si | Partidos ganados. |
| `rows[].draws` | `number` | Si | Partidos empatados. |
| `rows[].losses` | `number` | Si | Partidos perdidos. |
| `rows[].goalsFor` | `number` | Si | Goles a favor. |
| `rows[].goalsAgainst` | `number` | Si | Goles en contra. |
| `rows[].position` | `number` | Si | Posicion calculada. |
| `rows[].previousPosition` | `number` | No | Posicion anterior guardada para esa fila. Se actualiza solo al avanzar de jornada. |

Uso en web:

- `TOURNAMENT_QUERY` trae una sola tabla publicada del torneo activo; no usa `snapshotRole`.
- La tabla publicada arma la tabla actual; la web no recalcula las posiciones, pero deriva `played`, `points`, `goalDiff` y movimiento para mostrar.
- Si falta tabla publicada, la web muestra el estado vacio/error existente en vez de reconstruir una tabla desde `tournaments`.
- Mentira FC no se carga manualmente en `standingsState.rows`: se calcula desde `games` finalizados del torneo con `date < snapshotDate`.
- No hay historial largo: por torneo deben quedar un `standingsState` editable y un `standingsSnapshots` read-only/publicado. Al publicar, la Function elimina otros `standingsSnapshots` del mismo torneo de forma controlada.
- Si la publicacion mantiene el mismo `matchdayNumber`, se actualizan estadisticas y posicion actual sin cambiar `rows[].previousPosition`.
- Si la publicacion avanza de jornada, la Function toma la ultima `rows[].position` publicada y la guarda como nueva `rows[].previousPosition`. La web calcula despues el movimiento visible.

Relaciones actuales:

- `standingsSnapshots.tournament -> tournaments`
- `standingsSnapshots.rows[].team -> teams`

## `organizations`

Representa una organizacion que administra o identifica un torneo.

Schema: `studio/schemas/organizations.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `name` | `string` | Si | Nombre de la organizacion. |
| `logo` | `image` | No | Logo de la organizacion, con hotspot. |
| `primaryColor` | `color` | No | Color principal asociado a la organizacion/torneo. Sin alpha. |

Uso en web:

- Se consume a traves de `tournaments`.
- Aporta nombre, logo y color al torneo activo.

Relaciones actuales:

- `tournaments.organization -> organizations`

Relaciones faltantes/proximas:

- No agregar mas campos por ahora. El modelo actual queda tal cual.

## `footerSettings`

Representa la configuracion publica editable del footer. No incluye el nombre del club ni controles operativos.

Schema: `studio/schemas/footerSettings.schema.js`

Campos:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---:|---|
| `contactEmail` | `email` | Si | Email publico de contacto del club. |
| `socials` | `array` | No | Redes sociales ordenables con `label`, `platform` y `url`. |
| `links` | `array` | No | Links auxiliares del footer con `label` y `url`. |
| `sponsors` | `array` | No | Sponsors ordenables con `name`, `url`, `logo`, `logoUrl` alternativo y `logoAlt`. |

Uso en web:

- Query principal: `FOOTER_SETTINGS_QUERY`
- Modelo de dominio: `FooterSettings`
- El footer usa fallback local si Sanity no responde o falta el singleton.
- Sanity no guarda feature flags, mantenimiento, auth, usuarios, roles, permisos, metricas ni audit log.

Relaciones actuales:

- No tiene referencias obligatorias a otros documentos.

## Relaciones actuales

```mermaid
erDiagram
  PLAYERS ||--o{ EVENTS : "player"
  GAMES ||--o{ EVENTS : "game"
  GAMES ||--o{ GALLERIES : "gallery"
  TEAMS ||--o{ GAMES : "rival"
  TOURNAMENTS ||--o{ GAMES : "tournament"
  TOURNAMENTS ||--o{ TOURNAMENT_PARTICIPANTS : "participants"
  TEAMS ||--o{ TOURNAMENT_PARTICIPANTS : "team"
  TOURNAMENTS ||--o{ STANDINGS_STATE : "current standings"
  TEAMS ||--o{ STANDINGS_STATE_ROWS : "team"
  STANDINGS_STATE ||--o{ STANDINGS_STATE_ROWS : "rows"
  TOURNAMENTS ||--o{ STANDINGS_SNAPSHOTS : "standings snapshots"
  ORGANIZATIONS ||--o{ TOURNAMENTS : "organization"
  TEAMS ||--o{ STANDINGS_SNAPSHOT_ROWS : "team"
  STANDINGS_SNAPSHOTS ||--o{ STANDINGS_SNAPSHOT_ROWS : "rows"
```

Notas:

- `STANDINGS_SNAPSHOT_ROWS` no es un documento independiente. Es un objeto embebido dentro de `standingsSnapshots.rows`.
- `STANDINGS_STATE_ROWS` no es un documento independiente. Es un objeto embebido dentro de `standingsState.rows`.
- `TOURNAMENT_PARTICIPANTS` no es un documento independiente. Es un objeto embebido dentro de `tournaments.participants`.
- `news` no esta relacionado con otros documentos en el modelo actual.
- `teams.isMain` funciona como marca logica para identificar a Mentira FC dentro de calculos y tablas.

## Relaciones faltantes para proximas funciones

Estas relaciones y modelos no existen hoy en Sanity. Quedan documentados como pendientes/proximos segun lo hablado.

| Modelo o necesidad | Cambio propuesto | Motivo |
|---|---|---|
| `players` | Agregar atributos, mapa de posiciones, redes sociales y premios internos. | Enriquecer el perfil publico del jugador. |
| `players` / `games` | Mantener partidos jugados derivados desde `games.playedPlayers`. | Evitar cargar partidos jugados manualmente y usar el partido finalizado como fuente real. |
| `news` | Relacionar noticias con `players`, `staff`, `games`, `tournaments`, etc. | Permitir contenido relacionado y contexto deportivo dentro de cada noticia. |
| `news` / `usuarios` | Votaciones publicas (reacciones ya en Supabase). Comentarios implementados en Supabase (ver abajo). | Habilitar participacion de usuarios en el sitio. |
| `staff` | Agregar redes sociales. | Enriquecer el perfil publico del staff. |
| `games` | Sin convocatoria. Mantener carga liviana con `playedPlayers` solo al finalizar. | Evita sobre-modelar el flujo de club de amigos y mantiene estadisticas desde partidos reales. |
| `events` | Agregar asistencia en eventos de gol (`assist -> players`). | Permite registrar quien asistio y calcular estadisticas de asistencias. |
| `teams` | Sin cambios previstos. | El modelo actual esta bien como esta. |
| `tournaments` / `standingsState` / `standingsSnapshots` | Mantener `standingsState` como unica fuente editorial de tablas y `tournaments.participants` como lista oficial de equipos. | Dejar una sola carga manual para tablas con memoria automatica y evitar equipos incorrectos. |
| `organizations` | Sin cambios previstos. | El modelo actual queda tal cual. |
| `usuarios` | Crear modelo/sistema de usuarios con login, pagina de usuario y roles `admin`, `editor`, `user`. | Base para perfiles, permisos y participacion. |
| `usuarios` | Permitir comentar noticias, participar en votaciones y convertirse en socio con metodo de pago. | Agregar comunidad, membresia y monetizacion. |

## Modelo de dominio en la web

La web adapta los documentos de Sanity a modelos propios:

| Sanity | Dominio web | Archivo |
|---|---|---|
| `players` | `Player`, `PlayerWithGoals` | `web/src/types/models.ts` |
| `staff` | `StaffMember` | `web/src/types/models.ts` |
| `news` | `NewsItem` | `web/src/types/models.ts` |
| `galleries` | `GalleryItem`, `GalleryImage` | `web/src/types/models.ts` |
| `games` | `Game`, `GameResult` | `web/src/types/models.ts` |
| `events` | `MatchEvent`, `GoalEvent` | `web/src/types/models.ts` |
| `teams` | `TeamRef` | `web/src/types/models.ts` |
| `tournaments` / `standingsSnapshots` | `Tournament`, `StandingsSnapshot`, `StandingsRow` | `web/src/types/models.ts` |

La capa de dominio calcula datos derivados:

- Goles por jugador desde `games.events`.
- Partidos con goles por jugador.
- Puntos de tabla: `wins * 3 + draws`.
- Partidos jugados de filas manuales: `wins + draws + losses`.
- Diferencia de gol: `goalsFor - goalsAgainst`.
- Posicion de tabla, movimiento contra la fecha anterior y tipo de premio segun `primaryPrizeSlots` y `secondaryPrizeSlots`.

## Supabase UGC (comentarios en noticias)

Los comentarios **no** viven en Sanity. Se almacenan en Postgres (Supabase) y referencian noticias publicadas por `news_id` (= Sanity `_id` publicado, sin prefijo `drafts.`).

| Tabla | Proposito | RLS / acceso |
|---|---|---|
| `public.news_comments` | Cuerpo del comentario, autor, soft-delete (`deletion_kind`: `self` \| `moderator`) | Lectura publica de filas no borradas; escritura `authenticated` activo |
| `public.comment_reports` | Reportes por usuario (`reason`, `status`: `open` \| `dismissed` \| `actioned`) | Insert propio; lectura propia o moderador+ |

Funciones helper SQL: `private.is_active_user()`, `private.user_has_permission(text)`, `private.is_moderator_or_above()`.

API Vercel (`/api/comments`, `/api/comments/:id`, reportes y moderacion) valida noticia en Sanity y permisos app; RLS sigue siendo la barrera final.

SQL de reconciliacion versionado en este checkout: `docs/supabase-rls-hardening.sql`.

Modelos web: `web/src/types/comments.ts`, cliente `web/src/data/comments.ts`.

## Supabase admin operativo

El panel `/admin` usa Supabase para operacion, seguridad y trazabilidad. Sanity no participa en estas decisiones.

| Tabla / servicio | Proposito | Acceso esperado |
|---|---|---|
| Supabase Auth | Identidad, sesiones, login, email y reset de contraseña. | Validado por APIs Vercel con Bearer token. |
| `public.profiles` | Nombre y apellido de usuarios. | RLS existente; admin escribe via API server-side. |
| `private.user_accounts` | Rol asignado e `is_active`. | Autoridad operativa de roles y suspension. |
| `private.role_permission_overrides` | Overrides de permisos por rol, si se necesitan. | Solo service role/API admin. |
| `private.feature_flags` | Flags operativas del sitio. | Solo service role/API admin. |
| `private.app_runtime_settings` | Singleton de modo mantenimiento. | Lectura publica reducida via `/api/admin/maintenance?public=1`; escritura admin. |
| `private.audit_log` | Registro append-only de acciones sensibles. | Solo service role/API admin. |
| `private.rate_limit_events` | Eventos de rate limit con identificadores hasheados. | Solo RPC service-role cuando `SUPABASE_RATE_LIMIT_STORE=supabase`. |

SQL versionado/reconciliado en este checkout:

El schema `private` no se expone al Data API. Las APIs server-side del admin acceden a estas tablas mediante RPCs `public.admin_*` ejecutables solo por `service_role`.

Las rutas `/api/admin/*` que leen o escriben tablas operativas requieren `SUPABASE_SERVICE_ROLE_KEY`
en el entorno server-side local y de Vercel. Sin esa variable, el panel muestra el estado de error
operativo aunque el login y las pantallas no-Supabase funcionen.

Las rutas `/api/comments`, `/api/reactions` y `/api/admin/[resource]` usan rate limit en memoria por defecto.
Si se aplica `docs/supabase-rls-hardening.sql` y se configura `SUPABASE_RATE_LIMIT_STORE=supabase`,
esas APIs pasan a usar el RPC service-role-only `public.admin_consume_rate_limit` y la tabla
`private.rate_limit_events` para compartir los contadores entre instancias.

Regla de fuente de verdad: Sanity = contenido publico del footer; Supabase = operacion, seguridad, comunidad y trazabilidad; Vercel = analytics/performance.

## Observaciones tecnicas

- Hay diferencias entre campos editoriales y campos de consumo web. Ejemplo: `photo` se proyecta como `imageUrl`; `rival.logo` se proyecta como `logoUrl`.
- `games.result` solo existe cuando el partido esta finalizado; la web conserva `null` para partidos por jugar y no normaliza marcadores faltantes a `0`.
- `events.player` no es requerido en Sanity, por eso la web permite eventos sin jugador asociado.
- `standingsState.rows` es manual para rivales/equipos del torneo, pero Mentira FC se inserta automaticamente con estadisticas calculadas desde partidos finalizados con `date < snapshotDate`.
- `standingsState.rows` solo debe contener equipos activos de `tournaments.participants` para esa fecha.
- `standingsSnapshots.rows` es generado automaticamente por Sanity Functions. No hay historial largo: la posicion anterior se conserva en cada fila publicada, no en otro documento.
- Si el torneo cambia de participantes, se marca el equipo saliente como `replaced` o `withdrawn` con `activeUntilMatchday`, y se agrega el nuevo equipo con `activeFromMatchday`.
- El texto de algunos titles del Studio aparece con problemas de encoding en los archivos actuales, pero eso no cambia la forma del modelo.
