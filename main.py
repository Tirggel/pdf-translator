from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from pathlib import Path
import requests
import io
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/generate"
TRANSLATION_MODEL = "gemma3:1b"
UPLOAD_DIR = Path("uploaded_pdfs")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload-pdf-and-get-content/")
async def upload_pdf_and_get_content(file: UploadFile = File(...)):
    """Empfängt ein PDF, speichert es temporär, extrahiert den Text und gibt beides zurück."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Nur PDF-Dateien erlaubt.")

    file_id = Path(file.filename).stem
    unique_filename = f"{hash(file_id + str(Path().absolute()))}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        content = await file.read()
        file_path.write_bytes(content)
        
        # Text extrahieren
        text_content = "\n".join(
            page.extract_text() for page in PdfReader(io.BytesIO(content)).pages
        )
            
        return JSONResponse({
            "filename": file.filename,
            "content": text_content,
            "pdf_url": f"/pdfs/{unique_filename}"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Verarbeiten: {e}")

@app.get("/pdfs/{filename:path}")
async def get_pdf(filename: str):
    """Serviert die gespeicherte PDF-Datei."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF nicht gefunden.")
    return FileResponse(file_path, media_type="application/pdf")

@app.post("/translate/")
async def translate_text(text_to_translate: str, target_language: str = "German"):
    """Übersetzt einen Text mit Ollama."""
    prompt = (
        f"Translate the following English text to {target_language}: '{text_to_translate}'. "
        "Only respond with the translated text, no extra conversational text or explanations."
    )
    
    payload = {
        "model": TRANSLATION_MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
        response.raise_for_status()
        
        translated_text = response.json()["response"].strip().replace('"', '')
        return {"original_word": text_to_translate, "translated_word": translated_text}

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=500,
            detail="Verbindung zu Ollama fehlgeschlagen. Stelle sicher, dass Ollama läuft."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=500, detail="Ollama-Anfrage Timeout.")
    except KeyError:
        raise HTTPException(status_code=500, detail="Unerwartete Antwort von Ollama.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
