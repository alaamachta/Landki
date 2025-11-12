import type { ChatKitOptions } from "@openai/chatkit";

const options: ChatKitOptions = {
  api: {
    // TODO: configure your ChatKit API integration (URL, auth, uploads).
  },
  theme: {
    colorScheme: 'dark',
    radius: 'round',
    density: 'normal',
    color: {
      grayscale: {
        hue: 234,
        tint: 4,
        shade: -3
      }
    },
    typography: {
      baseSize: 16,
      fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
      fontSources: [
        {
          family: 'OpenAI Sans',
          src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
          weight: 400,
          style: 'normal',
          display: 'swap'
        }
      // ...and 7 more font sources
      ]
    }
  },
  composer: {
    placeholder: 'Frag mich alles rund um Alaa, seine Projekte oder KI!',
    attachments: {
      enabled: true,
      maxCount: 5,
      maxSize: 10485760
    },
  },
  startScreen: {
    greeting: '👋 Willkommen beim Interview Assistent von Alaa Mashta!',
    prompts: [
      {
        icon: 'circle-help',
        label: 'Erzählen Sie mir kurz über sich.',
        prompt: 'Erzählen Sie mir kurz über sich.'
      },
      {
        icon: 'bot',
        label: 'Welche Ihrer Erfahrungen ist für KI-Integration besonders relevant?',
        prompt: 'Welche Ihrer Erfahrungen ist für KI-Integration besonders relevant?'
      },
      {
        icon: 'rocket',
        label: 'Wie erklären Sie Ihr Projekt LandKI?',
        prompt: 'Wie erklären Sie Ihr Projekt LandKI?'
      }
    ],
  },
  // Optional fields not shown: locale, initialThread, threadItemActions, header, onClientTool, entities, widgets
};