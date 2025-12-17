import * as pdfjsLib from 'pdfjs-dist';
import { ExtractionRule, ParsedData } from '../types';
import { EXTRACTION_RULES } from '../constants';

// Configure worker to use the specific version matching the import in index.html
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TURKISH_CURRENCY_REGEX = /^-?[\d\.]+,\d{2}$/;

interface TextItem {
  str: string;
  x: number;
  y: number; // PDF coordinates (0,0 is bottom-left usually)
  w: number;
  h: number;
}

/**
 * Extracts all text items with their coordinates from a PDF page.
 */
const extractPageItems = async (page: any): Promise<TextItem[]> => {
  const textContent = await page.getTextContent();
  
  return textContent.items.map((item: any) => {
    // Transform matrix [scaleX, skewY, skewX, scaleY, translateX, translateY]
    // item.transform[4] is X, item.transform[5] is Y
    return {
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      w: item.width,
      h: item.height
    };
  });
};

/**
 * Groups items into lines based on Y-coordinate proximity.
 * This is crucial for table data extraction.
 */
const groupItemsByLine = (items: TextItem[]): TextItem[][] => {
  const sortedItems = [...items].sort((a, b) => b.y - a.y); // Sort Top to Bottom
  const lines: TextItem[][] = [];
  
  if (sortedItems.length === 0) return lines;

  let currentLine: TextItem[] = [sortedItems[0]];
  
  for (let i = 1; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const prevItem = currentLine[0]; // Representative of the line height
    
    // If Y difference is small (e.g. less than 5 units), consider it the same line
    if (Math.abs(item.y - prevItem.y) < 6) {
      currentLine.push(item);
    } else {
      // Sort the completed line by X (Left to Right)
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
      currentLine = [item];
    }
  }
  
  // Push the last line
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine);
  }

  return lines;
};

const findValueInLine = (line: TextItem[]): string => {
  // Look for the right-most item that matches currency format
  // We iterate from right to left because the amount is usually at the end of the line
  for (let i = line.length - 1; i >= 0; i--) {
    const text = line[i].str.trim();
    if (TURKISH_CURRENCY_REGEX.test(text) || text === '0,00') {
      return text;
    }
  }
  return '';
};

const getMonthYear = (lines: TextItem[][]) => {
  let year = '';
  let month = '';

  const findMonth = (str: string): string => {
    const clean = str.trim().toLocaleLowerCase('tr-TR');
    // Check strict equality first for robustness, then includes
    const foundIndex = MONTH_NAMES.findIndex(m => {
        const mLower = m.toLocaleLowerCase('tr-TR');
        return clean === mLower || clean.includes(mLower);
    });
    return foundIndex !== -1 ? MONTH_NAMES[foundIndex] : '';
  };

  // Strategy 1: Look for "Ay" and "Yıl" headers which usually appear in the top section
  // In KDV forms, typically there is a row with "Ay" and "Yıl" headers, and the values are directly below them.
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for "Ay" header
    const ayHeader = line.find(item => item.str.trim() === 'Ay');
    if (ayHeader && !month) {
        // Look at next few lines for value at similar X position (columnar layout)
        // We look up to 3 lines down because sometimes there are horizontal separator lines
        for (let j = 1; j <= 3; j++) {
            if (i + j >= lines.length) break;
            const nextLine = lines[i+j];
            
            // Find item in next line that overlaps horizontally with the "Ay" header
            // Increased tolerance to 35 units to handle scanned documents better
            const valItem = nextLine.find(item => Math.abs(item.x - ayHeader.x) < 35); 
            
            if (valItem) {
                const found = findMonth(valItem.str);
                if (found) {
                    month = found;
                    break; 
                }
            }
        }
    }

    // Check for "Yıl" header
    const yilHeader = line.find(item => item.str.trim() === 'Yıl');
    if (yilHeader && !year) {
         for (let j = 1; j <= 3; j++) {
            if (i + j >= lines.length) break;
            const nextLine = lines[i+j];
            const valItem = nextLine.find(item => Math.abs(item.x - yilHeader.x) < 35);
            if (valItem && /20\d{2}/.test(valItem.str)) {
                year = valItem.str.trim();
                break; 
            }
        }
    }
    
    if (month && year) break;
  }

  // Strategy 2: Fallback to scanning all text if headers failed
  if (!month || !year) {
      // Limit to first 30 lines usually enough for header
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i];
        for (const item of line) {
             const t = item.str.trim();
             if (!year && /20\d{2}/.test(t)) year = t;
             if (!month) {
                 const m = findMonth(t);
                 if (m) month = m;
             }
        }
        if (month && year) break;
      }
  }

  return { year, month };
};

export const processPdfFile = async (file: File): Promise<ParsedData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allLines: TextItem[][] = [];

    // Extract all lines from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const items = await extractPageItems(page);
      const pageLines = groupItemsByLine(items);
      allLines = [...allLines, ...pageLines];
    }

    const { year, month } = getMonthYear(allLines);
    
    const extractedData: Record<string, string> = {};

    // For each rule, find the line that contains the label, then find the value in that line
    EXTRACTION_RULES.forEach(rule => {
      let foundValue = '';

      for (const line of allLines) {
        // Construct full text of the line to check against search phrase
        const lineText = line.map(item => item.str).join(' '); // Join with space to prevent glued words
        
        // Check if any search phrase exists in this line
        const matchedPhrase = rule.searchPhrases.find(phrase => lineText.includes(phrase));
        
        if (matchedPhrase) {
          // Rule matched this line. Now look for the value.
          const val = findValueInLine(line);
          if (val) {
            foundValue = val;
            break; // Stop searching for this rule once found
          }
        }
      }
      
      extractedData[rule.label] = foundValue;
    });

    return {
      filename: file.name,
      year,
      month,
      period: `${month} ${year}`.trim(),
      data: extractedData
    };

  } catch (error) {
    console.error("PDF Parsing Error", error);
    return {
      filename: file.name,
      year: '',
      month: '',
      period: 'HATA',
      data: {},
      error: 'Dosya okunamadı veya bozuk.'
    };
  }
};