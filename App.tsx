import React, { useState } from 'react';
import { ParsedData, ProcessingStatus } from './types';
import Dropzone from './components/Dropzone';
import ResultsTable from './components/ResultsTable';
import { processPdfFile } from './utils/pdfProcessor';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { EXTRACTION_RULES } from './constants';
import * as XLSX from 'xlsx';

const MONTH_ORDER = [
  'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 
  'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'
];

function App() {
  const [data, setData] = useState<ParsedData[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progress, setProgress] = useState<{current: number, total: number}>({current: 0, total: 0});

  const handleFiles = async (files: File[]) => {
    setStatus(ProcessingStatus.PROCESSING);
    setProgress({ current: 0, total: files.length });
    
    const results: ParsedData[] = [];

    // Process sequentially to avoid browser freezing
    for (let i = 0; i < files.length; i++) {
      const result = await processPdfFile(files[i]);
      results.push(result);
      setProgress({ current: i + 1, total: files.length });
    }

    // Merge with existing data, avoiding duplicates based on filename
    setData(prev => {
      const existingNames = new Set(prev.map(p => p.filename));
      const newUnique = results.filter(r => !existingNames.has(r.filename));
      return [...prev, ...newUnique];
    });

    setStatus(ProcessingStatus.COMPLETED);
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;

    // Sort data chronologically before exporting
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      
      const monthA = MONTH_ORDER.indexOf(a.month.toLowerCase().trim());
      const monthB = MONTH_ORDER.indexOf(b.month.toLowerCase().trim());
      
      const valA = monthA === -1 ? 99 : monthA;
      const valB = monthB === -1 ? 99 : monthB;
      
      return valA - valB;
    });

    // Transform data for XLSX
    const sheetData = sortedData.map((item, index) => {
      const row: Record<string, string | number> = {
        'Sıra': index + 1,
        'Dosya Adı': item.filename,
        'Dönem Yıl': item.year,
        'Dönem Ay': item.month,
      };

      EXTRACTION_RULES.forEach(rule => {
        // Convert string number "1.000,50" to JS number 1000.50 for Excel math
        const rawVal = item.data[rule.label];
        if (rawVal) {
          // Remove dots (thousands), replace comma with dot (decimal)
          const numVal = parseFloat(rawVal.replace(/\./g, '').replace(',', '.'));
          row[rule.label] = isNaN(numVal) ? rawVal : numVal;
        } else {
          row[rule.label] = '';
        }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);

    // Auto-adjust column widths
    const wscols = Object.keys(sheetData[0]).map(key => {
        return { wch: Math.max(20, key.length + 5) }; // Minimum 20 chars width
    });
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KDV Verileri");
    XLSX.writeFile(wb, "KDV_Beyanname_Listesi.xlsx");
  };

  const clearData = () => {
    setData([]);
    setStatus(ProcessingStatus.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">KDV Beyanname Aktarıcı</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Veriler cihazınızda işlenir, sunucuya gönderilmez.
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Input Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
           <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1">
               <h2 className="text-lg font-semibold mb-4">Dosya Yükleme</h2>
               <Dropzone onFilesDropped={handleFiles} isProcessing={status === ProcessingStatus.PROCESSING} />
             </div>
             
             <div className="flex-1 flex flex-col justify-center gap-4 border-l border-slate-100 pl-6 border-dashed md:border-solid">
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-700">Nasıl Çalışır?</h3>
                  <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
                    <li>PDF formatındaki KDV (1015A) beyannamelerini sürükleyin.</li>
                    <li>Sistem otomatik olarak Dönem, Matrah ve Vergi bilgilerini okur.</li>
                    <li>Sonuçları Excel tablosu olarak indirebilirsiniz.</li>
                  </ul>
                </div>

                {status === ProcessingStatus.PROCESSING && (
                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">İşleniyor... ({progress.current}/{progress.total})</span>
                  </div>
                )}
             </div>
           </div>
        </section>

        {/* Results Section */}
        {data.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Sonuçlar</h2>
              <div className="flex gap-2">
                <button 
                  onClick={clearData}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Temizle
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow active:scale-95 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Excel'e Aktar
                </button>
              </div>
            </div>
            
            <ResultsTable data={data} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;