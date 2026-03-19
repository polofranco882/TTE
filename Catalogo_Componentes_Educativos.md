# Catálogo Maestro de Componentes Educativos (Clon Duolingo)

Este documento contiene la arquitectura de interfaz de usuario y diseño instruccional para una plataforma interactiva de aprendizaje de inglés para niveles A1-A2. Está enfocado en identificar, definir y clasificar todos los componentes necesarios antes del desarrollo visual o de código.

---

## 1. Componentes de Estructura
Proporcionan el "esqueleto" de la experiencia, guiando la atención del usuario sin abrumarlo.

* **Layout principal** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Contenedor maestro de vistas. Da seguridad y contexto al estudiante.
  * *Técnico*: Tipo: Wrapper. Props: `children`, `theme`. Estados: `mounted`.
  * *Ejemplo/UX*: Contener toda la lección. UI limpia, márgenes amplios, sin elementos distractores al borde.
* **Portada de unidad** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Introduce el tema general. Sitúa mentalmente al aprendiz.
  * *Técnico*: Tipo: Presentacional. Props: `title`, `image`, `moduleNumber`. Salidas: `onStart`. 
  * *Ejemplo/UX*: "Unidad 1: Saludos". Usar ilustraciones amigables y un botón CTA gigante.
* **Encabezado (Header)** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Muestra progreso y salidas. Permite abandonar sin frustración.
  * *Técnico*: Tipo: Navegación. Props: `progress`, `hearts`. Salidas: `onExit`.
  * *Ejemplo/UX*: Barra superior con una "X" para salir y la barra de progreso al lado.
* **Subtítulo** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Instrucción secundaria o traducción menor. Apoyo cognitivo.
  * *Técnico*: Tipo: Tipografía. Props: `text`, `lang`. 
  * *Ejemplo/UX*: Texto en gris claro indicando "Traduce esta oración".
* **Contenedor de lección** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Área donde reside el ejercicio interactivo. Foco total.
  * *Técnico*: Tipo: Wrapper. Props: `children`, `maxWidth`.
  * *Ejemplo/UX*: Caja central alineada verticalmente, responsive para móviles.
* **Sección de instrucciones** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Dice qué hacer exacta y brevemente. Claridad absoluta.
  * *Técnico*: Tipo: Presentacional. Props: `instructionText`, `audioUrl`. Salidas: `onPlayAudio`.
  * *Ejemplo/UX*: Título h1 bold: "Escoge la traducción correcta". Opcional ícono de bocina.
* **Pie de página (Footer de Lección)** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Contiene el CTA principal (Comprobar/Continuar). Motor de avance.
  * *Técnico*: Tipo: Action Menu. Props: `status` (idle, correct, incorrect, loading). Salidas: `onSubmit`.
  * *Ejemplo/UX*: Botón flotante inferior. Cambia a verde brillante al acertar.
* **Barra de progreso** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Indica cuánto falta. Motivación intrínseca (casi terminas).
  * *Técnico*: Tipo: Feedback visual. Props: `currentStep`, `totalSteps`. Estados: `animating`.
  * *Ejemplo/UX*: Barra horizontal animada rellenándose de verde.
* **Navegación entre páginas** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Botones prev/next en modo lectura. Autonomía del usuario.
  * *Técnico*: Tipo: Control. Props: `currentPage`. Salidas: `onNext`, `onPrev`.
  * *Ejemplo/UX*: Flechas laterales translúcidas en fichas de teoría.
* **Separadores** | **Prioridad**: Baja | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Divide secciones conceptuales dando respiro visual.
  * *Técnico*: Tipo: Decorativo. Props: `style` (line, dots).
  * *Ejemplo/UX*: Línea tenue entre el vocabulario y los ejemplos.
* **Tarjetas de contenido (Cards)** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Agrupa información (ej. una palabra y su foto). Chunking de memoria.
  * *Técnico*: Tipo: UI Element. Props: `title`, `image`, `selected`. Salidas: `onClick`. Estados: `active`, `inactive`.
  * *Ejemplo/UX*: Tarjeta con la foto de una manzana y "Apple". Borde grueso en hover.
* **Modales / Popups** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Interrupción para información vital (abandonar lección o recompensa).
  * *Técnico*: Tipo: Overlay. Props: `isOpen`, `content`. Salidas: `onClose`, `onConfirm`.
  * *Ejemplo/UX*: "¿Seguro que quieres salir? Perderás tu progreso". Fondo oscurecido.
