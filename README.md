# 🌐 Multilingual AI Speech Converter

Convert live audio speech and audio files to text, with real-time AI translation and refinement using Google Gemini.

![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ Features

### 🎙️ Audio Input
- **Live Microphone Recording** — Record speech directly from your browser with real-time audio waveform visualization
- **Audio File Upload** — Upload pre-recorded audio files (MP3, WAV, WebM, M4A, etc.)

### 🌍 AI Translation & Transcription
- **Transcribe** — Convert speech to text in the source language with high accuracy
- **Translate** — Transcribe and translate speech into any of 12+ supported languages in a single step
- **Live Interpreter** — Real-time speech-to-translation using the Web Speech API with continuous listening

### 🧠 AI Text Refinement (Post-Processing)
- **Polish** — Clean up filler words, stuttering, and false starts while preserving meaning
- **Summarize** — Generate concise executive summaries of transcriptions
- **Extract Notes** — Transform spoken content into organized bullet points and action items
- **Rewrite** — Rephrase transcriptions in a specific tone (Professional, Friendly, Academic, Humorous)

### 🔊 Speech Synthesis
- Auto-speak translated/transcribed results using the Web Speech Synthesis API
- Language-aware voice selection for natural-sounding playback

### 📦 Export & History
- Download transcripts as **TXT**, **SRT**, or **JSON**
- Persistent session history stored in `localStorage`
- Copy-to-clipboard for quick sharing

---

## 🗣️ Supported Languages

| Source (Input) | Target (Output) |
|---|---|
| Auto-Detect | Spanish |
| English | French |
| Spanish | Japanese |
| French | German |
| Japanese | Chinese |
| German | Hindi |
| Chinese (Mandarin) | Arabic |
| Hindi | Italian |
| Arabic | Russian |
| Portuguese | Portuguese |
| Italian | Korean |
| Russian | English |
| Korean | |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide Icons |
| **Backend** | Express.js, Node.js |
| **AI Engine** | Google Gemini API (`@google/genai`) with automatic model fallback |
| **Build Tool** | Vite 6 |
| **Speech APIs** | Web Speech API (recognition), Web Speech Synthesis API (TTS), MediaRecorder API |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later recommended)
- A **Gemini API key** — get one from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tanveersingh0902/Multilingual-AI-Speech-Converter.git
   cd Multilingual-AI-Speech-Converter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API key:**

   Create a `.env.local` file in the project root (or copy from `.env.example`):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

The Express backend exposes two API routes:

### `POST /api/transcribe`
Transcribes or translates audio using Gemini.

**Request body:**
```json
{
  "audio": "<base64-encoded audio>",
  "mimeType": "audio/webm",
  "targetLanguage": "Spanish",
  "audioTask": "translate",
  "sourceLanguage": "Auto-Detect"
}
```

### `POST /api/process-text`
Refines, translates, or transforms text using Gemini.

**Request body:**
```json
{
  "text": "Your transcript text here",
  "mode": "polish | summarize | extract-notes | rewrite | translate",
  "targetLanguage": "French",
  "tone": "professional"
}
```

---

## 📁 Project Structure

```
Multilingual-AI-Speech-Converter/
├── src/
│   ├── App.tsx          # Main React application component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles (Tailwind)
├── server.ts            # Express backend with Gemini API integration
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variable template
└── metadata.json        # AI Studio app metadata
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with Vite HMR |
| `npm run build` | Build for production (frontend + backend) |
| `npm start` | Run the production build |
| `npm run lint` | Type-check with TypeScript |
| `npm run clean` | Remove build artifacts |

---

## ⚙️ How It Works

1. **Audio Capture** — The browser's MediaRecorder API captures microphone audio (or accepts an uploaded file).
2. **Base64 Encoding** — Audio is converted to a base64 string and sent to the Express backend.
3. **Gemini Processing** — The server sends the audio to the Gemini API with a tailored prompt for transcription or translation. It automatically falls back through multiple Gemini models (`gemini-3.5-flash` → `gemini-flash-latest` → `gemini-3.1-flash-lite`) with retry logic for transient errors.
4. **Result Display** — The transcription/translation is displayed in the UI with options for further AI refinement.
5. **Speech Output** — Results can be auto-spoken using the Web Speech Synthesis API with language-appropriate voices.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source. See the repository for license details.
