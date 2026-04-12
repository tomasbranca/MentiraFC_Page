# Migración progresiva de React (JS) a TypeScript

## Estado actual (actualizado)
- ✅ Tipos de dominio compartidos creados (`Game`, `Player`, `MatchEvent`, etc.).
- ✅ `src/domain/stats` migrado a TypeScript.
- ✅ `src/data` migrado a TypeScript (fetchers, adapters y services de Sanity).
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
- Migrar gradualmente `presentation/` y hooks críticos a `.ts/.tsx` por feature.
- Activar `checkJs` por carpetas de presentación a medida que se migren.
- Añadir tests de adapters (casos de campos faltantes/NULL desde Sanity).
