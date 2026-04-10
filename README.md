# 🟣 Mentira FC — Sitio Oficial

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<br />

**Tradición. Identidad. Ficción competitiva.**

<p>
  <em>Plataforma institucional desarrollada con arquitectura moderna, diseño profesional y gestión de contenido Headless.</em>
</p>

</div>

---

## 📌 Overview

**Mentira FC** es una aplicación web SPA (Single Page Application) que simula la identidad digital de un club de fútbol argentino tradicional.

Más que una maqueta visual, este proyecto es un ejercicio de ingeniería frontend que combina una **estética institucional sobria** con una **arquitectura de software escalable**. El objetivo es emular un producto real en producción, priorizando la optimización, la estructura de componentes y la gestión dinámica de datos.

### 🎯 Objetivos de Ingeniería

- **Identidad de Marca:** Construir una UI que transmita historia y seriedad.
- **Escalabilidad:** Arquitectura modular que permite el crecimiento sin deuda técnica.
- **Headless CMS:** Desacople total entre el frontend y la gestión de contenido.
- **Performance:** Optimización de assets y renderizado eficiente.

---

## 🧱 Stack Tecnológico

La elección de tecnologías responde a la necesidad de rendimiento, mantenibilidad y una excelente experiencia de desarrollo (DX).

| Área        | Tecnología       | Justificación                                                     |
| :---------- | :--------------- | :---------------------------------------------------------------- |
| **Core**    | `React.js`       | Biblioteca UI basada en componentes para interfaces reactivas.    |
| **Styling** | `Tailwind CSS`   | Sistema Utility-first para un diseño consistente y rápido.        |
| **Content** | `Sanity.io`      | Headless CMS para gestión estructurada de noticias y plantel.     |
| **Routing** | `React Router 7` | Gestión de navegación SPA fluida y dinámica.                      |
| **Build**   | `Vite`           | Entorno de desarrollo de próxima generación y bundler optimizado. |

---

## 🎨 Sistema de Diseño

El diseño visual busca el equilibrio entre la **institucionalidad** (colores oscuros, tipografía seria) y la **modernidad** (espaciado, micro-interacciones).

### Paleta Institucional

| Token     | Valor (Tailwind) | Hex (Aprox) | Uso                                   |
| :-------- | :--------------- | :---------- | :------------------------------------ |
| `Primary` | `violet-900`     | `#4c1d95`   | Identidad de marca, headers.          |
| `Surface` | `neutral-950`    | `#0a0a0a`   | Fondos profundos, modo oscuro.        |
| `Accent`  | `violet-50`      | `#f5f3ff`   | Texto, componentes de alto contraste. |

---

## 🏟 Estructura del Sitio

La aplicación está dividida en módulos funcionales:

- **🏠 Home:** Dashboard principal con Hero Section, Match Center y últimas novedades.
- **📰 Noticias:** Blog dinámico con paginación y renderizado de contenido enriquecido (Portable Text) desde Sanity.
- **👥 Plantel:** Grid de jugadores con fichas técnicas individuales y filtros por posición.
- **📊 Tabla & Historial:** Visualización de datos estadísticos y palmarés del club.

---

## 🛣️ Roadmap

El desarrollo sigue un enfoque iterativo. Próximas implementaciones:

- [ ] Integración con APIs deportivas reales (ej. datos simulados de liga).
- [ ] Animaciones avanzadas con Framer Motion.
- [ ] Mejoras de SEO (Open Graph, Meta Tags dinámicos).
- [ ] Testing Unitario (Vitest/Jest) y E2E (Cypress).
- [ ] Internacionalización (i18n).

---

## ⚙️ Variables de Entorno (Web)

El frontend soporta configuración de Sanity vía variables de entorno en `web/.env`:

```bash
VITE_SANITY_PROJECT_ID=jwpxrdo2
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2023-01-01
```

---

## 🧠 Filosofía de Desarrollo

Este código sigue principios de **Clean Code**:

