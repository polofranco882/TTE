# Especificación Arquitectónica y Análisis de Vacíos Funcionales (Tipo Duolingo)

Basado en el Catálogo Maestro de Componentes, este documento desarrolla las especificaciones de lo que **aún falta** a nivel funcional, de flujos, modelos de datos, estados de sistema y lógica para hacer que el producto sea escalable y go-to-market.

---

## A. Resumen de Vacíos Detectados
Al analizar la capa interactiva y pedagógica, se detecta la ausencia de las siguientes estructuras fundacionales del producto:
1. **Infraestructura de Sesión y Onboarding**: Falta Login, test de nivel, recolección de objetivos de aprendizaje.
2. **Navegación Macro**: Mapa principal de rutas (Path origin), dashboard global, selector de perfil/lenguaje.
3. **Mecanismos de Retención (Retention Loops)**: Metas diarias (Daily Goals), notificaciones push, gestión de racha salvada (Streak Freeze), tienda virtual.
4. **Estados de Extremo a Extremo (Edge Cases)**: Permisos de micrófono denegados, pérdida total de conectividad en progreso, carga perezosa (skeleton loaders), timeout de audio.
5. **Capa Lógica (Smart Engines)**: Controladores locales e híbridos para sincronización offline, trackeo granular de analíticas, nivelación de dificultad adaptativa.
6. **Modelos Base de Datos**: Ausencia de esquemas estandarizados para inyectar contenido a los componentes visuales interactivos y perfiles dinámicos.

---

## B. Componentes Faltantes o Incompletos

### 1. Nodo del Mapa de Ruta (Learning Path Node)
* **Categoría**: Estructura / Navegación Macro
* **Problema que resuelve**: El alumno no tiene una forma visual de saber dónde está en el curso global y qué sigue (ej. el camino de "piedras" de Duolingo).
* **Descripción funcional**: Botón circular en un path vertical que puede estar bloqueado, actual, o completado, con una corona o estrella si está superado en nivel legendario.
* **Objetivo pedagógico**: Visualización clara del progreso lineal. Reducir la fatiga de decisión sobre qué estudiar.
* **Inputs/Props**: `lessonId`, `status` (locked, active, completed, legendary), `icon`, `isCheckpoint`.
* **Outputs/Eventos**: `onClick` -> Dispara modal de previsualización de lección.
* **Estados**: Hover (si está activo salta), Disabled (desaturado a gris si está bloqueado), Shake (si se intenta abrir uno bloqueado).
* **Dependencias**: Datos del `ProgressEngine` del usuario.
* **Prioridad**: Crítica.
* **Reutilizable**: Sí.
* **UX/UI**: Cada 5 nodos debería haber un nodo ilustrado más grande (Checkpoint) o un cofre de regalo (Reward Node). Conecta mediante un SVG de camino sinuoso.

### 2. Tracker de Meta Diaria (Daily Goal Ring)
* **Categoría**: Gamificación / UI Global
* **Problema que resuelve**: Falta de incentivo a micro-sesiones (retención diaria).
* **Descripción funcional**: Anillo circular que se llena (ej. 15/50 XP) y destella al completarse la meta.
* **Objetivo pedagógico**: Construir el hábito a través de la gratificación visual por objetivos pequeños y alcanzables.
* **Inputs/Props**: `currentXP`, `goalXP`.
* **Outputs/Eventos**: Redirección secundaria a la configuración del Daily Goal al hacer clic.
* **Estados**: Progreso incompleto (azul/hueco), Completado (Oro/fuego animado).
* **Prioridad**: Alta.
* **Reutilizable**: Sí.
* **UX/UI**: Visible siempre en el header del Dashboard principal y animado dinámicamente en el modal de Lección Terminada.

### 3. Gestor de Permisos Multimediales (Permission Boundary)
* **Categoría**: Accesibilidad / Técnico
* **Problema que resuelve**: Si un ejercicio interactivo de pronunciación falla porque el navegador deniega el micrófono o falta API nativa, el sistema queda bloqueado.
* **Descripción funcional**: Tarjeta superpuesta que previene problemas o asiste al usuario a encender hardware vital. Permitir desactivar temporalmente micrófonos por 1 hora.
* **Objetivo pedagógico**: Evitar frustración técnica que detenga el estado de flujo.
* **Inputs/Props**: `permissionType` ('mic', 'audio').
* **Outputs/Eventos**: `onRequest()`, `onSkipExerciseTemporary()`, `onDisableCompletely()`.
* **Estados**: Prompting, Denied, Granted, Ignored.
* **Dependencias**: `navigator.mediaDevices`.
* **Prioridad**: Alta para ejercicios Speaking.
* **Reutilizable**: Sí.