* **Panel lateral** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Menú de navegación principal en desktop.
  * *Técnico*: Tipo: Layout. Props: `links`, `userProfile`.
  * *Ejemplo/UX*: Panel izquierdo con "Aprender", "Ligas", "Tienda".
* **Breadcrumb o ruta** | **Prioridad**: Baja | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Mostrar el árbol del curso. Sentido de ubicación espacial.
  * *Técnico*: Tipo: Navegación. Props: `pathHierarchy`.
  * *Ejemplo/UX*: `Inglés > Unidad 1 > Lección 2`. Texto pequeño y clickeable.

---

## 2. Componentes Pedagógicos
Elementos centrados en la exposición del contenido para asimilación del idioma.

* **Bloque de vocabulario** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Introducción guiada de nuevas palabras. Construcción de léxico.
  * *Técnico*: Tipo: Educativo. Props: `word`, `translation`, `imageUrl`, `audioUrl`.
  * *Ejemplo/UX*: Foto grande, palabra en inglés con tipografía grande, botón de audio.
* **Bloque de gramática** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Explicación concisa de una regla. Comprensión estructural.
  * *Técnico*: Tipo: Instructivo. Props: `ruleTitle`, `explanation`, `examples[]`.
  * *Ejemplo/UX*: Caja con fondo azul claro. Regla del verbo "To Be" con colores destacando el verbo.
* **Bloque de lectura** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Texto corto con contexto. Lectura de comprensión A1.
  * *Técnico*: Tipo: Textual. Props: `paragraphs`, `highlightedWords`.
  * *Ejemplo/UX*: Un párrafo sobre "My family" con palabras clave subrayadas y tocables para traducir.
* **Bloque de pronunciación / Speaking** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Práctica coral activa. Fluidez y confianza vocal.
  * *Técnico*: Tipo: Interactivo/Media. Props: `targetPhrase`. Salidas: `onRecordingStart`, `onScoreCalculated`.
  * *Ejemplo/UX*: Animación de ondas sonoras al hablar. Retroalimentación roja/verde por palabra.
* **Bloque de listening** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Estimula el oído. Asociación sonido-grafía sin apoyo visual de texto temporalmente.
  * *Técnico*: Tipo: Interactivo. Props: `audioUrl`, `slowAudioUrl`.
  * *Ejemplo/UX*: Ícono de megáfono grande y botón de animado pulsante.
* **Bloque de writing** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Traducción inversa (L1 a L2). Recall cognitivo alto.
  * *Técnico*: Tipo: Input. Props: `expectedAnswer`, `hints`. Salidas: `onChange`.
  * *Ejemplo/UX*: Textarea limpio con placeholder "Escribe en inglés...".
* **Bloque de traducción** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Traducción directa. Identificación de sintaxis.
  * *Técnico*: Tipo: Evaluativo. Props: `sourceSentence`, `interactionType`.
  * *Ejemplo/UX*: "Ella come manzanas" -> bloques de arrastrar (She) (eats) (apples).
* **Bloque de ejemplo guiado / Práctica / Repaso** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Modelado del comportamiento y posterior repetición espaciada.
  * *Técnico*: Props paramétricos de nivel de dificultad.
  * *Ejemplo/UX*: Mostrar solución primero, luego pedir que se replique parcialmente.
* **Bloque de evaluación / Retroalimentación** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Refuerzo positivo o corrección al instante. Prevención de fosilización de errores.
  * *Técnico*: Tipo: Modal Footer. Props: `isCorrect`, `correctAnswer`, `explanation`.
  * *Ejemplo/UX*: Si falla: "Solución correcta: He is a boy. (Faltó el artículo 'a')".
* **Bloque de reto** | **Prioridad**: Baja | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Dificultad súbita u oculta (Doble puntaje). Engagement.
  * *Ejemplo/UX*: Pantalla pre-ejercicio: "¡Doble EXP si aciertas esta!". Pantalla titila rojo/dorado.
* **Bloque de conversación** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Diálogo A/B. Muestra uso pragmático del idioma.
  * *Técnico*: Props: `dialogueLines[]`.
  * *Ejemplo/UX*: Estilo chat de WhatsApp entre dos avatares, reproduciéndose línea por línea.
* **Bloque de frases útiles** | **Prioridad**: Baja | **Reutilizable**: Sí
  * *Funcionalidad/Pedagogía*: Funciones léxicas completas (Survival English).
  * *Ejemplo/UX*: Tarjetas de "Cómo pedir comida", "Cómo saludar".

