# Requerimientos para Producción en AWS - Sistema TTE (Book Portal)

Este documento detalla la infraestructura y configuraciones recomendadas para desplegar el sistema TTE en Amazon Web Services (AWS) con un enfoque en alto desempeño, escalabilidad y seguridad.

## 1. Arquitectura de Infraestructura

Para maximizar el rendimiento y la disponibilidad, se recomienda una arquitectura desacoplada:

### Frontend (Portal de Libros Interactivos)
*   **Servicio:** Amazon S3 + Amazon CloudFront.
*   **Razón:** El frontend es una SPA (React/Vite). Servirlo desde S3 y distribuirlo vía CloudFront (CDN) garantiza baja latencia global y descarga el servidor de backend.
*   **Configuración:** Habilitar compresión Gzip/Brotli en CloudFront y políticas de caché adecuadas para los assets estáticos.

### Backend (API Node.js/Express)
*   **Servicio:** Amazon ECS (Elastic Container Service) con Fargate.
*   **Razón:** Permite ejecutar contenedores Docker sin gestionar servidores (Serverless). Fargate escala automáticamente según la demanda de CPU/Memoria.
*   **Balanceo de Carga:** Application Load Balancer (ALB) para distribuir el tráfico entre las tareas de ECS y gestionar la terminación SSL (HTTPS).

### Base de Datos
*   **Servicio:** Amazon RDS for PostgreSQL.
*   **Clase de Instancia estimada:** `db.t4g.medium` (mínimo para producción).
*   **Razón:** Servicio administrado con backups automáticos, parches de seguridad y opción de Multi-AZ para alta disponibilidad.
*   **Almacenamiento:** SSD de uso general (gp3) para IOPS consistentes.

---

## 2. Configuración de Red y Seguridad

*   **VPC (Virtual Private Cloud):** Aislar los recursos en una red privada.
    *   **Subredes Públicas:** Para el ALB y NAT Gateways.
    *   **Subredes Privadas:** Para las tareas de ECS (Backend) y la base de Datos (RDS).
*   **Seguridad (Security Groups):**
    *   ALB: Permitir tráfico en puertos 80 y 443 desde cualquier lugar (0.0.0.0/0).
    *   ECS: Permitir tráfico solo desde el Security Group del ALB.
    *   RDS: Permitir tráfico solo desde el Security Group de ECS en el puerto 5432.
*   **Certificados:** AWS Certificate Manager (ACM) para gestionar certificados SSL gratuitos y renovación automática.
*   **Secretos:** AWS Secrets Manager para almacenar credenciales de BD, llaves de API (OpenAI/Gemini) y secretos de JWT.

---

## 3. Desempeño y Escalabilidad

*   **Auto Scaling:**
    *   Configurar políticas de escalado para ECS basadas en el uso de CPU (>70%) o número de peticiones.
*   **Caché (Opcional pero Recomendado):**
    *   **Amazon ElastiCache (Redis):** Si el sistema maneja muchas lecturas repetitivas o estados de sesión complejos, Redis mejorará drásticamente los tiempos de respuesta.
*   **Optimización de Archivos:**
    *   Debido a que el sistema maneja libros y probablemente archivos pesados (PDF/Imágenes), usar **Amazon S3** para el almacenamiento de medios con CloudFront como caché frente a S3.

---

## 4. Requerimientos de Hardware (Docker sobre Linux)

Para un "Excelente Funcionamiento" bajo carga de producción en AWS, estas son las especificaciones mínimas y recomendadas para cada componente:

### Backend (Contenedor Docker - Node.js)
*   **CPU:** Mínimo **0.5 vCPU** | Recomendado **1 vCPU** (especialmente para procesamiento de PDFs/IA).
*   **RAM:** Mínimo **1 GB** | Recomendado **2 GB**. Node.js es eficiente, pero el manejo de buffers de imágenes y libros requiere memoria estable para evitar reinicios por OOM (Out Of Memory).
*   **Disco:** **20 GB** (SSD gp3). El contenedor en sí es ligero, pero se requiere espacio para archivos temporales y logs.

### Base de Datos (RDS PostgreSQL)
*   **Instancia:** `db.t4g.medium` (procesador AWS Graviton3, altamente eficiente).
*   **vCPU:** **2 vCPU**.
*   **RAM:** **4 GB**. PostgreSQL utiliza la RAM para caché de consultas (shared buffers), lo cual es crítico para el desempeño de búsqueda en el portal de libros.
*   **Disco:** **50 GB** (SSD gp3). Escalar según el volumen de libros y datos de analítica crezca.

### Frontend (CloudFront/S3)
*   **Recursos:** No requiere servidor Linux/Docker dedicado. Al usar S3 + CloudFront, AWS gestiona el hardware, garantizando escalabilidad infinita y latencia mínima sin costo de mantenimiento de CPU/RAM por tu parte.

---

## 5. Estrategia de Despliegue (CI/CD)

*   **Pipeline:** AWS CodePipeline + AWS CodeBuild.
*   **Flujo:**
    1.  Push a la rama `main` en GitHub/CodeCommit.
    2.  CodeBuild construye la imagen Docker del backend y el build de producción del frontend.
    3.  Imagen Docker se sube a **Amazon ECR** (Elastic Container Registry).
    4.  Actualización automática del servicio ECS y sincronización del build de frontend a S3 (con invalidación de caché en CloudFront).

---

## 5. Monitoreo y Logs

*   **Amazon CloudWatch:**
    *   Logs de contenedores (Logs de Express/Node).
    *   Métricas de rendimiento (CPU, Memoria, IOPS de BD).
    *   Alarmas para notificar errores 5XX o alta latencia.
*   **AWS X-Ray (Opcional):** Para trazabilidad de peticiones y detección de cuellos de botella en la comunicación entre servicios.