### 4. Wrapper de Auth / Login Guard
* **Categoría**: Lógica / Estructura
* **Problema que resuelve**: No hay puerta protectora y de recuperación de sesión general entre el landing y la app.
* **Descripción funcional**: HOC (Higher Order Component) que chequea el JWT activo.
* **Inputs/Props**: `children`.
* **Estados**: `loadingUser`, `unauthorized`, `authorized`.
* **Prioridad**: Crítica.

### 5. Skeleton Loader Universal y Error Fallback
* **Categoría**: Visual / Técnico
* **Problema que resuelve**: Pantallas colgadas sin feedback o app que crashea completamente por un typo en el array de la lección JSON.
* **Descripción funcional**: Componente `ErrorBoundary` de React estándar + Skeletons con efecto Shimmer.
* **Estados**: Carga asíncrona (shimmering), Timeout de Red, Error Catastrófico ("Saltar Ejercicio").
* **Prioridad**: Media (Indispensable para web / malas conexiones).

---

## C. Flujos de Usuario Completos Faltantes

### Flujo 1: Primer Ingreso, Onboarding y Test Diagnóstico
* **Objetivo del usuario**: Entrar a la app, configurar su propósito y no frustrarse por empezar de cero si ya sabe algo del idioma.
* **Paso a paso del flujo**:
  1. Splash Screen > "Empieza a aprender" > Selector de Idioma.
  2. Pregunta de UX: "¿Por qué quieres aprender inglés?" (Viajes, Trabajo, Curiosidad). 
  3. Bifurcación clave: "¿Sabes algo de inglés?" -> Sí / No.
     - *Si elige No*: Se le introduce directamente al primer ejercicio interactivo nivel Principiante (Enganche rápido antes de pedir registro).
     - *Si elige Sí*: Inicia un Placement Test inmersivo (Adaptativo, que interrumpe o finaliza tras 10 errores o aciertos límite).
  4. Fin de sesión Onboarding: Pantalla de felicitación ("Has desbloqueado X% del nivel A1").
  5. Perfil Gate (Cierre de embudo): "Crea tu perfil ahora para guardar este progreso". Modal In-App (Google, Email).
* **Eventos críticos a registrar**: `Onboarding_Started`, `Declared_Reason`, `Selected_Path_Novice_vs_Advanced`, `Account_Created_Conversion`.
* **Estados de Error**: Conexión perdida al guardar resultados pre-registro (solucionado vía localStorage caché).

### Flujo 2: Resolución de Lección, Acierto/Fallo y Game Over
* **Objetivo del usuario**: Completar los 10 a 15 micro-ejercicios sin perder sus vidas para obtener los puntos.
* **Paso a paso del flujo**:
  1. Ingreso a Lección: Request de 15 ejercicios random del pool de la Unidad actual al Back. Renderiza componente.
  2. **Interacción (Caso Acierto)**: Jugador responde correctamente. Footer sube verde chillón + Sonido "Ting". Sistema suma internamente +1 a Correctos. Click "Continuar". Transición animada de salida hacia la sig. pregunta. ProgressBar avanza 1/15.
  3. **Interacción (Caso Error)**: Jugador erróneo. Footer sube rojo quemado, muestra *Expected Answer* en texto claro + Sonido grave. `LessonManager` resta -1 Vida (`Hearts`). Agrega índice de la pregunta al fondo de la cola del array (el usuario deberá responderlo forzosamente al final de nuevo para terminar).
  4. **Pérdida Crítica de Vida (`Hearts == 0`)**: Interrumpe inmediatamente el Render. Llama modal `OutOfLivesModal`. El flujo normal se pausa.
  5. Modal ofrece salida: Gastar gemas virtuales, Ver anuncio, Misión secundaria gratis de repaso para ganar vidas, o Quittear (botón secundario grisáceo).
  6. **Fin Natural (Success)**: Última pregunta contestada 100%. Lanza confeti, muestra XP base + multiplicador por combos perfectos + Incremento de Llama de Racha diaria. Botón enorme primario "Volver al Dashboard".