---

## 3. Componentes Interactivos
La capa de "actividad". Donde el estudiante ingresa su respuesta.

* **Selección múltiple** | **Prioridad**: Alta | **Reusable**: Sí
  * *Técnico/Pedagógico*: Reconocimiento de respuesta correcta. `Props: options[], correctAnswer`.
  * *Ejemplo/UX*: 3 o 4 botones anchos. Al hacer clic se marca el borde de un color de selección.
* **Arrastrar y soltar (Drag & Drop)** | **Prioridad**: Media | **Reusable**: Sí
  * *Técnico/Pedagógico*: Construcción espacial y estructural. `Props: draggables[], dropZones[]`. Salidas: `onDrop`.
  * *Ejemplo/UX*: Arrastrar imagen de perro hacia el texto "Dog". Sombra (drop shadow) al levantar el elemento.
* **Unir columnas / Matching** | **Prioridad**: Media | **Reusable**: Sí
  * *Técnico/Pedagógico*: Asociación 1 a 1 anatómica de conceptos. `Props: leftCol[], rightCol[]`.
  * *Ejemplo/UX*: Tocar palabra en inglés, tocar traducción en español. Si acierta desaparecen o se enlazan con línea animada.
* **Completar espacios (Fill in the blanks)** | **Prioridad**: Alta | **Reusable**: Sí
  * *Técnico/Pedagógico*: Identificación morfológica contextual. `Props: textWithBlanks`, `availableBlocks`.
  * *Ejemplo/UX*: "I ___ an apple". Banco de palabras abajo: [eat] [sleep] [run].
* **Ordenar oraciones (Word Bank)** | **Prioridad**: Alta | **Reusable**: Sí
  * *Técnico/Pedagógico*: Comprensión de sintaxis en inglés (S-V-O). `Props: scrambledWords[]`.
  * *Ejemplo/UX*: Tokens de palabras que fluyen responsivamente y saltan a una línea en blanco arriba al tocarlas (estilo Duolingo).
* **Tarjetas flip (Flashcards)** | **Prioridad**: Baja | **Reusable**: Sí
  * *Técnico/Pedagógico*: Autorregulación del estudio y repetición. `Estados: isFlipped`.
  * *Ejemplo/UX*: Tarjeta con "Gato". Al tocar, gira 3D revelando "Cat" y emitiendo sonido.
* **Verdadero/Falso** | **Prioridad**: Media | **Reusable**: Sí
  * *Ejemplo/UX*: Botones estandarizados, estilo binario con iconos (Checkmark y X).
* **Botones Escuchar / Grabar Voz** | **Prioridad**: Alta | **Reusable**: Sí
  * *Técnico/Pedagógico*: Inputs de media. Activan APIs nativas de WebAudio / SpeechRecognition.
  * *Ejemplo/UX*: Ícono audífono / micrófono azul brillante, animación de onda mientras se escucha o habla.
* **Hotspot / Clic sobre imagen** | **Prioridad**: Baja | **Reusable**: Sí
  * *Técnico/Pedagógico*: Ubicación espacial de vocabulario. `Props: imageSrc, coordinates[]`.
  * *Ejemplo/UX*: Foto de una casa, tocar el "Roof" para contestar la pregunta.
* **Input de texto / Textarea** | **Prioridad**: Media | **Reusable**: Sí
  * *Técnico/Pedagógico*: Recuerdo libre. Máximo nivel cognitivo. `Props: validationRegex`, `autoCapitalize`.
  * *Ejemplo/UX*: Manejo inteligente de teclado en móviles (mostrar teclado de idioma nativo vs inglés).

---

## 4. Componentes Visuales
Responsables del disfrute estético, "wowness" y apego cognitivo a la plataforma.

* **Personaje / Avatar** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Objetivo*: Crear conexión emocional (ej. el búho Duo).
  * *Técnico/UX*: Archivos SVG o Lottie. Componente dinámico por emoción: `mood: 'happy' | 'thinking' | 'sad'`.
* **Ilustraciones e Íconos** | **Prioridad**: Alta | **Reutilizable**: Sí
  * *Objetivo*: Representación abstracta veloz de palabras (flat design o 3D suave).
  * *Técnico/UX*: SVG en línea para poder cambiar el color de "fill" según el estado activo/inactivo.
