# 📦 Catálogo de Componentes TTE — V3 Completo con Ejemplos JSON

> Cada componente incluye un ejemplo JSON funcional listo para copiar y pegar en el editor interactivo.

---

## Propiedades Base (comunes a TODOS los bloques)

```json
{
  "x": 50,
  "y": 50,
  "width": 200,
  "height": 150,
  "rotate": 0,
  "zIndex": 1,
  "opacity": 1,
  "borderRadius": 16,
  "borderWidth": 0,
  "borderColor": "#ffffff",
  "boxShadow": "none",
  "color": "#ffffff",
  "bgColor": "transparent"
}
```

---

## 1. TEXT — Bloque de Texto Enriquecido

```json
{
  "id": "text-001",
  "type": "text",
  "data": {
    "content": "<h1>Greetings</h1><p><strong>Let's learn greetings!</strong></p><p><em>Formal and informal</em></p>",
    "style": "p",
    "bubbleType": "none",
    "bubbleTail": "bottom-left",
    "bubbleColor": "#161930",
    "borderColor": "#2563eb",
    "x": 50,
    "y": 50,
    "width": 400,
    "height": 150,
    "rotate": 0,
    "zIndex": 1,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 0,
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

### Variante: Burbuja de Diálogo (Speech Bubble)

```json
{
  "id": "text-bubble-001",
  "type": "text",
  "data": {
    "content": "<p><strong>Hello!</strong> How are you today?</p>",
    "bubbleType": "speech",
    "bubbleTail": "bottom-left",
    "bubbleColor": "#1e293b",
    "borderColor": "#2563eb",
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 120,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 3,
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "#1e293b"
  }
}
```

> **bubbleType**: `none` | `speech` | `thought` | `shout`  
> **bubbleTail**: `bottom-left` | `bottom-right` | `top-left` | `top-right`

---

## 2. IMAGE — Bloque de Imagen

```json
{
  "id": "img-001",
  "type": "image",
  "data": {
    "url": "/media/images/greetings-poster.png",
    "alt": "Greetings poster showing hello, goodbye, good morning",
    "caption": "Look and learn",
    "x": 50,
    "y": 180,
    "width": 450,
    "height": 350,
    "rotate": 0,
    "zIndex": 1,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 2,
    "borderColor": "#e5e7eb",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

---

## 3. VIDEO — Reproductor de Video

```json
{
  "id": "video-001",
  "type": "video",
  "data": {
    "url": "/media/videos/greetings-intro.mp4",
    "autoPlay": false,
    "loop": false,
    "muted": true,
    "x": 50,
    "y": 50,
    "width": 500,
    "height": 280,
    "rotate": 0,
    "zIndex": 1,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 8px 30px rgba(0,0,0,0.3)",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

---

## 4. AUDIO — Reproductor de Audio

### Variante: Barra completa

```json
{
  "id": "audio-bar-001",
  "type": "audio",
  "data": {
    "url": "/media/audio/hello-pronunciation.mp3",
    "title": "Hello — Pronunciation",
    "visualStyle": "bar",
    "x": 50,
    "y": 400,
    "width": 400,
    "height": 80,
    "rotate": 0,
    "zIndex": 1,
    "opacity": 1,
    "borderRadius": 24,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

### Variante: Hotspot (botón flotante)

```json
{
  "id": "audio-hotspot-001",
  "type": "audio",
  "data": {
    "url": "/media/audio/good-morning.mp3",
    "title": "Good Morning",
    "visualStyle": "hotspot",
    "x": 80,
    "y": 220,
    "width": 50,
    "height": 50,
    "rotate": 0,
    "zIndex": 10,
    "opacity": 1,
    "borderRadius": 999,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

---

## 5. BUTTON — Botón de Acción

```json
{
  "id": "btn-001",
  "type": "button",
  "data": {
    "label": "Next Activity →",
    "action": "next",
    "value": "",
    "style": "solid",
    "fontSize": "16px",
    "hideIcon": false,
    "x": 300,
    "y": 700,
    "width": 200,
    "height": 55,
    "rotate": 0,
    "zIndex": 5,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 15px rgba(255,100,0,0.3)",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

> **style**: `solid` | `outline`  
> **action**: `next` | `prev` | `link` | `custom`

---

## 6. QUIZ — Pregunta de Selección Múltiple

```json
{
  "id": "quiz-001",
  "type": "quiz",
  "data": {
    "question": "What do you say in the morning?",
    "options": ["Good night", "Good morning", "Good bye", "See you later"],
    "answerIndex": 1,
    "feedback": "Excellent! 'Good morning' is the correct greeting for the morning.",
    "x": 500,
    "y": 100,
    "width": 420,
    "height": 400,
    "rotate": 0,
    "zIndex": 3,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 8px 30px rgba(0,0,0,0.3)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 7. ACTIVITY — Actividad Interactiva (Scramble/Unscramble)

```json
{
  "id": "activity-001",
  "type": "activity",
  "data": {
    "mode": "scramble",
    "question": "Unscramble the greeting:",
    "correctAnswer": "Good morning",
    "options": ["morning", "Good"],
    "feedback": "Perfect! The correct phrase is 'Good morning'.",
    "x": 500,
    "y": 500,
    "width": 350,
    "height": 250,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 8. WORD BANK — Banco de Palabras

```json
{
  "id": "word-bank-001",
  "type": "word_bank",
  "data": {
    "prompt": "Build the sentence: 'Good evening, how are you?'",
    "correctSentence": "Good evening how are you",
    "distractors": ["bad", "night", "where", "tomorrow"],
    "x": 50,
    "y": 550,
    "width": 400,
    "height": 250,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 9. MATCHING — Pareamiento / Matching Pairs

```json
{
  "id": "matching-001",
  "type": "matching",
  "data": {
    "pairs": [
      { "left": "Hello", "right": "Hola" },
      { "left": "Good evening", "right": "Buenas noches" },
      { "left": "See you tomorrow", "right": "Hasta mañana" },
      { "left": "Good bye", "right": "Adiós" },
      { "left": "Good morning", "right": "Buenos días" }
    ],
    "x": 500,
    "y": 450,
    "width": 450,
    "height": 350,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 10. CLOZE — Completar Espacios en Blanco

```json
{
  "id": "cloze-001",
  "type": "cloze",
  "data": {
    "textWithBlanks": "[Good|Buenos] morning! My name [is|es] Maria. Nice to [meet|see] you!",
    "hideQuestion": false,
    "compact": false,
    "x": 50,
    "y": 300,
    "width": 450,
    "height": 200,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

> **Sintaxis**: `[respuesta]` para una sola respuesta, `[resp1|resp2|resp3]` para múltiples respuestas válidas separadas por `|`

---

## 11. LISTEN & TAP — Escuchar y Seleccionar

```json
{
  "id": "listen-tap-001",
  "type": "listen_tap",
  "data": {
    "audioAssetId": "/media/audio/hello-world.mp3",
    "correctSentence": "Hello world",
    "distractors": ["hi", "earth", "help", "word"],
    "x": 50,
    "y": 100,
    "width": 400,
    "height": 280,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 12. DICTATION — Dictado

```json
{
  "id": "dictation-001",
  "type": "dictation",
  "data": {
    "audioAssetId": "/media/audio/good-afternoon.mp3",
    "correctText": "Good afternoon",
    "x": 50,
    "y": 400,
    "width": 400,
    "height": 220,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 13. PRONUNCIATION — Pronunciación / Hablar

```json
{
  "id": "pronunciation-001",
  "type": "pronunciation",
  "data": {
    "targetPhrase": "Good morning, nice to meet you",
    "x": 50,
    "y": 600,
    "width": 350,
    "height": 180,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 14. TRANSLATION — Traducción

```json
{
  "id": "translation-001",
  "type": "translation",
  "data": {
    "sourceText": "Good evening, how are you?",
    "targetLanguage": "es",
    "x": 50,
    "y": 100,
    "width": 400,
    "height": 220,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 15. STORY DIALOGUE — Diálogo / Historia

```json
{
  "id": "dialogue-001",
  "type": "story_dialogue",
  "data": {
    "characterId": "teacher",
    "dialogueText": "Hello class! Today we will learn about greetings. Can you say 'Good morning'?",
    "userOptions": [
      "Good morning, teacher!",
      "Good night!",
      "See you later!"
    ],
    "x": 50,
    "y": 50,
    "width": 420,
    "height": 280,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 16. READING COMPREHENSION — Comprensión Lectora

```json
{
  "id": "reading-001",
  "type": "reading_comp",
  "data": {
    "storyText": "Maria wakes up every morning at 7:00 AM. She says 'Good morning' to her family. Then she goes to school and says 'Hello' to her friends. In the afternoon, she says 'Good afternoon' to her neighbors. At night, she says 'Good night' to everyone before going to bed.",
    "questions": [
      {
        "question": "What does Maria say when she wakes up?",
        "options": ["Good night", "Good morning", "Hello", "Good bye"],
        "answerIndex": 1
      },
      {
        "question": "When does Maria say 'Good afternoon'?",
        "options": ["In the morning", "At night", "In the afternoon", "At school"],
        "answerIndex": 2
      }
    ],
    "x": 50,
    "y": 50,
    "width": 500,
    "height": 500,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 4px 20px rgba(0,0,0,0.2)",
    "color": "#ffffff",
    "bgColor": "#0f172a"
  }
}
```

---

## 17. GAMIFICATION REWARD — Recompensa / XP

```json
{
  "id": "reward-001",
  "type": "gami_reward",
  "data": {
    "xpAmount": 25,
    "streakMultiplier": 1.5,
    "x": 600,
    "y": 50,
    "width": 200,
    "height": 120,
    "rotate": 0,
    "zIndex": 5,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 8px 30px rgba(255,200,0,0.2)",
    "color": "#fbbf24",
    "bgColor": "#1e1b4b"
  }
}
```

---

## 18. META HINT — Pista / Nota Informativa

```json
{
  "id": "hint-001",
  "type": "meta_hint",
  "data": {
    "markdownContent": "💡 **Tip:** In English, we greet differently depending on the time of day:\n- **Morning** (6am-12pm): Good morning\n- **Afternoon** (12pm-6pm): Good afternoon\n- **Evening** (6pm-9pm): Good evening\n- **Night** (9pm+): Good night",
    "triggerOn": "always",
    "x": 500,
    "y": 300,
    "width": 350,
    "height": 200,
    "rotate": 0,
    "zIndex": 3,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 1,
    "borderColor": "#fbbf24",
    "boxShadow": "none",
    "color": "#fbbf24",
    "bgColor": "#1e1b4b"
  }
}
```

---

## 19. CODE EDITOR — Editor de Código

```json
{
  "id": "code-001",
  "type": "code_editor",
  "data": {
    "language": "javascript",
    "initialCode": "// Create a greeting function\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Test it:\nconsole.log(greet('Maria'));",
    "expectedOutput": "Hello, Maria!",
    "showRunButton": true,
    "tests": [],
    "x": 50,
    "y": 50,
    "width": 550,
    "height": 380,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 16,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "boxShadow": "0 8px 30px rgba(0,0,0,0.3)",
    "color": "#e2e8f0",
    "bgColor": "#0f172a"
  }
}
```

---

## 20. TEXT INPUT — Campo de Entrada de Texto Libre

```json
{
  "id": "text-input-001",
  "type": "text_input",
  "data": {
    "placeholder": "Write the greeting for the morning...",
    "correctAnswer": "Good morning",
    "successMessage": "Great job! That's right!",
    "showValidation": true,
    "fontSize": 18,
    "color": "#000000",
    "bgColor": "#ffffff",
    "align": "left",
    "x": 100,
    "y": 500,
    "width": 350,
    "height": 55,
    "rotate": 0,
    "zIndex": 2,
    "opacity": 1,
    "borderRadius": 12,
    "borderWidth": 2,
    "borderColor": "#e5e7eb",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
  }
}
```

---

## 21. LAYOUT CONTAINER — Contenedor de Layout

```json
{
  "id": "layout-001",
  "type": "layout_container",
  "data": {
    "layoutType": "column",
    "gap": "16px",
    "childrenBlocks": [],
    "x": 50,
    "y": 50,
    "width": 500,
    "height": 500,
    "rotate": 0,
    "zIndex": 1,
    "opacity": 1,
    "borderRadius": 20,
    "borderWidth": 1,
    "borderColor": "#334155",
    "boxShadow": "none",
    "color": "#ffffff",
    "bgColor": "transparent"
  }
}
```

> **layoutType**: `column` | `row` | `grid`

---

## 📋 Ejemplo de Página Completa Combinada

```json
{
  "canvas": {
    "color": "#fef3e2",
    "url": ""
  },
  "blocks": [
    {
      "id": "title-001",
      "type": "text",
      "data": {
        "content": "<h1 style='font-family: Georgia; color: #1e3a8a;'><em>Greetings</em></h1>",
        "bubbleType": "none",
        "x": 150,
        "y": 30,
        "width": 300,
        "height": 80,
        "rotate": 0,
        "zIndex": 10,
        "opacity": 1,
        "borderRadius": 0,
        "borderWidth": 0,
        "borderColor": "#ffffff",
        "boxShadow": "none",
        "color": "#1e3a8a",
        "bgColor": "transparent"
      }
    },
    {
      "id": "img-greetings",
      "type": "image",
      "data": {
        "url": "/media/images/greetings-poster.png",
        "alt": "Greetings illustration",
        "caption": "Daily greetings in English",
        "x": 30,
        "y": 120,
        "width": 480,
        "height": 500,
        "rotate": 0,
        "zIndex": 1,
        "opacity": 1,
        "borderRadius": 20,
        "borderWidth": 0,
        "borderColor": "#ffffff",
        "boxShadow": "none",
        "color": "#ffffff",
        "bgColor": "transparent"
      }
    },
    {
      "id": "audio-hello",
      "type": "audio",
      "data": {
        "url": "/media/audio/hello.mp3",
        "title": "Hello",
        "visualStyle": "hotspot",
        "x": 80,
        "y": 200,
        "width": 50,
        "height": 50,
        "zIndex": 15,
        "opacity": 1,
        "borderRadius": 999
      }
    },
    {
      "id": "audio-goodbye",
      "type": "audio",
      "data": {
        "url": "/media/audio/goodbye.mp3",
        "title": "Good bye",
        "visualStyle": "hotspot",
        "x": 80,
        "y": 460,
        "width": 50,
        "height": 50,
        "zIndex": 15,
        "opacity": 1,
        "borderRadius": 999
      }
    },
    {
      "id": "activities-label",
      "type": "text",
      "data": {
        "content": "<h2 style='color: #7c3aed; text-align: center;'>Activities</h2>",
        "bubbleType": "none",
        "x": 550,
        "y": 30,
        "width": 250,
        "height": 50,
        "zIndex": 10,
        "opacity": 1,
        "borderRadius": 20,
        "borderWidth": 2,
        "borderColor": "#7c3aed",
        "color": "#7c3aed",
        "bgColor": "#ffffff"
      }
    },
    {
      "id": "quiz-morning",
      "type": "quiz",
      "data": {
        "question": "What do you say in the morning?",
        "options": ["Good night", "Good morning", "Good bye", "See you later"],
        "answerIndex": 1,
        "feedback": "Excellent! Good morning is correct.",
        "x": 530,
        "y": 90,
        "width": 420,
        "height": 350,
        "zIndex": 3,
        "opacity": 1,
        "borderRadius": 20,
        "color": "#ffffff",
        "bgColor": "#0f172a"
      }
    },
    {
      "id": "matching-greetings",
      "type": "matching",
      "data": {
        "pairs": [
          { "left": "Hello", "right": "Hola" },
          { "left": "Good evening", "right": "Buenas noches" },
          { "left": "See you tomorrow", "right": "Hasta mañana" }
        ],
        "x": 530,
        "y": 460,
        "width": 420,
        "height": 280,
        "zIndex": 3,
        "opacity": 1,
        "borderRadius": 20,
        "color": "#ffffff",
        "bgColor": "#0f172a"
      }
    }
  ]
}
```

---

> **Notas de uso:**
> - Los campos `color` y `bgColor` son **globales** y aplican a todos los bloques
> - Las imágenes se recortan con el botón ✂ **Recortar** en el panel de propiedades
> - Los bloques se controlan en capas con **Traer Frente** / **Enviar Fondo**
> - El campo `textWithBlanks` del Cloze soporta `[respuesta1|respuesta2]` para múltiples respuestas válidas
> - El `visualStyle` del Audio puede ser `bar` (barra completa) o `hotspot` (botón flotante)