### Flujo 3: Racha Diaria (Mantenimiento y Reparación de Streak)
* **Objetivo del usuario**: No perder su medalla/número de disciplina de 30 días seguidos que le crea orgullo.
* **Paso a paso del flujo**:
  1. Login en el día número D+2 (Olvidó practicar ayer, su racha debería ser cero).
  2. Inmediatamente interceptado tras Login: Animación de Flama congelándose.
  3. Comprobación pasiva de inventario: ¿Usuario posee un "Streak Freeze" (Protector de racha) activo / equipado?
     - *Si Sí*: Flama de hilo azul lo cubre. Texto: "Tu Streak Freeze salvó tu racha, pero se ha agotado. Cómpralo en la tienda". Su racha baja solo al día anterior válido.
     - *Si No*: Animación dramática de flama convirtiéndose en ceniza ("Oops, tu racha ha vuelto a 0"). Ofrece suscripción premium ("¿Recuperar Racha con Premium?").
* **Pantallas involucradas**: Modal superpuesto global (prioridad Z-index máxima al hacer login). Tienda virtual para reabastecer equipamiento.

---

## D. Arquitectura Funcional Complementaria

Se requiere orquestar la app alrededor de estos motores (Managers y Contexts):

1. **LessonFlowEngine** (Zustand store o React Context Provider masivo)
   * *Responsabilidad*: Recibe el Payload (Array de ejercicios). Controla el Index actual, avanza. Recibe booleanos de los validadores. Almacena temporalmente lo que falla y lo re-encola. Maneja la variable `isCompleted` para enviar el POST final con el score total a la base de datos y evitar que refrescar la página corrompa puntajes abusivos.
2. **ReviewMistakesEngine** (Repetición Espaciada Funcional)
   * *Responsabilidad*: Algoritmo simple. Busca en perfil de usuario los `ExercisesIds` marcados con variable `failure_count > 3`. Cuando el estudiante selecciona el botón "Práctica de Errores", arma un array prioritario (FIFO/Pesos) inyectándolo en caliente al `LessonFlowEngine`.
3. **SessionManager / SynchronizationController**
   * *Responsabilidad*: PWA Offline-first. Cachea las siguientes 3 unidades no jugadas usando IndexedDB. Si `navigator.onLine` cae a falso, todo ocurre localmente encriptado. Un WebWorker enciende cada 5 minutos comprobando el puente; al haber red, envía `bulkUpdate` (XP, rachas) resolviendo conflictos de tiempo.
4. **ValidationNormalizer**
   * *Responsabilidad*: Motor que reside al interior del `LessonFlowEngine`. Antes de juzgar un Input de Texto (traducción/dictado libre), pasa el texto de usuario y la solución esperada por: `toLowerCase()`, remueve dobles espacios (`\s+`), quita signos de puntuación finales (`.,!?:;`), perdona errores de tecleo menores ("teh" en vez de "the" -> distancia de Levenshtein < 2 advertencia amarilla, pero le da el pase correcto). ¡Vital para evitar que el usuario se rinda!
5. **AnalyticsTrackingManager**
   * *Responsabilidad*: Envuelve los eventos visuales para segmentar. ¿En qué pregunta abandonan más los alumnos? Pone banderas a los ID de los elementos con alto churn.

---

## E. Modelos de Datos Mínimos Necesarios

Para soportar las lógicas descritas, las bases deben contemplar relaciones como las siguientes:

### Entidad: User (Usuario, Perfil y Monetario)
* **Campos Clave**: `id`, `uuid`, `username`, `email`, `xpTotal`, `hearts` (Int 1-5), `lastHeartRegenTimestamp` (datetime vital para saber si darle una vida gratis por hora), `currentStreak`, `longestStreak`, `equippedItems` [array de ids].
* **Relación**: 1 a Muchos con Progreso, Logs, HistorialAnalítico.
* **Uso Principal**: Tabla central de perfilamiento, carga de inventario virtual (corazones y gemas) y liderazgo.

### Entidad: Progression (Progreso individual sobre el árbol)
* **Campos Clave**: `userId`, `unitId`, `nodeId`, `status` (unlocked, completed), `starsEarned`, `timesReviewed`.
* **Uso Principal**: Pintar el Mapa de Ruta (Dashboard Tree) coloreando los componentes o bloqueándolos; es un snapshot del nivel del alumno.

