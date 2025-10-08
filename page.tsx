"use client";

import { useState, useRef, ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import { X, Upload, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), {
  ssr: false,
  loading: () => <p className="text-blue-500">PDF Viewer wird geladen...</p>,
});
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), {
  ssr: false,
  loading: () => <p className="text-blue-500">Seite wird geladen...</p>,
});

if (typeof window !== 'undefined') {
  const { pdfjs } = require('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs`;
}

interface PdfUploadResponse {
  filename: string;
  content: string;
  pdf_url: string;
}

interface TranslationResponse {
  original_word: string;
  translated_word: string;
}

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  const [selectedText, setSelectedText] = useState<string>('');
  const [translationResult, setTranslationResult] = useState<string>('');
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContentContainerRef = useRef<HTMLDivElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingPdf(true);
    setUploadError('');
    setPdfUrl(null);
    setNumPages(null);
    setPageNumber(1);
    setSelectedText('');
    setTranslationResult('');
    setTranslationLoading(false);
    setTranslationError('');
    setShowTranslation(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-pdf-and-get-content/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Fehler beim Hochladen der PDF-Datei.');
      }

      const data: PdfUploadResponse = await response.json();
      setPdfUrl(`http://localhost:8000${data.pdf_url}`);
      setShowHeader(false); // Header ausblenden nach erfolgreichem Upload

    } catch (err: any) {
      setUploadError(err.message);
      console.error('Upload Error:', err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    if (pdfContentContainerRef.current) {
      pdfContentContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (numPages && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      if (pdfContentContainerRef.current) {
        pdfContentContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handleSelection = async () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      setTranslationLoading(true);
      setTranslationResult('');
      setTranslationError('');
      setShowTranslation(true);

      try {
        const response = await fetch(`http://localhost:8000/translate/?text_to_translate=${encodeURIComponent(text)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Fehler bei der Übersetzung.');
        }

        const data: TranslationResponse = await response.json();
        setTranslationResult(data.translated_word);

      } catch (err: any) {
        console.error('Translation Error:', err);
        setTranslationResult('');
        setTranslationError(err.message || 'Ein unbekannter Fehler bei der Übersetzung ist aufgetreten.');
      } finally {
        setTranslationLoading(false);
      }
    }
  };

  const closeTranslation = () => {
    setShowTranslation(false);
    setSelectedText('');
    setTranslationResult('');
    setTranslationError('');
  };

  const closePdfViewer = () => {
    setPdfUrl(null);
    setNumPages(null);
    setPageNumber(1);
    setShowHeader(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePageInputClick = () => {
    setIsEditingPage(true);
    setPageInput(pageNumber.toString());
    setTimeout(() => pageInputRef.current?.select(), 0);
  };

  const handlePageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const newPage = parseInt(pageInput, 10);
    if (!isNaN(newPage) && numPages && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      if (pdfContentContainerRef.current) {
        pdfContentContainerRef.current.scrollTop = 0;
      }
    }
    setIsEditingPage(false);
    setPageInput('');
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingPage(false);
      setPageInput('');
    }
  };

  const handlePageInputBlur = () => {
    handlePageInputSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        {showHeader && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                PDF Übersetzer
              </h1>
            </div>

            {/* Upload Section */}
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingPdf}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                PDF hochladen
              </button>
              {fileInputRef.current?.files?.[0] && (
                <span className="text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-lg">
                  {fileInputRef.current.files[0].name}
                </span>
              )}
            </div>

            {loadingPdf && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p>PDF wird geladen...</p>
              </div>
            )}
            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-semibold">Fehler beim Hochladen:</p>
                <p>{uploadError}</p>
              </div>
            )}
          </div>
        )}

        {/* PDF Viewer */}
        {pdfUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {/* Close Button */}
            <button
              onClick={closePdfViewer}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 shadow-md"
              title="PDF schließen"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>

            {/* Page Navigation */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handlePageChange(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </button>

              {isEditingPage ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={pageInputRef}
                    type="number"
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={handlePageInputBlur}
                    min="1"
                    max={numPages || undefined}
                    className="w-16 px-2 py-1 text-center text-lg font-semibold text-slate-900 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ color: '#000' }}
                  />
                  <span className="text-lg font-semibold text-slate-700">
                    von {numPages || '...'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handlePageInputClick}
                  className="text-lg font-semibold text-slate-700 min-w-[140px] px-4 py-1 hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer"
                  title="Klicken um Seite einzugeben"
                >
                  Seite {pageNumber} von {numPages || '...'}
                </button>
              )}

              <button
                onClick={() => handlePageChange(pageNumber + 1)}
                disabled={numPages === null || pageNumber >= numPages}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Weiter
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Container */}
            <div
              ref={pdfContentContainerRef}
              onMouseUp={handleSelection}
              className="border-2 border-slate-200 rounded-xl overflow-y-auto bg-slate-50 p-6"
              style={{ maxHeight: showHeader ? 'calc(100vh - 350px)' : 'calc(100vh - 200px)' }}
            >
              <div className="flex justify-center">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => setUploadError('Fehler beim Laden der PDF-Datei: ' + error.message)}
                  loading={
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <p>PDF-Dokument wird vorbereitet...</p>
                    </div>
                  }
                  noData={<p className="text-slate-500">Keine PDF-Datei ausgewählt.</p>}
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={Math.min(850, window.innerWidth - 100)}
                    loading={
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p>Seite wird gerendert...</p>
                      </div>
                    }
                  />
                </Document>
              </div>
            </div>

            {/* Translation Overlay */}
            {showTranslation && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-800">Übersetzung</h3>
                    <button
                      onClick={closeTranslation}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-6 h-6 text-slate-600" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Original Text */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Ausgewählter Text
                      </h4>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-slate-800 leading-relaxed">{selectedText}</p>
                      </div>
                    </div>

                    {/* Translation */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Übersetzung
                      </h4>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        {translationLoading ? (
                          <div className="flex items-center gap-3 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <p>Übersetzung wird geladen...</p>
                          </div>
                        ) : translationError ? (
                          <p className="text-red-600 font-medium">{translationError}</p>
                        ) : (
                          <p className="text-slate-800 text-lg leading-relaxed font-medium">
                            {translationResult || 'Keine Übersetzung verfügbar.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={closeTranslation}
                      className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!pdfUrl && !loadingPdf && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Keine PDF geladen
              </h3>
              <p className="text-slate-500">
                Laden Sie eine PDF-Datei hoch, um mit der Übersetzung zu beginnen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}