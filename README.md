# CoreSys

Sistema interno de operaciones IT para LINHER, planteado como MAP (Minimum Awesome Product).

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Styling: CSS puro con Design System First

## Estructura

- `frontend/`
- `backend/`
- `database/`

## Organización base

- frontend con esqueleto inspirado en Move: `assets/`, `components/`, `context/`, `hooks/`, `pages/`, `services/`, `utils/`
- metadata y navegación del frontend en `frontend/src/utils/app.js`
- configuración base de RBAC y auditoría en `backend/src/config/`

## Ejecutar en local

```bash
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

Healthcheck backend: `http://localhost:4000/api/health`

## Scripts raíz

- `npm run install:all`: instala raíz, `backend` y `frontend`
- `npm run install-all`: alias compatible
- `npm run dev`: backend + frontend
- `npm run backend`: solo backend
- `npm run frontend`: solo frontend
- `npm run build`: build del frontend
- `npm run preview`: preview del frontend
- `npm run start`: inicia backend sin watch

## Visualizar la UI del sistema

- `http://localhost:5173/system-ui`

## Base visual

- `frontend/src/design-tokens.css`: tokens globales y tema claro/oscuro
- `frontend/src/index.css`: estilos globales, shell, primitives y vistas base
- `frontend/src/pages/SystemUiPage.jsx`: referencia interna del sistema visual
