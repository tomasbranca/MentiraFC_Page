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
- **npm** 10+ recomendado.
- Acceso a proyecto/dataset de Sanity para contenido real.

---

## 7) Instalación

Desde la raíz del repositorio:

```bash
npm install
```

Este comando instala dependencias de ambas apps (`web` y `studio`) usando scripts del root.

Si necesitás hacerlo por separado:

```bash
npm run install:web
npm run install:studio
```

---

## 8) Ejecución en desarrollo

### 8.1 Levantar todo el entorno (web + studio)

```bash
npm run dev
```

### 8.2 Levantar servicios individualmente

```bash
npm run dev:web
npm run dev:studio
```

---

## 9) Variables de entorno

Crear `web/.env` con los valores de Sanity:

```bash
VITE_SANITY_PROJECT_ID=tu_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2023-01-01
```

> Recomendación: no versionar secretos y mantener valores sensibles fuera del repositorio.

---

## 10) Scripts disponibles

### 10.1 Scripts en raíz

- `npm run dev` → ejecuta `web` y `studio` en paralelo.
- `npm run dev:web` → inicia sólo la app pública.
- `npm run dev:studio` → inicia sólo Sanity Studio.
- `npm run install` → instala dependencias de ambos proyectos.

### 10.2 Scripts en `web/`

- `npm run dev` → servidor local Vite.
- `npm run lint` → ESLint.
- `npm run typecheck` → validación de tipos (`tsc --noEmit`).
- `npm run test` → Vitest (`run`).
- `npm run build` → build de producción.
- `npm run check` → pipeline completo (`lint + typecheck + test + build`).

### 10.3 Scripts en `studio/`

- `npm run dev` → Sanity Studio en desarrollo.
- `npm run lint` → ESLint.
- `npm run build` → build de Studio.
- `npm run deploy` → despliegue de Studio.
- `npm run deploy-graphql` → despliegue del esquema GraphQL.
- `npm run check` → lint + build.

---

## 11) Modelo de contenido (Sanity)

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

## 12) Calidad y flujo recomendado

Antes de abrir PR:

1. Ejecutar checks de `web`:
   ```bash
   cd web && npm run check
   ```
2. Ejecutar checks de `studio`:
   ```bash
   cd studio && npm run check
   ```
3. Verificar manualmente navegación principal y estados vacíos/error.

---

## 13) Convenciones de desarrollo

- Priorizar componentes y funciones pequeñas con responsabilidad única.
- Evitar mezclar lógica de negocio con renderizado.
- Centralizar acceso a datos en la capa `data`.
- Mantener tipados explícitos en adaptadores y modelos compartidos.
- Documentar decisiones técnicas relevantes en PRs.

---

## 14) Roadmap sugerido

- Tests de integración de features críticas (news, roster, home widgets).
- Métricas de performance automatizadas en CI (Lighthouse/Bundle budgets).
- Estrategia de revalidación/caché para contenido editorial frecuente.
- Internacionalización (i18n) y mejoras de accesibilidad (a11y).
- Hardenización SEO técnico (metadatos dinámicos, OG por noticia, sitemap).

---

## 15) Licencia

Proyecto interno/demostrativo de uso educativo y de portfolio.
