
import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H8a1 1 0 01-1-1V4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ImageCardProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  onDownload?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ title, imageUrl, isLoading = false, onDownload }) => (
  <div className="w-full">
    <h2 className="text-xl font-semibold text-center text-slate-300 mb-4">{title}</h2>
    <div className="relative group aspect-square w-full rounded-2xl bg-slate-800/50 border-2 border-slate-700 backdrop-blur-sm flex items-center justify-center overflow-hidden transition-all duration-300">
      {isLoading && <Spinner className="w-12 h-12 text-fuchsia-400" />}
      {!isLoading && imageUrl && <img src={imageUrl} alt={title} className="w-full h-full object-contain" />}
      {!isLoading && !imageUrl && (
        <div className="text-slate-500 text-center p-4">
          <p>{title === 'Original' ? 'Upload an image to start' : 'Your edited image will appear here'}</p>
        </div>
      )}
      {!isLoading && imageUrl && onDownload && (
        <button
          onClick={onDownload}
          aria-label="Download edited image"
          className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-fuchsia-500/80 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transform group-hover:scale-110 focus:scale-110"
        >
          <DownloadIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup the object URL to avoid memory leaks
    return () => {
      if (originalImagePreview) {
        URL.revokeObjectURL(originalImagePreview);
      }
    };
  }, [originalImagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (originalImagePreview) {
        URL.revokeObjectURL(originalImagePreview);
      }
      setOriginalImageFile(file);
      setOriginalImagePreview(URL.createObjectURL(file));
      setEditedImage(null);
      setError(null);
    }
  };

  const handleDownload = useCallback(() => {
    if (editedImage) {
      const link = document.createElement('a');
      link.href = editedImage;
      const mimeType = editedImage.split(';')[0].split(':')[1] || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `alchemized-image.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [editedImage]);

  const handleSubmit = useCallback(async () => {
    if (!originalImageFile) {
      setError('Please upload an image first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter an editing prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = await fileToBase64(originalImageFile);
      const result = await editImageWithPrompt(base64Data, originalImageFile.type, prompt);
      setEditedImage(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [originalImageFile, prompt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-2">
            Image Alchemist
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Use AI to magically transform your images with a text prompt.</p>
        </header>

        <main>
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl shadow-fuchsia-500/10 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="flex flex-col gap-4">
                <label htmlFor="file-upload" className="cursor-pointer w-full bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-fuchsia-500 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center">
                  <UploadIcon className="w-10 h-10 mb-2" />
                  <span>{originalImageFile ? `Selected: ${originalImageFile.name}` : 'Click to Upload Image'}</span>
                </label>
                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <div className="flex flex-col gap-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Make it look like stained glass', 'Add a fantasy glow', 'Turn the dress into clear glass'"
                  className="w-full h-28 md:h-full bg-slate-800 border border-slate-600 rounded-xl p-4 placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors duration-300 resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !originalImageFile}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-fuchsia-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-3" />
                    Conjuring...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-3" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center mb-8" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <ImageCard title="Original" imageUrl={originalImagePreview} />
            <ImageCard title="Edited" imageUrl={editedImage} isLoading={isLoading} onDownload={handleDownload} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
