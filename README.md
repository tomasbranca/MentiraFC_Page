# Mentira FC — Plataforma Web + CMS Headless

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Sitio institucional ficticio de un club de fútbol, construido con arquitectura modular y CMS desacoplado.**

</div>

---

## 1) Descripción general

**Mentira FC** es un proyecto full front-end + CMS que simula la presencia digital de un club de fútbol. Está orientado a una implementación profesional: componentes reutilizables, separación por capas, tipado fuerte y estrategia de carga de datos para un primer render eficiente.

El repositorio está organizado como un **monorepo simple con dos aplicaciones**:

- `web/`: SPA pública (React + Vite + TypeScript + Tailwind + React Query).
- `studio/`: panel editorial (Sanity Studio) para administrar contenido estructurado.

---

## 2) Objetivos del proyecto

- Diseñar una experiencia web con identidad institucional sólida.
- Mantener una base de código escalable y mantenible.
- Desacoplar completamente presentación y contenido mediante Headless CMS.
- Facilitar evolución por módulos (noticias, plantel, tabla, historial, etc.).
- Sostener calidad técnica con linting, type-checking, tests y build verificable.

---

## 3) Arquitectura y organización

### 3.1 Estructura del repositorio

```text
.
├── README.md
├── package.json           # scripts raíz para orquestar web + studio
├── web/                   # aplicación pública
└── studio/                # Sanity Studio
```

### 3.2 Organización principal de `web/src`

```text
web/src/
├── domain/                # lógica de negocio pura (sin UI)
├── data/                  # acceso/transformación de datos (Sanity + mappers)
├── presentation/          # páginas, features, componentes, layout, hooks, contexto
├── lib/                   # utilidades transversales (query client, performance, errores)
├── types/                 # modelos y tipados compartidos
└── App.tsx / main.tsx
```

### 3.3 Separación por capas

- **Domain**: reglas de negocio y cálculos (ej. estadísticas/tablas).
- **Data**: servicios, queries y adapters para hablar con Sanity y normalizar respuesta.
- **Presentation**: renderizado de UI, navegación, interacción y composición de features.

Esta división reduce acoplamiento, facilita pruebas unitarias y permite evolucionar UI y datos de forma independiente.

---

## 4) Stack tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| UI | React 19 | Renderizado declarativo basado en componentes |
| Lenguaje | TypeScript | Tipado estático y mayor seguridad en refactors |
| Build/Dev Server | Vite | DX rápida, build optimizado |
| Estilos | Tailwind CSS 4 | Diseño utility-first consistente |
| Datos cliente | TanStack React Query | Cache, sincronización y estado server-state |
| CMS | Sanity Studio v5 + Sanity Client | Edición y consumo de contenido headless |
| Routing | React Router 7 | Navegación SPA |
| Testing | Vitest | pruebas unitarias |
| Calidad | ESLint + `tsc --noEmit` | linting y validación de tipos |

---

## 5) Módulos funcionales (web)

La SPA pública contiene secciones orientadas a producto real:

- **Home**: portada, widgets de juego, tabla y noticias destacadas.
- **Noticias**: listado, grillas y detalle con renderizado de contenido rico.
- **Plantel**: vista de jugadores y detalle individual.
- **Tabla / Historial**: visualización de información deportiva estructurada.
- **Admin (página técnica)**: utilidades internas para soporte de datos/flujos.

---

## 6) Requisitos

- **Node.js** 20+ recomendado.
- **pnpm** 10.34.x recomendado, gestionado desde `packageManager`.
- Acceso a proyecto/dataset de Sanity para contenido real.

---

## 7) Instalación

Desde la raíz del repositorio:

```bash
pnpm install
```

Este comando instala dependencias de ambas apps (`web` y `studio`) desde el workspace root.

---

## 8) Ejecución en desarrollo

### 8.1 Levantar todo el entorno (web + studio)

```bash
pnpm dev
```

### 8.2 Levantar servicios individualmente

```bash
pnpm dev:web
pnpm dev:studio
```

---

## 9) Scripts disponibles

### 9.1 Scripts en raíz

- `pnpm dev` → ejecuta `web` y `studio` en paralelo.
- `pnpm dev:web` → inicia sólo la app pública.
- `pnpm dev:studio` → inicia sólo Sanity Studio.
- `pnpm install` → instala dependencias de ambos proyectos.

### 9.2 Scripts de calidad desde la raíz

- `pnpm check:web` → pipeline completo de `web`.
- `pnpm check:studio` → pipeline completo de `studio`.
- `pnpm check` → ejecuta ambos checks en orden.

### 9.3 Scripts en `web/`

- `pnpm dev` → servidor local Vite.
- `pnpm lint` → ESLint.
- `pnpm typecheck` → validación de tipos (`tsc --noEmit`).
- `pnpm test` → Vitest (`run`).
- `pnpm build` → build de producción.
- `pnpm check` → pipeline completo (`lint + typecheck + test + build`).

### 9.4 Scripts en `studio/`

- `pnpm dev` → Sanity Studio en desarrollo.
- `pnpm lint` → ESLint.
- `pnpm build` → build de Studio.
- `pnpm run deploy` → despliegue de Studio.
- `pnpm run deploy-graphql` → despliegue del esquema GraphQL.
- `pnpm check` → lint + tests unitarios de Functions + build.

---

## 10) Modelo de contenido (Sanity)

En `studio/schemas/` se definen tipos para soportar el producto:

- Noticias
- Jugadores
- Equipos
- Torneos
- Partidos
- Eventos
- Organizaciones

Estos esquemas alimentan los servicios y adapters de `web/src/data/sanity`.

---

## 11) Calidad y flujo recomendado

Antes de abrir PR:

1. Ejecutar checks de `web`:
   ```bash
   pnpm check:web
   ```
2. Ejecutar checks de `studio`:
   ```bash
   pnpm check:studio
   ```
3. Verificar manualmente navegación principal y estados vacíos/error.

---

## 12) Convenciones de desarrollo

- Priorizar componentes y funciones pequeñas con responsabilidad única.
- Evitar mezclar lógica de negocio con renderizado.
- Centralizar acceso a datos en la capa `data`.
- Mantener tipados explícitos en adaptadores y modelos compartidos.
- Documentar decisiones técnicas relevantes en PRs.

---

## 13) Roadmap sugerido

- Tests de integración de features críticas (news, roster, home widgets).
- Métricas de performance automatizadas en CI (Lighthouse/Bundle budgets).
- Estrategia de revalidación/caché para contenido editorial frecuente.
- Internacionalización (i18n) y mejoras de accesibilidad (a11y).
- Hardenización SEO técnico (metadatos dinámicos, OG por noticia, sitemap).

---

## 14) Licencia

Proyecto interno/demostrativo de uso educativo y de portfolio.