- **Separación de responsabilidades:** Lógica de negocio separada de la UI.
- **DRY (Don't Repeat Yourself):** Abstracción de componentes reutilizables.
- **Mobile First:** Diseño adaptativo desde pantallas pequeñas hacia grandes.

---


## 🧩 Propuesta de Reorganización (sin sobre-ingeniería)

Para simplificar la evolución del frontend, se propone organizar `web/src` en tres capas claras:

- `domain/`: reglas de negocio puras y modelos.
- `data/`: acceso a datos externos (Sanity) y adaptación de respuestas.
- `presentation/`: páginas, componentes, hooks y estado de UI.

### Árbol objetivo

```text
web/src/
├─ domain/
│  ├─ stats/
│  │  ├─ playerStats.js
│  │  ├─ tournamentTable.js
│  │  └─ index.js
│  ├─ entities/
│  └─ use-cases/
├─ data/
│  ├─ cms/
│  │  └─ sanity/
│  │     ├─ client/
│  │     │  ├─ sanity.client.js
│  │     │  └─ sanity.image.js
│  │     ├─ queries/
│  │     ├─ adapters/
│  │     └─ services/
│  ├─ repositories/
│  └─ mappers/
└─ presentation/
   ├─ app/
   ├─ pages/
   ├─ features/
   ├─ components/
   ├─ layout/
   ├─ hooks/
   ├─ context/
   ├─ constants/
   └─ utils/
```

### Mapeo recomendado (actual → nuevo)

- `web/src/lib/domain/stats/*` → `web/src/domain/stats/*`
- `web/src/lib/sanity/sanity.client.js` → `web/src/data/cms/sanity/client/sanity.client.js`
- `web/src/lib/sanity/sanity.image.js` → `web/src/data/cms/sanity/client/sanity.image.js`
- `web/src/lib/sanity/queries/*` → `web/src/data/cms/sanity/queries/*`
- `web/src/lib/sanity/adapters/*` → `web/src/data/cms/sanity/adapters/*`
- `web/src/lib/sanity/services/*` → `web/src/data/cms/sanity/services/*`
- `web/src/services/imageService.js` → `web/src/data/mappers/imageService.js` (o `presentation/utils/` si sólo formatea para UI)
- `web/src/pages/*` → `web/src/presentation/pages/*`
- `web/src/features/*` → `web/src/presentation/features/*`
- `web/src/components/*` → `web/src/presentation/components/*`
- `web/src/layout/*` → `web/src/presentation/layout/*`
- `web/src/hooks/*` + hooks de página/feature → `web/src/presentation/hooks/*` (o colocalizados dentro de cada feature)
- `web/src/context/*` → `web/src/presentation/context/*`
- `web/src/constants/*` → `web/src/presentation/constants/*`
- `web/src/utils/*` → `web/src/presentation/utils/*`

### Responsabilidades por capa

- **Domain**
  - No depende de React ni de Sanity.
  - Contiene reglas, cálculos y contratos del negocio.
  - Debe ser fácilmente testeable con unit tests puros.

- **Data**
  - Sabe cómo pedir datos a fuentes externas (CMS/API).
  - Traduce datos crudos a estructuras útiles para el dominio/presentación.
  - Maneja detalles de infraestructura (cliente, queries, adapters).

- **Presentation**
  - Renderiza UI y orquesta interacción de usuario.
  - Consume servicios/repositorios de `data` y lógica de `domain`.
  - Evita lógica de negocio compleja en componentes.

### Plan de migración paso a paso

1. **Congelar estructura nueva**
   - Crear carpetas `domain/`, `data/` y `presentation/`.
   - Definir aliases de import (Vite + jsconfig/tsconfig) para evitar rutas relativas largas.

2. **Mover primero el código puro**
   - Migrar `lib/domain/stats` a `domain/stats`.
   - Ejecutar tests de stats y corregir imports.

3. **Migrar capa Sanity completa a `data`**
   - Mover cliente, queries, adapters y services respetando subcarpetas.
   - Mantener temporalmente archivos "bridge" (re-export) en rutas viejas para reducir riesgo.

4. **Reubicar servicios sueltos y utilidades de datos**
   - Analizar `services/imageService.js` y ubicarlo en `data/mappers` o `presentation/utils` según su responsabilidad real.

5. **Migrar presentación por verticales**
   - Empezar por una feature estable (ej. News): `pages`, `features`, `components`, hooks asociados.
   - Repetir por módulos (Home, Team, PlayerDetail, etc.).

6. **Eliminar puentes y limpiar deuda**
   - Una vez actualizados imports, borrar rutas antiguas (`lib/sanity`, `lib/domain`, `services`).
   - Ejecutar lint/build/tests y corregir warnings.

7. **Normalizar convención**
   - Definir regla simple: lo reusable de negocio va a `domain`; acceso a datos a `data`; UI a `presentation`.
   - Documentar 4-5 ejemplos en el repo para guiar futuras contribuciones.

> Esta propuesta evita una arquitectura enterprise pesada: no obliga DDD completo, CQRS ni capas extra; sólo ordena lo actual con límites claros.

## 👨‍💻 Autor

**Tomás Brancatisano**
<br>
_Ingeniería en Sistemas — UTN_

> "Porque la historia también se construye." — **Mentira FC**

[LinkedIn](https://www.linkedin.com/in/tomas-brancatisano/)
