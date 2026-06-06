# Paginacion de listados

Esta base evita que listados publicos, dashboard y admin carguen todos los
recursos por defecto. La migracion de pantallas debe ser gradual: primero se
crea o reutiliza un servicio paginado y despues se cambia la UI del listado.

## Tipo de respuesta

Los listados paginados devuelven `PaginatedResult<T>` desde
`web/shared/pagination.ts`:

```ts
type PaginatedResult<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string | null;
  previousCursor?: string | null;
};
```

Para Sanity y dashboard usamos `page/offset`: es simple, permite `total` con
`count(...)` y alcanza para listados editoriales donde el orden puede cambiar
sin requerir cursores compuestos. Los campos `nextCursor` y `previousCursor`
quedan en `null` para mantener una forma compatible con listados keyset como
comentarios.

## Defaults y validacion

- `DEFAULT_PAGE_LIMIT`: 20.
- `MAX_PAGE_LIMIT`: 50.
- `DEFAULT_MAX_PAGE`: 1000.
- `DEFAULT_MAX_SEARCH_LENGTH`: 80.
- `limit` se normaliza y se clampa al maximo.
- `page` debe ser entero positivo y estar dentro del rango.
- `cursor` debe usar un alfabeto acotado si una pantalla lo acepta.
- `sortBy` siempre se valida contra una whitelist por listado.
- `direction` solo acepta `asc` o `desc`.
- `search` se recorta, colapsa espacios y se rechaza si supera el maximo o trae caracteres de control.

No interpolar `search`, `slug`, `id`, `sortBy` ni filtros de usuario directo en
GROQ. Los valores dinamicos deben ir por params (`$offset`, `$end`,
`$hasSearch`, `$search`). El orden se resuelve con mapas whitelisteados de
queries, no con strings armados desde input.

## Listado vs detalle

Los listados usan modelos resumidos:

- `NewsListItem`: no trae `content`.
- `GameListItem`: no trae `events` ni `playedPlayers`.
- `GalleryListItem`: trae portada y `photoCount`, no todo `images`.

Los detalles y formularios cargan datos completos. Por ejemplo, el dashboard de
noticias mantiene `dashboardNewsByIdQuery` con `content[]`, pero el listado y la
query paginada usan una proyeccion resumida.

## Servicios disponibles

Publico/Sanity:

- `getNewsPage`
- `getGamesPage`
- `getGalleriesPage`
- La pagina publica `/historial` usa `getGamesPage` con `limit` 10,
  bootstrap `record-list` y carga el detalle completo del partido por id solo
  al abrir los goleadores.
- La pagina publica `/galeria` usa `getGalleriesPage` con `limit` 9 y
  bootstrap `gallery-list`; el detalle de galeria carga el documento completo.

Dashboard:

- `getDashboardNewsPage` en el repositorio de la API.
- `fetchDashboardNewsPage` y `dashboardNewsPageQueryOptions` en el cliente.
- `DashboardNewsList` ya usa la pagina remota de noticias con `limit` 20 y
  filtros `search`/`status` whitelisteados.
- `getDashboardMatchesPage` en el repositorio de la API.
- `fetchDashboardMatchesPage` y `dashboardMatchesPageQueryOptions` en el
  cliente.
- `DashboardMatchesList` ya usa la pagina remota de partidos con `limit` 20 y
  filtros `search`/`status`/`state`/`competition` whitelisteados. El listado no
  trae `playedPlayers` ni eventos de gol; el formulario/detalle usa
  `dashboardMatchByIdQuery` para cargar el documento completo.
- `getDashboardGalleriesPage` en el repositorio de la API.
- `fetchDashboardGalleriesPage` y `dashboardGalleriesPageQueryOptions` en el
  cliente.
- `DashboardGalleriesList` ya usa la pagina remota de galerias con `limit` 20 y
  filtros `search`/`status`/`photos` whitelisteados. El listado trae una foto de
  portada y `photoCount`; el formulario/detalle usa `dashboardGalleryByIdQuery`
  para cargar todas las fotos.
- `getDashboardTeamsPage` en el repositorio de la API.
- `fetchDashboardTeamsPage` y `dashboardTeamsPageQueryOptions` en el cliente.
- `DashboardTeamsList` ya usa la pagina remota de clubes con `limit` 20 y
  filtros `search`/`status`/`kind`/`usage` whitelisteados. El listado trae
  `logoUrl`, `logoAssetId` y conteos de referencias; el formulario/detalle usa
  `dashboardTeamByIdQuery` para cargar el documento completo.

Las funciones legacy (`getNews`, `getAllGames`, `getGalleries`,
`fetchDashboardNews`, `fetchDashboardMatches`, `fetchDashboardGalleries`,
`fetchDashboardTeams`) siguen disponibles como compatibilidad temporal mientras
se migran pantallas.

## Como crear un listado paginado

1. Definir el modelo resumido si el listado necesita menos campos que el detalle.
2. Crear una proyeccion GROQ de listado sin Portable Text completo, arrays
   pesados ni imagenes completas.
3. Crear un mapa de queries por `sortBy:direction`.
4. Parsear parametros con `parseOffsetPaginationParams` o
   `parseSanityPageOptions`.
5. Pasar `buildOffsetPaginationQueryParams(...)` a Sanity/GROQ.
6. Adaptar `items` y devolver `buildOffsetPaginatedResult(...)`.
7. En React Query, crear un `queryOptions` con key que incluya `page`, `limit`,
   `sortBy`, `direction` y `search`.

No crear una Function nueva si el recurso ya tiene una ruta existente. Para
dashboard, extender `/api/dashboard/<resource>` con parametros opt-in y mantener
la respuesta anterior sin parametros hasta que la pantalla migre.
