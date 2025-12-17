import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
  isProcessing: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesDropped, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type === 'application/pdf');
    if (droppedFiles.length > 0) {
      onFilesDropped(droppedFiles);
    }
  }, [onFilesDropped, isProcessing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files) {
      const selectedFiles = (Array.from(e.target.files) as File[]).filter(file => file.type === 'application/pdf');
      onFilesDropped(selectedFiles);
    }
  }, [onFilesDropped, isProcessing]);

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
        ${isProcessing 
          ? 'bg-slate-50 border-slate-300 cursor-not-allowed opacity-60' 
          : 'bg-white border-primary-200 hover:border-primary-500 hover:bg-primary-50 cursor-pointer shadow-sm hover:shadow-md'}
      `}
    >
      <input 
        type="file" 
        multiple 
        accept=".pdf" 
        onChange={handleChange} 
        className="hidden" 
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <div className="bg-primary-100 p-4 rounded-full mb-4">
          <Upload className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          PDF Dosyalarını Buraya Sürükleyin
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
          veya seçmek için tıklayın. Birden fazla dosya seçebilirsiniz (KDV Beyannamesi 1015A).
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="w-4 h-4" />
          <span>Sadece .pdf formatı</span>
        </div>
      </label>
    </div>
  );
};

export default Dropzone;