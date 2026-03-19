# CATÁLOGO MAESTRO DE COMPONENTES V2.0 (Integrado y Definitivo)

Este documento es la evolución del catálogo conceptual inicial. Incluye **todos los componentes base** más **las capas funcionales, mecánicas de retención, flujos UX, lógicas de sistema y arquitecturas de datos** identificadas durante la fase de análisis de vacíos para un producto de aprendizaje interactivo tipo Duolingo (Nivel A1-A2).

---

## 1. COMPONENTES DE ESTRUCTURA Y NAVEGACIÓN MACRO
Proporcionan el "esqueleto" de la experiencia y orientan al estudiante en la plataforma.

1. **Layout Principal de Lección** | *Prioridad: Critica* | Wrapper maestro de la vista interactiva (aislado de distracciones).
2. **Mapa de Ruta (Path Node Map)** | *Prioridad: Critica* | Canvas vertical sinuoso. Contiene Nodos de Lección, Checkpoints y Regalos. Muestra el estado del progreso lineal.
3. **Nodo de Lección (Learning Path Node)** | *Prioridad: Critica* | Botón circular con estados: Activo (animado), Bloqueado (grisado), Completado (dorado/estrella). Input: `lessonId`. Output: OnClick Abre Pre-Lesson Modal.
4. **Portada de Unidad** | *Prioridad: Alta* | Cabecera visual que agrupa un set de Nodos de Lección bajo un objetivo (ej. "Unidad 1: Saludos").
5. **Encabezado (Active Session Header)** | *Prioridad: Critica* | Barra superior dentro de la lección que contiene el botón de Salir (X), los Corazones (Hearts) y la Barra de Progreso.
6. **Contenedor de Instrucciones** | *Prioridad: Media* | Área de texto grande arriba del ejercicio central diciendo qué hacer (ej. "Escucha y escribe").
7. **Barra de Progreso Animada** | *Prioridad: Critica* | Barra horizontal (Progress/Steps). Se llena verde conforme se avanza.
8. **Validation Footer (Pie de Página Evaluador)** | *Prioridad: Critica* | Componente fijado abajo. Sube con color Verde (Correcto) o Rojo (Error), emite sonido y dispara animaciones. Botón CTA gigante: "CALIFICAR" / "CONTINUAR".
9. **Modal "Abandonar Lección"** | *Prioridad: Alta* | Interrumpe la salida voluntaria con advertencia de pérdida de progreso.
10. **Panel Lateral / Bottom Bar** | *Prioridad: Alta* | Menú principal para transicionar entre "Learning Path", "Liderboards", "Tienda" y "Perfil".
11. **Skeleton Loader Universal / Error Fallbacks** | *Prioridad: Media* | Pantallas de carga con efecto *shimmer* o de red caída para asegurar que la app no parezca colgada.

---

## 2. COMPONENTES PEDAGÓGICOS E INSTANCIAS DE EJERCICIO
Bloques de contenido orientados a la exposición y práctica del idioma.

1. **Vocabulary Block** | Enseñanza visual e individual de palabras nuevas. (Imagen + Audio + Traducción).
2. **Grammar Block (Tip)** | Explicación breve de reglas, idealmente antes de iniciar un nodo (Pop-up de propina contextual).
3. **Reading Comprehension Block** | Párrafo corto comprensivo con palabras resaltadas que al clic revelan traducción emergente. Acompañado de pregunta de entendimiento.
4. **Guided Example Block (Práctica)** | Muestra solución parcial, pide completar el resto siguiendo un patrón repetitivo temporal.
5. **Correction/Feedback Box** | Cajón de texto dentro del Validation Footer Rojo que explica claramente el porqué te equivocaste ("Recuerda: He is, no He are").

---

## 3. COMPONENTES INTERACTIVOS (THE CORE LOOP)
La capa donde el estudiante interactúa con entradas táctiles/Voz/Input.

1. **Multiple Choice (Selección Múltiple)** | *Critica*. 3 o 4 botones anchos.
2. **Word Bank (Ordenar Sentencia)** | *Critica*. Arrastrar o hacer clic secuencial a "fichas de palabras" (Tokens) dispersas para formar una frase idiomática en la línea superior (`targetPhrase`).
3. **Fill in the Blanks (Completar Espacios)** | *Critica*. Identificar huecos en una frase insertando la opción morfológicamente correcta.
4. **Matching Columns (Unir Columnas)** | *Alta*. Tocar "Apple" a un lado y luego tocar "Manzana" al otro. Las parejas correctas emiten sonido y desaparecen.
5. **Dictation (Listening to Text)** | *Alta*. Reproducir audio y transcribir usando input nativo o fichas del Word Bank. Usa un botón de "Velocidad Normal" y otro de "Velocidad Tortuga (Lenta)".
6. **Pronunciation Speech (Voice Input)** | *Media/Alta*. Oprime y habla. Invocación de API de Web Speech o Whisper para calificar el _speaking_.
7. **Translation Free Text (Textarea)** | *Media*. Recuerdo libre total. Requiere un Tolerance Engine por detrás que perdone signos de puntuación ausentes o dobles espacios.

---

## 4. COMPONENTES VISUALES E INMERSIVOS
Crean el enganche visual y emocional.

1. **Personajes (Avatares Lottie)** | *Alta*. Mascotas reactivas ubicadas ocasionalmente a la par interactiva. Pueden sonreír, aplaudir, dudar o llorar dependiendo del Validation Footer.
2. **Insignias y Medallas Metálicas** | *Media*. Arte digital atractivo 3D recompensado por hitos (ej. "Perfecto: Ningún fallo").
3. **Speech Bubbles** | *Alta*. Globos de diálogo dinámicos que surgen de personajes en los bloques pedagógicos.

