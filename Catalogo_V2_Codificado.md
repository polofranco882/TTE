# CATÁLOGO DE COMPONENTES V2.0 (Plantillas de Código e Integración)

Este catálogo está diseñado como un **System Prompt / Base de Conocimiento** para que una IA genere el código JSON necesario que se incrustará en tu `InteractivePageEditor` o para que un desarrollador arme componentes manuales exactos.

El **Motor de Renderizado (`BlockRenderer`)** procesa un esquema JSON donde cada bloque tiene un `id`, `type`, y `data`.

---

## 1. COMPONENTES INTERACTIVOS (CORE LOOP DE LECCIÓN)
Estos bloques nutren el JSON de la página de la lección y deben adherirse estrictamente a este esquema para interactuar con tu `ValidationFooter` y `GamificationContext`.

### 1.1 Selección Múltiple (Quiz Block)
* **type**: `'quiz'`
* **Funcionalidad**: Evalúa una elección única y envía `isCorrect`.
```json
{
  "id": "quiz-001",
  "type": "quiz",
  "data": {
    "question": "What is the correct translation for 'Apple'?",
    "options": ["Naranja", "Manzana", "Pera", "Uva"],
    "answerIndex": 1,
    "feedback": "¡Muy bien! Manzana es Apple."
  }
}
```

### 1.2 Ordenar Palabras (Word Bank Block)
* **type**: `'word_bank'`
* **Funcionalidad**: Construir una oración arrastrando o pulsando botones silábicos.
```json
{
  "id": "wordbank-001",
  "type": "word_bank",
  "data": {
    "instruction": "Escribe esto en inglés",
    "prompt": "El niño corre en el parque",
    "expectedAnswer": ["The", "boy", "runs", "in", "the", "park"],
    "distractors": ["girl", "running", "at"],
    "audioUrl": "/media/audio/en-US/the_boy_runs.mp3"
  }
}
```

### 1.3 Unir Columnas (Matching Pairs Block)
* **type**: `'matching'`
* **Funcionalidad**: Relacionar pares de conceptos (ej. Inglés a Español).
```json
{
  "id": "matching-001",
  "type": "matching",
  "data": {
    "pairs": [
      { "left": "Hello", "right": "Hola" },
      { "left": "Cat", "right": "Gato" },
      { "left": "Dog", "right": "Perro" }
    ]
  }
}
```

### 1.4 Completar Espacios (Fill in the Blanks / Cloze Block)
* **type**: `'cloze'`
* **Funcionalidad**: Oración con huecos a llenar con dropdowns o *text inputs*.
```json
{
  "id": "cloze-001",
  "type": "cloze",
  "data": {
    "textPattern": "I [blank] an apple every [blank].",
    "blanks": [
      { "type": "dropdown", "options": ["eat", "drink"], "correctAnswer": "eat" },
      { "type": "input", "correctAnswer": "day" }
    ]
  }
}
```

### 1.5 Comprensión Lectora (Reading Comprehension)
* **type**: `'reading_comp'`
* **Funcionalidad**: Texto inmersivo con evaluación adjunta.
```json
{
  "id": "read-001",
  "type": "reading_comp",
  "data": {
    "title": "My Family",
    "passage": "Hi, I am Mark. I live with my mother and my little sister.",
    "questions": [
      {
        "question": "Who does Mark live with?",
        "options": ["A dog", "His mother and sister", "His father"],
        "answerIndex": 1
      }
    ]
  }
}
```

### 1.6 Entrada de Audio / Pronunciación (Speaking Block)
* **type**: `'pronunciation'`
* **Funcionalidad**: Activa micrófono, compara transcripción.
```json
{
  "id": "speak-001",
  "type": "pronunciation",
  "data": {
    "targetPhrase": "Where is the library?",
    "translation": "¿Dónde está la biblioteca?",
    "referenceAudio": "/media/audio/where_is_library.mp3",
    "toleranceLimit": 85 
  }
}
```