### Entidad: LessonTemplate (Plantilla y Estructura Dinámica)
* **Campos Clave**: `id`, `unitId` (relacional a una Unidad ej: A1 Módulo Básico), `title`, `baseXP`, `sequence` (JSON array polimórfico).
* **Ejemplo JSON Sequence**: 
  `[{ exerciseType: "WordBank", targetPhraseId: "TR_881", distractors: ["apple", "car"] }]`
* **Uso Principal**: Entregar lo que los motores de frontend deben renderizar sin atarse (hardcodeo) a componentes.

### Entidad: VocabularyItem (Diccionario del Back)
* **Campos Clave**: `id`, `englishPhrase`, `spanishTranslation`, `audioS3BucketLink`, `illustrationUrl`, `difficultyWeight` (1-10).
* **Uso Principal**: Alimentar dinámicamente cualquier ejercicio usando simplemente IDs sin repetir textos (Single Source of Truth de traducciones y links a archivos .mp3 o .webp).

---

## F. Priorización de Desarrollo (Roadmap de Software GTM)

### Fase 1: MVP Indispensable (Go-To-Market Lean)
* *Si lanzas esto, puedes tener usuarios.*
* Diseño de Base de Datos y APIs CRUD elementales de Auth.
* `LessonFlowEngine` operativo unidireccional (de principio a fin, solo suma XP y Hearts bajan a 0).
* Generación de plantillas troncales: Componente `MultipleChoice`, `WordBank` y Footer Evaluador Rojo/Verde básico con normalización menor (strings to lower).
* Nodo de mapa y Dashboard ultra simple lineal.
* Auth por correo electrónico base.

### Fase 2: Enganche y Repetición (Retención Mínima)
* El Gestor de Rachas (Streak Flama diaria visible y resguardable con freeze).
* Sincronización offline-first esencial (Progreso y XP temporal guardable).
* Modal Game Over interactible (Permitir recargas base para no botar alumnos de la plataforma).
* Componentes de dictado `Fill in the Blanks` con audio y `MatchingColumns` implementadas. Tarjetas visualmente ricas y dinámicas en diseño React.
* Skeletons universales, manejo de pérdida de conectividad pulido. Onboarding Test Diagnóstico base.

### Fase 3: Premium Inmersivo, Social y Personalizable (Escalable Avanzado)
* Ligas y Puntos Sociales Liderboard, Notificaciones en tiempo real, Componentes de Tienda.
* Validation Normalizer basado en Levenshtein, SpeechRecognition real que apruebe tu dicción mediante API de IA.
* Árbol de dificultad adaptativa algorítmica y repaso espaciado. Lottie Files interactivos y Avatares de estado anímico dinámico (Duolingo puro). Event analytics (Mixpanel/Amplitude pre-configurado para captar microclicks).

---

## G. Recomendación Final

1. **¿Qué diseñar primero en Figma?**
   * Las abstracciones "Estado Correcto / Error / Carga / Vacío" y el **Sistema de Diseño Base (Design System)**: Colores semánticos, Tipografía round-bold, Radios de botón gruesos (Shadow button 3D) y grillas/iconos de la App Bottom Bar.
   * La UI del `LessonManager` en formato Tira Modular (Header + Main Contenedor + Footer Validador persistente). Esto consumirá el 80% de horas del estudiante. El mapa de nodos va de segundo.
2. **¿Qué desarrollar primero en frontend?**
   * Implementa los *Building Blocks*: Un botón que simule presión 3D. Un contenedor de ejercicio que centre bien. Un Footer que haga slide-up. Inyecta estados "mock" de React sin contexto (hardcoded). 
   * Construye el `ValidationNormalizer`.
   * Montar Zustand (Status Globals) con mock data de un perfil (Vidas, Monedas, Avatar). NO toques Auth hasta tener una clase jugable end-to-end con mocks.
3. **¿Qué dejar para una versión avanzada?**
   * El offline cache robusto en Service Workers asíncronos en móviles; empieza online para validar tracción real y flujos. Los test diagnósticos son brutales, usa asignación manual al comienzo, prioriza sacar lecciones rápido de la manga. Gamificación tipo Ligas/Rankings son inútiles si no tienes retención intrínseca en contenido de ejercicio. Evita los ejercicios de Web Audio Recording Speech en tu sprint 1, enfócate en inputs touch y texto rápido.
