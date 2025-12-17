import React from 'react';
import { ParsedData } from '../types';
import { EXTRACTION_RULES } from '../constants';
import { FileX, CheckCircle } from 'lucide-react';

interface ResultsTableProps {
  data: ParsedData[];
}

const MONTH_ORDER = [
  'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 
  'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'
];

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Sort data by Year then Month (Chronological)
  const sortedData = [...data].sort((a, b) => {
    // 1. Sort by Year
    if (a.year !== b.year) {
      return a.year.localeCompare(b.year);
    }
    
    // 2. Sort by Month Index
    const monthA = MONTH_ORDER.indexOf(a.month.toLowerCase().trim());
    const monthB = MONTH_ORDER.indexOf(b.month.toLowerCase().trim());
    
    // Handle cases where month might not be found (put at end)
    const valA = monthA === -1 ? 99 : monthA;
    const valB = monthB === -1 ? 99 : monthB;
    
    return valA - valB;
  });

  return (
    <div className="w-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          İşlenen Dosyalar ({data.length})
        </h2>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b font-bold bg-slate-100 min-w-[150px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Dönem</th>
              <th className="px-4 py-3 border-b font-medium min-w-[200px]">Dosya Adı</th>
              {EXTRACTION_RULES.map((rule) => (
                <th key={rule.key} className="px-4 py-3 border-b font-medium min-w-[180px] whitespace-nowrap">
                  {rule.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className="bg-white border-b hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {row.error ? <span className="text-red-500 flex items-center gap-1"><FileX className="w-4 h-4" /> Hata</span> : row.period}
                </td>
                <td className="px-4 py-3 truncate max-w-[200px]" title={row.filename}>
                  {row.filename}
                </td>
                {EXTRACTION_RULES.map((rule) => (
                  <td key={rule.key} className="px-4 py-3 font-mono text-slate-700 text-right">
                    {row.data[rule.label] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;