### 1.7 Entrada Textual Libre (Translation / Text Input)
* **type**: `'text_input'`
* **Funcionalidad**: Caja de texto que valida tolerando mayúsculas, signos.
```json
{
  "id": "textin-001",
  "type": "text_input",
  "data": {
    "instruction": "Traduce al inglés:",
    "prompt": "Escribo código todos los días",
    "expectedAnswers": [
      "I write code every day",
      "I code every day"
    ],
    "placeholder": "Type in English..."
  }
}
```

---

## 2. COMPONENTES PEDAGÓGICOS EXPOSITIVOS (NO EVALUATIVOS)
Componentes pasivos para inyectar en las lecciones para enseñar conceptos base antes de los ejercicios evaluativos.

### 2.1 Texto Narrativo o Instructivo Avanzado
* **type**: `'text'`
* **Funcionalidad**: Reglas gramaticales o contenido base. Soporta burbujas (*speech bubbles*) adjuntas al avatar.
```json
{
  "id": "text-001",
  "type": "text",
  "data": {
    "content": "<h1>El Verbo To Be</h1><p>Se traduce como <em>ser o estar</em>.</p>",
    "bubbleType": "speech",
    "bubbleTail": "bottom-left",
    "bubbleColor": "#1e293b",
    "borderColor": "#3b82f6"
  }
}
```

### 2.2 Audio Dictado Simple
* **type**: `'audio'`
* **Funcionalidad**: Reproduce un clip de voz. Puede ser un estilo 'Hotspot'.
```json
{
  "id": "audio-001",
  "type": "audio",
  "data": {
    "title": "Pronunciación Básica",
    "url": "/api/assets/audio1.mp3",
    "visualStyle": "hotspot" 
  }
}
```

### 2.3 Imágenes Temáticas y Flashcards
* **type**: `'image'`
* **Funcionalidad**: Soporte visual.
```json
{
  "id": "img-001",
  "type": "image",
  "data": {
    "url": "/media/images/apple_illustration.svg",
    "alt": "A red apple",
    "caption": "Apple [ˈæp(ə)l]"
  }
}
```

---

## 3. COMPONENTES DE ESTRUCTURA Y GAMIFICACIÓN (Capa React JS)
Estos NO son JSON para el lienzo (canvas) del editor de lecciones, sino **Bloques JSX Reutilizables** para armar el UI envolvente de la app. Si la IA necesita crear `Dashboards` o vistas maestras, usará estos imports.

### 3.1 Nodos del Mapa (Learning Path Node)
```tsx
import { Lock, Star, Play } from 'lucide-react';

interface PathNodeProps {
  status: 'locked' | 'active' | 'completed' | 'legendary';
  onClick: () => void;
  icon: React.ReactNode;
}

const PathNode = ({ status, onClick, icon }: PathNodeProps) => {
  const bg = status === 'locked' ? 'bg-gray-700' : 'bg-accent hover:bg-orange-500';
  const shadow = status === 'locked' ? 'shadow-[0_4px_0_0_#374151]' : 'shadow-[0_8px_0_0_#9a3412] active:translate-y-2 active:shadow-none';
  
  return (
    <button onClick={onClick} disabled={status === 'locked'} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${bg} ${shadow}`}>
       {status === 'locked' && <Lock className="absolute top-0 right-0 text-white" />}
       {status === 'legendary' && <Star className="absolute -top-2 text-yellow-400 fill-yellow-400" />}
       <div className={`text-white w-10 h-10 ${status === 'locked' ? 'opacity-30' : 'opacity-100'}`}>
          {icon || <Play />}
       </div>
    </button>
  );
};
```

### 3.2 Implementación del Motor de Gamificación (`ValidationFooter.tsx`)
Cómo reacciona la IA / App dentro del `BookReader.tsx` ante una acción del alumno.
```tsx
// Ejemplo de Controller en el Layout
const LessonFlowController = () => {
    const { subtractHeart, addXp, hearts } = useGamification();
    const [status, setStatus] = useState<ValidationState>('idle');

    const handleBlockInteraction = (isCorrect: boolean) => {
        if (isCorrect) {
            setStatus('correct');
            addXp(15);
        } else {
             setStatus('incorrect');
             subtractHeart();
             if (hearts <= 1) triggerGameOverModal();
        }
    };

    return (
       <>
         <RenderCurrentExercise onComplete={handleBlockInteraction} />
         <ValidationFooter 
            status={status} 
            onContinue={() => jumpToNextExercise()} 
         />
       </>
    );
};
```

### 3.3 Pie de Página Evaluador (Validation Footer Props)
```tsx
<ValidationFooter
    status="correct" // 'idle' | 'correct' | 'incorrect'
    message="¡Excelente! Continúa así."
    onCheck={() => checkAnswer()} // Renderiza CTA "COMPROBAR" en azul si el status es idle
    isCheckDisabled={selectedOption === null}
    onContinue={() => moveToNextQuestion()}
