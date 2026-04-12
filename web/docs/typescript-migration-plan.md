# Migración progresiva de React (JS) a TypeScript

## Objetivo
Migrar de forma incremental sin congelar desarrollo ni acoplar el dominio al shape crudo de Sanity.

## Orden recomendado
1. **Base TypeScript y check no-bloqueante**
   - Mantener `allowJs: true` y `noEmit: true`.
   - Añadir tipos de dominio compartidos (`Game`, `Player`, `MatchEvent`).
2. **Dominio primero (`src/domain/stats`)**
   - Tipar funciones puras con JSDoc + tipos compartidos.
   - Asegurar contratos de entrada/salida con tests existentes.
3. **Data/fetchers después (`src/data`)**
   - Definir contrato de salida de fetchers en términos de dominio.
   - Encapsular shape de Sanity en adapters.
4. **Adapters de Sanity**
   - Traducir `Sanity*` -> `Domain*`.
   - Validar defaults para campos faltantes.
5. **UI y hooks**
   - Migrar primero hooks de datos, luego componentes críticos.
6. **Renombre gradual `.js` -> `.ts/.tsx`**
   - Por carpeta o feature, nunca todo de golpe.

## Regla clave con Sanity
- **No tipar UI/domino con el documento crudo de Sanity.**
- Crear tipos de entrada mínimos (`SanityGameSource`) solo dentro de data/adapters.
- Exponer hacia arriba únicamente tipos de dominio (`Game`, `Player`, `MatchEvent`).

## Checklist sugerido
- [ ] Tipar `domain/stats` completo.
- [ ] Tipar `data/*` fetchers con retorno de dominio.
- [ ] Tipar adapters de `sanity` con normalización segura.
- [ ] Activar `checkJs` para carpetas objetivo.
- [ ] Migrar hooks de páginas principales (`Home`, `Table`, `Record`).
- [ ] Migrar componentes reutilizables.
