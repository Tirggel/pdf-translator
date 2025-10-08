# PDF Übersetzer

Ein modernes Web-Tool zum Hochladen, Anzeigen und Übersetzen von PDF-Dokumenten. Wählen Sie einfach Text in Ihrem PDF aus und erhalten Sie sofortige Übersetzungen mithilfe lokaler KI-Modelle.

## Features

- 📄 **PDF Upload & Anzeige** - Laden Sie PDF-Dateien hoch und zeigen Sie sie direkt im Browser an
- 🔍 **Text-Selektion** - Wählen Sie beliebigen Text im PDF aus
- 🌐 **Sofortige Übersetzung** - Erhalten Sie automatisch Übersetzungen des ausgewählten Textes
- 🎨 **Modernes UI** - Benutzerfreundliche Oberfläche mit Tailwind CSS
- 🔒 **Lokal & Privat** - Verwendet Ollama für lokale KI-Übersetzungen ohne Cloud-Abhängigkeit
- ⚡ **FastAPI Backend** - Schnelles und effizientes Python-Backend

## Tech Stack

### Frontend
- **Next.js** - React Framework
- **TypeScript** - Typsicherheit
- **Tailwind CSS** - Styling
- **react-pdf** - PDF-Rendering
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python Web Framework
- **pypdf** - PDF-Textextraktion
- **Ollama** - Lokale KI für Übersetzungen
- **Uvicorn** - ASGI Server

## Voraussetzungen

- **Node.js** (v18 oder höher)
- **Python** (v3.8 oder höher)
- **Ollama** - Installiert und laufend ([Installation](https://ollama.ai))

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/Tirggel/pdf-translator.git
cd pdf-translator
```

### 2. Ollama einrichten

Installieren Sie Ollama und laden Sie das Übersetzungsmodell:

```bash
# Ollama installieren (falls noch nicht geschehen)
# Siehe: https://ollama.ai

# Modell herunterladen
ollama pull gemma3:1b
```

### 3. Backend einrichten

```bash
# Python Virtual Environment erstellen
python -m venv venv

# Virtual Environment aktivieren
# Windows:
venv\Scripts\activate
# macOS/Linux (bash/zsh):
source venv/bin/activate
# macOS/Linux (fish):
source venv/bin/activate.fish

# Dependencies installieren
pip install -r requirements.txt
# oder manuell:
# pip install fastapi uvicorn pypdf python-multipart requests

# Backend starten
python main.py
```

Das Backend läuft nun auf `http://localhost:8000`

### 4. Frontend einrichten

```bash
# In einem neuen Terminal
# Next.js Projekt erstellen (falls noch nicht vorhanden)
npx create-next-app@latest pdf-translator-frontend
# Wählen Sie: TypeScript: Yes, Tailwind CSS: Yes, App Router: Yes

cd pdf-translator-frontend

# Dependencies installieren
npm install react-pdf lucide-react

# page.tsx in den richtigen Ordner kopieren
# Die page.tsx Datei muss nach app/page.tsx kopiert werden
# Ersetzen Sie die vorhandene app/page.tsx mit der bereitgestellten Datei

# Development Server starten
npm run dev
# oder
yarn dev
```

Das Frontend läuft nun auf `http://localhost:3000`

## Verwendung

1. Öffnen Sie `http://localhost:3000` in Ihrem Browser
2. Klicken Sie auf "PDF hochladen" und wählen Sie eine PDF-Datei
3. Navigieren Sie durch die Seiten mit den Pfeiltasten
4. Markieren Sie beliebigen Text im PDF
5. Die Übersetzung erscheint automatisch in einem Overlay

## Konfiguration

### Backend (main.py)

```python
OLLAMA_API_URL = "http://localhost:11434/api/generate"
TRANSLATION_MODEL = "gemma3:1b"  # Ändern Sie das Modell nach Bedarf
UPLOAD_DIR = Path("uploaded_pdfs")
```

### Frontend CORS

Das Backend erlaubt standardmäßig nur Anfragen von `http://localhost:3000`. Ändern Sie dies in `main.py`, falls erforderlich:

```python
allow_origins=["http://localhost:3000"]
```

## Troubleshooting

### Ollama-Verbindungsfehler
- Stellen Sie sicher, dass Ollama läuft: `ollama serve`
- Überprüfen Sie, ob das Modell installiert ist: `ollama list`

### PDF lädt nicht
- Überprüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass das Backend läuft
- Prüfen Sie CORS-Einstellungen

### Übersetzung funktioniert nicht
- Überprüfen Sie die Ollama-Logs
- Testen Sie das Modell direkt: `ollama run gemma3:1b "Translate to German: Hello"`

## Lizenz

MIT License - Siehe LICENSE-Datei für Details

## Autor

[Peter Rubin](https://github.com/Tirggel)