/>
```

---

## 4. INSTRUCCIÓN PARA IAs GENERADORAS DE CURSOS (Prompt de Inserción)
Copia y pega este texto exacto a ChatGPT, Claude u otra IA la próxima vez que necesites crear lecciones masivas:

> *"Eres un experto profesor de idiomas (MCER Nivel A1-A2) y creador de contenidos digitales. Genera una página de Lección Interactiva Completa usando mi formato JSON de `BlockData[]` Array.*
> *La lección debe llamarse "Presentaciones Básicas".*
> *No me des explicación, solo retorna un JSON estructurado compatible con mi plataforma. Debe incluir el objeto `canvas` y el array de `blocks`. El primer bloque debe ser de tipo `text` como explicación sintáctica o vocabulario, seguido de varios ejercicios interactivos (ej. `quiz`, `matching`, etc.).*
> *Asegúrate de proporcionar posiciones lógicas `x` e `y` para cada bloque simulando un lienzo (ej. text arriba, quiz abajo).*
> *Respeta exactamente esta sintaxis (ejemplo completo a continuación):"*

---

## 5. EJEMPLO COMPLETO DE PANTALLA (CANVAS + BLOCKS)
Este es el resultado esperado de exportar una hoja lista, incluyendo el fondo del lienzo y la distribución espacial de los componentes (`x`, `y`). Este formato exacto puede ser devuelto por una IA o importado en el **InteractivePageEditor**.

```json
{
  "canvas": {
    "color": "#f3f4f6",
    "url": ""
  },
  "blocks": [
    {
      "id": "text-001",
      "type": "text",
      "data": {
        "content": "<h1>Greetings</h1><p><strong>Let’s repeat after the teacher</strong></p><p><em>Formal Greetings</em></p><p>Look at the image and complete the activities.</p>",
        "bubbleType": "speech",
        "bubbleTail": "bottom-left",
        "bubbleColor": "#1e293b",
        "borderColor": "#2563eb",
        "x": 519.3333129882812,
        "y": 64.66666412353516
      }
    },
    {
      "id": "img-001",
      "type": "image",
      "data": {
        "url": "/media/images/greetings-main.png",
        "alt": "Greetings poster with hello, good morning, good afternoon, good evening, good bye, see you later, see you tomorrow and good night",
        "caption": "Look and learn",
        "x": 172.66668701171875,
        "y": 266
      }
    },
    {
      "id": "quiz-001",
      "type": "quiz",
      "data": {
        "question": "What do you say in the morning?",
        "options": [
          "Good night",
          "Good morning",
          "Good bye",
          "See you later"
        ],
        "answerIndex": 1,
        "feedback": "Excellent! Good morning is correct.",
        "x": 239.3333740234375,
        "y": 367.9999694824219
      }
    },
    {
      "id": "matching-001",
      "type": "matching",
      "data": {
        "pairs": [
          {
            "left": "Hello",
            "right": "Hola"
          },
          {
            "left": "Good night",
            "right": "Buenas noches"
          },
          {
            "left": "See you tomorrow",
            "right": "Hasta mañana"
          }
        ],
        "x": 930.0000610351562,
        "y": 378.6666259765625,
        "compact": false
      }
    }
  ]
}
```