---

## 5. COMPONENTES MULTIMEDIA
Puente sensorial para la fluidez y el condicionamiento operante.

1. **Audio Player (Palabra/Oración)** | Ícono azul parlante universalmente usado para reproducir acentos nativos de pronunciación.
2. **SFX Trigger (Efectos de Sonido)** | *Critica*. El sistema invisible que dispara latencia-zero el sonido "Ting!" al acertar, el "Boom" al fallar o el "Tada!" al ganar la lección.

---

## 6. COMPONENTES DE GAMIFICACIÓN, RETENCIÓN Y ECONOMÍA
Mecanismos probados en la industria para el *habit-forming loop* que mantienen al usuario regresando.

1. **Corazones / Vidas (Hearts System)** | *Critica*. Localizado arriba a la derecha. Cinco corazones máximos. Pierdes uno por error. Si llega a 0 invoca al flujo Game Over.
2. **Game Over Modal (Out of Lives)** | *Critica*. Oferta salvación: Pagar diamantes/gemas para recargar vidas o "Abandonar lección y salir" esperando 4 horas que regeneren natural.
3. **Barra / Ring de Exp Diaria (Daily Goal)** | *Alta*. Círculo en dashboard que indica "Faltan 20 XP para tu meta diaria". Brilla enormemente cuando logras el fill 100%.
4. **Streak Ignite (Animación de Racha)** | *Critica*. El ícono de flama naranja al finalizar lección sumando "¡12 Días seguidos!".
5. **Streak Freeze (Protector de Racha)** | *Alta*. Notificación salvavidas si no ingresaste ayer pero tenías el pasivo comprado. "Tu Streak Freeze ha salvado tu racha".
6. **Ligas y Leaderboard (Ranking Table)** | *Baja/Premium*. Sistema comparativo semanal. Tarjetas con avatar, ranking (1,2,3...) ascendiendo de ligas bronce a diamante.
7. **Chest/Regalos de Camino** | *Media*. Recompensa misteriosa en el mapa que droppea gemas o protectores.

---

## 7. COMPONENTES DE ACCESIBILIDAD Y EDGES TÉCNICOS
Controlan la fricción inevitable en software móvil y web.

1. **Gestor de Permisos de Micrófono** | Prompts amables previos a un ejercicio de dictado de voz y opciones de fallback ("No puedo escuchar ahora").
2. **Inputs Grandes y Contraste** | Todo diseño de UI enfocado en el "Pulgar gordo" (Thumb zone) en Mobile. Colores WCAG estandarizados.

---

## 8. ARQUITECTURA LÓGICA (MOTORES Y ENGINES FRONTEND)
Estos NO son elementos visuales. Son los constructores abstractos que ordenan las pantallas de interactividad.

1. **Login & Session Guard (HOC)** | Componente invisible que redirige a Onboarding o Dashboard verificando si el JWT está intacto y fresco.
2. **LessonFlow Engine (Store Activo)** | El orquestador más importante. Recibe el Array JSON del Back con las 15 preguntas de la lección actual. Renderiza el BlockRenderer. Captura Inputs. Hace el diff con ExpectedAnswer. Reduce Vidas, da Puntos, Mueve el `currentIndex` a +1. Salva estado temporal. Repite los fallos al final de la cola.
3. **Validation Normalizer** | Función utilitaria que perdona errores de tecleo ("I am", "I'm", "i am", "Iam") normalizando strings antes del matching contra la respuesta DB.
4. **Spaced Repetition / ReviewMistakes Engine** | *Media*. Registra IDs de lecciones/palabras donde hubo pérdida de Vidas, para construirle una "Lección Dinámica de Errores" forzada días después.
5. **OfflineSync Manager** | *Alta*. Controla `navigator.onLine`. Guarda XP temporales en caché local para subirlos luego si el Wifi falló.

---

## 9. MODELOS DE DATOS (ESQUEMAS BASE)

* **Entidad User / Account**: `userId, username, hearts (Int), lastHeartTick (Date), currentStreak (Int), xpGlobal, internalInventory[] (gems, freezestrikes)`.
* **Entidad Progression Tracker**: Relación `UserId <-> LearningNodeId`. Estado del nodo (`LOCKED, ACTIVE, COMPLETED, LEGENDARY`).
* **Entidad LessonTemplate**: Formato Universal polimórfico de clases que viaja del servidor:
  ```json
  {
      "nodeId": 14,
      "exercises": [
          { "type": "WordBank", "english": "The boy runs", "sp": "El niño corre", "tokens": ["run", "The", "boy", "runs", "girls"] },
          { "type": "AudioDictation", "voiceUrl": "/media/aud_03.webp", "expected": "I am listening." }
      ]
  }
  ```
* **Entidad Analytics/Telemetry**: `timestamp, userId, nodeID, time_spent_in_lesson, exit_reason`.

---
## FLUJOS CRÍTICOS A INICIAR (PRIORIDAD DE IMPLEMENTACIÓN)
1. Flujo `LessonFlow` Básico (Sin Vidas, solo responder y pasar a Header Final).
2. UI de Bottom Validation Footer animado.
3. Funcionalidad de Game Over (Hearts Logic).
4. El Canvas Interactivo de `Learning Path Nodes` Vertical.