* **Stickers / Insignias / Estrellas / Trofeos** | **Prioridad**: Media | **Reutilizable**: Sí
  * *Objetivo*: Tokens visuales de economía virtual. Mantiene el loop dopamínico.
  * *UX*: Animaciones tipo pop-in elástico. Materiales que simulen oro, plata o gemas.
* **Burbuja de diálogo** | **Prioridad**: Media | **Reutilizable**: Sí
  * *UX*: Sale de la boca del avatar con una colita (caret), fondo blanco, borde suave y texto grande legible.
* **Fondos temáticos / Escenas** | **Prioridad**: Baja | **Reutilizable**: Sí
  * *UX*: Paisajes en vectores muy sutiles que no compitan con el texto (ej. París para lecciones de viaje).

---

## 5. Componentes Multimedia
El puente sensorial inmersivo del aprendizaje de idiomas.

* **Reproductores de Audio (Palabra/Oración/Diálogo)** | **Prioridad**: Alta
  * *Objetivo/Técnico*: Entrenar fonética. `Props: url, playbackRate, autoPlay`.
  * *UX*: Audio normal (velocidad 1x) y audio tortuga (velocidad 0.5x). Crucial para A1.
* **Efecto de Sonido (Correcto/Incorrecto/Logro)** | **Prioridad**: Alta
  * *Objetivo/Técnico*: Refuerzo pavloviano. Componente invisible que maneja WebAudio API. Reproducción inmediata a muy baja latencia.
* **Animaciones (Entrada/Logro)** | **Prioridad**: Media
  * *Objetivo/Técnico*: Transiciones suaves. Biblioteca sugerida: Framer Motion o CSS nativo.
  * *UX*: Pantalla de logro que lanza confeti digital y hace un zoom in a una corona.
* **Video / GIF Educativo** | **Prioridad**: Baja
  * *UX*: Clips cortos (5 seg) reproduciéndose en bucle o al hacer hover (útiles para verbos de acción).

---

## 6. Componentes de Gamificación
Engomado técnico de retención (retention loop).

* **Corazones / Vidas** | **Prioridad**: Alta | **Representa**: Tolerancia a errores.
  * *UX*: Contador superior rojo. Al fallar, uno se quiebra animadamente y vibra. Si llega a 0, Game Over modal.
* **Puntos / Monedas / Barra de Experiencia** | **Prioridad**: Alta | **Representa**: Trabajo acumulado.
  * *UX*: Barra al finalizar una lección "EXP ganada: +15". Animación de contador subiendo gradualmente de 0 a 15 con soniditos.
* **Racha (Streak)** | **Prioridad**: Alta | **Representa**: Hábito y constancia.
  * *UX*: Ícono de flama naranja con número. Animación de "fuego" encendiéndose si se completa la lección del día.
* **Medallas / Nivel / Desbloqueo** | **Prioridad**: Media | **Representa**: Metas a mediano plazo.
  * *UX*: Candados grises que explotan y se vuelven coloridos demostrando apertura de nuevas lecciones.
* **Ranking / Ligas / Mensaje de felicitación** | **Prioridad**: Media | **Representa**: Social proof / Competición sana.
  * *UX*: Listado vertical tipo tabla de líderes. Efectos gloriosos de "Has subido a la división Zafiro".

---

## 7. Componentes de Accesibilidad (a11y)
Garantizan un producto inclusivo universal.

* **Textos ampliables** | Soportar unidades `rem` dinámicas sin romper el layout.
* **Contraste alto / Estados visuales claros** | Focus rings explícitos por teclado (`:focus-visible`), cumplimiento mínimo WCAG AA de colores.
* **Audio alternativo (Screen Readers)** | `aria-label` en todas las imágenes y botones simbólicos (ej. la X de cerrar tiene `aria-label="Cerrar lección"`).
* **Navegación clara / Botones grandes** | Tapped area (zona táctil) mínima de 44x44px en móviles para inputs y alternativas. Soporte de teclas "Enter / 1,2,3" para responder quizzes.

---

## 8. Componentes Técnicos y Funcionales (Arquitectura)
La estructura silenciosa invisible que sostiene la interactividad.

* **LessonManager (Gestor de Lección)**
  * *Propósito*: Orquesta el flujo, puntaje y vistas. Controla qué componente interactivo se muestra.
  * *Estados*: `currentExerciseIndex`, `lives`, `score`.
* **SoundEngine / AudioContextWrapper**
  * *Propósito*: Pre-cargar audios para evitar retrasos y administrar superposiciones sonoras.
