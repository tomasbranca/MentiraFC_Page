# Migración progresiva de React (JS) a TypeScript

## Estado actual (actualizado)
- ✅ Tipos de dominio compartidos creados (`Game`, `Player`, `MatchEvent`, etc.).
- ✅ `src/domain/stats` migrado a TypeScript.
- ✅ `src/data` migrado a TypeScript (fetchers, adapters y services de Sanity).
- ✅ Núcleo de app migrado a TypeScript (`main`, `App`, `GameContext`, `GameProvider`, `useGame`, `useFetchData`, `errorLogger`, `imageService`).
- ✅ Build, tests y type-check en verde.

## Recomendaciones aplicadas
1. **Base TypeScript no bloqueante**
   - Se mantiene `allowJs: true` + `noEmit: true` para convivir con JS de presentación.
2. **Dominio + data primero**
   - Contratos de entrada/salida tipados en capa estable.
3. **Sanity encapsulado**
   - Traducción `Sanity* -> Domain*` en adapters, no en UI.
4. **Tooling mínimo de calidad**
   - Script `npm run typecheck` agregado para CI local.
- ✅ Contratos de salida desacoplados del shape crudo de Sanity.
- ✅ Build, tests y type-check en verde.

## Orden recomendado aplicado
1. **Base TypeScript no bloqueante**
   - Se mantuvo `allowJs: true` + `noEmit: true` para convivir con JS en presentación.
2. **Dominio primero (`src/domain/stats`)**
   - Funciones puras tipadas con contratos de entrada/salida.
3. **Data/fetchers después (`src/data`)**
   - Contratos de salida tipados con modelos de dominio.
4. **Adapters de Sanity**
   - Traducción `Sanity* -> Domain*` con normalización segura.

## Regla clave con Sanity
- **No tipar UI/dominio contra documento crudo de Sanity.**
- El shape de Sanity queda encapsulado y parcial en adapters/services.
- Hacia arriba solo se exponen tipos de dominio (`Game`, `Player`, `MatchEvent`, etc.).

## Próximos pasos recomendados
- Migrar gradualmente `presentation/pages` y `presentation/components` a `.ts/.tsx` por feature.
- Activar `checkJs` por carpetas migradas (primero hooks + utils, luego páginas).
- Añadir tests de adapters (casos de campos faltantes/NULL desde Sanity).
- Definir `tsconfig` por capas (ej. `tsconfig.presentation.json`) para endurecer de forma incremental.
- Migrar gradualmente `presentation/` y hooks críticos a `.ts/.tsx` por feature.
- Activar `checkJs` por carpetas de presentación a medida que se migren.
- Añadir tests de adapters (casos de campos faltantes/NULL desde Sanity).
