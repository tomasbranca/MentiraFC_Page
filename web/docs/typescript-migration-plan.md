# Migración progresiva de React (JS) a TypeScript

## Estado actual (actualizado)
- ✅ **No quedan archivos `.js/.jsx` en `src/`**: toda la base está en `.ts/.tsx`.
- ✅ `src/domain/stats` migrado a TypeScript.
- ✅ `src/data` migrado a TypeScript (fetchers, adapters y services de Sanity).
- ✅ Núcleo de app migrado (`main`, `App`, `GameContext`, `GameProvider`, `useGame`, `useFetchData`, `errorLogger`, `imageService`).
- ✅ `presentation/hooks`, `presentation/utils`, `presentation/pages`, `presentation/features`, `presentation/components`, `presentation/layout` en TypeScript.
- ✅ Build, tests y type-check en verde.

## Nota importante de esta etapa
- Para completar la migración total sin bloquear entregas, parte de `presentation/*` se marcó temporalmente con `// @ts-nocheck`.
- Esto permite tener **100% archivos TS/TSX** y seguir entregando, mientras se tipa en profundidad por módulos.

## Reglas que se mantienen
- **No tipar UI/dominio contra documento crudo de Sanity.**
- El shape de Sanity queda encapsulado y parcial en adapters/services.
- Hacia arriba solo se exponen tipos de dominio (`Game`, `Player`, `MatchEvent`, etc.).

## Próxima fase (endurecimiento)
1. Remover `@ts-nocheck` por lotes (pages/components críticos primero).
2. Tipar props y estados locales de presentación con interfaces reutilizables.
3. Agregar tests de adapters para casos de null/faltantes desde Sanity.
4. Activar reglas de lint TS (`@typescript-eslint`) para reforzar calidad.