* **GamificationTracker**
  * *Propósito*: Observar eventos de `onExerciseComplete` e inyectar puntos/rachas a la API al fondo del usuario.
* **ValidationRuleEngine**
  * *Propósito*: Limpia los strings del estudiante (quita comas, dobles espacios, mayúsculas) y los compara con listas de posibles respuestas correctas.
* **ErrorBoundary**
  * *Propósito*: Si un ejercicio específico crashea o falta un prop vital, renderizar pantalla de "Ejercicio roto, saltar al siguiente" sin apagar toda el app.

---
---

## Secciones de Implementación Recomendadas

### A. Componentes mínimos para un MVP
Con esto puedes lanzar y probar la retención base:
1. `LessonLayout` y `ProgressBar` (Estructura base).
2. Botones de Sonido y `Footer` de evaluación (Correcto/Incorrecto).
3. `VocabularyBlock` (Mostrar teoría).
4. Ejercicios: `MultipleChoice` (Selección múltiple) y `WordBank` (Ordenar palabras).
5. Gamificación: `Hearts` (Corazones/Vidas) y pantalla simple de `LessonComplete`.

### B. Componentes recomendados para una versión intermedia
Mejoran exponencialmente la interactividad y gamificación:
1. Gestor de Rachas (Streak Flama).
2. Ejercicios: `FillInTheBlanks` y `MatchingColumns` (arrastrar y soltar líneas).
3. Efectos de sonido finamente pulidos y animaciones de progreso fluidas.
4. Avatares expresivos base (felices si ganas, tristes si fallas).
5. Modal de contexto gramatical estilo tips antes de lección.

### C. Componentes ideales para una versión Premium / Clon exacto Duolingo
1. Componente `SpeechRecognition` (hablar a través de WebRTC/MediaDevices).
2. `LottieAnimations` complejas en personajes 2D interconectados al scroll/evento.
3. Pantalla interactiva dinámica de Ranking / Ligas en vivo.
4. Ejercicios tipo historias de comprensión lectora interactiva animada (Stories).
5. Sistema dinámico completo de economía (Gemas, tienda virtual, personalización).

### D. Recomendación de Organización en el Repositorio Frontend (Atomic Design Modificado)
```text
src/
  ├── components/
  │   ├── core/           # Layouts, Topbar, Sidebar, Footer interactivo
  │   ├── atoms/          # BotonBase, IconoSonido, ProgressBar, Insignia
  │   ├── blocks/         # MultipleChoiceBlock, WordBankBlock, MatchingBlock
  │   ├── visual/         # AvatarEmotion, LottieCharacter, SceneBackground
  │   └── modal/          # QuitLessonModal, LevelUpOverlay, ErrorBoundary
  ├── hooks/              # useAudio, useGamification, useLessonManager
  ├── types/              # /interfaces TS para todas las Props
  └── store/              # Zustand/Redux para Vidas, Monedas, Tema de color
```

### E. Convención de Nombres Sugerida (Naming Convention)
* **Carpetas y Archivos**: PascalCase para componentes visuales (e.g., `MultipleChoiceQuiz.tsx`).
* **Sufijos Funcionales**:
  * `*Block` para bloques pedagógicos grandes (e.g., `ReadingBlock`).
  * `*Btn` o `*Icon` para UI microscópica (e.g., `PlayAudioBtn`).
  * `*Modal` para interrupciones (e.g., `OutOfLivesModal`).
  * `*Layout` para envoltorios principales estructurados.
* **Tipos TS**: Sufijo final `Props` para componentes (e.g., `WordBankProps`) y `Type` para estructuras de datos independientes (e.g., `LessonType`).

### F. ¿Por dónde empezar? (Plantillas Core a Diseñar Primero)
Estas interfaces se utilizan decenas de miles de veces en una plataforma así; su código y UX debe ser inmaculado, robusto y muy genérico:

1. **`ExerciseContainerLayout`**: La plantilla universal para cualquier ejercicio. Sostiene el título de instrucción, centra el contenido `children` (el ejercicio) y empuja el Footer de validación hacia abajo con flexbox.
2. **`ValidationFooter`**: El famoso panel de Duolingo que salta desde abajo y verifica las respuestas, cambiando de verde luminoso con botón "CONTINUAR" a rojo quemado con correcciones.
3. **`WordBankArray`**: El complejo motor para el drag & drop o click-to-move de tokens de palabras "ordenando oraciones", ya que matemáticamente y en animaciones FLIP (First, Last, Invert, Play) es el componente de desarrollo más laborioso.
