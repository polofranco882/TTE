# Guía de Despliegue en DigitalOcean - TTE

Esta guía detalla los pasos para poner en producción el sistema TTE (Frontend React + Backend Node/Express + PostgreSQL) en la nube de DigitalOcean.

---

## 1. Preparación del Entorno

### Backend (.env)
Asegúrate de tener un archivo `.env` en la carpeta `backend` con las credenciales de producción:
```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=tu_secreto_super_seguro
OPENAI_API_KEY=tu_llave
GOOGLE_GENAI_KEY=tu_llave
```

### Frontend
El frontend se construye como archivos estáticos. Asegúrate de que las llamadas a la API apunten a la URL de producción (puedes usar variables de entorno de Vite `VITE_API_URL`).

---

## Opción A: DigitalOcean App Platform (Recomendada por Simplicidad)

Es un servicio PaaS que gestiona todo por ti (SSL, Escalado, CI/CD).

1.  **Conectar GitHub**: Sube tu código a un repositorio privado.
2.  **Crear App**: En el panel de DO, selecciona "Create App" y elige tu repositorio.
3.  **Configurar Componentes**:
    *   **Backend**: Selecciónalo como "Web Service", puerto `5000`, comando `npm start`.
    *   **Frontend**: Selecciónalo como "Static Site", directorio de build `frontend/dist`, comando de build `npm run build`.
4.  **Base de Datos**: Puedes añadir una "Managed Database" de PostgreSQL directamente en la App.
5.  **Variables**: Sube todas las variables del `.env` a la sección "Environment Variables" de cada componente.

---

## Opción B: Docker en un Droplet (Mejor Rendimiento/Precio)

Para mayor control y menor costo, usa un Droplet con Docker Compose.

### 1. Dockerfiles (Crear estos archivos)

**backend/Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g ts-node typescript
EXPOSE 5000
CMD ["npm", "start"]
```

**frontend/Dockerfile**:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. docker-compose.yml (En la raíz del proyecto)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tte_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/tte_db
    depends_on:
      - db

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
      
volumes:
  postgres_data:
```

### 3. Pasos en el Droplet (Linux)

1.  **Crear Droplet**: Elige "Marketplace" -> "Docker on Ubuntu".
2.  **Clonar Proyecto**: `git clone <tu-repo>`
3.  **Lanzar**: `docker-compose up -d --build`
4.  **SSL/Dominio**: Usa Nginx (instalado en el host o en un contenedor) y **Certbot** para HTTPS gratuito.

---

## Resumen de Costos Estimados

| Servicio | Configuración Mínima | Costo Mensual |
| :--- | :--- | :--- |
| **Droplet (Basic)** | 1 GB RAM / 1 vCPU | $6.00 USD |
| **App Platform** | 1 Web Service + 1 Static | ~$10.00 USD |
| **Managed DB** | PostgreSQL Basic | $15.00 USD |

> [!TIP]
> Para un proyecto que inicia, un **Droplet de $6 USD** con Docker Compose es la opción más eficiente en costo y rendimiento.
