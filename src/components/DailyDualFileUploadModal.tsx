import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  FileText,
  Calendar,
  Check
} from 'lucide-react';
import { RawInventoryRecord } from '../types';
import {
  mergeDualStockAndSoldData,
  ParsedDataResult
} from '../utils/universalParser';
import { saveDailySnapshot } from '../utils/dailyStorageEngine';

interface DailyDualFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (records: RawInventoryRecord[], period: string) => void;
  currentPeriod?: string;
}

// Sample dataset matching the user's Solitaire Earring dual-matrix format
export const SAMPLE_SOLDOUT_MATRIX_TEXT = `Category Name,Branch Name,0.24,0.27,0.29,0.3,0.32,0.34,0.53,0.61,0.62,0.81,0.82,0.94,1,1.01,1.06,1.1,1.8,Total
D.Solitaire Earring,BCT,,,1,,,,,,,,,1,,,1,,,3
,BLY,,,1,,,,,,,,,,1,,,,,2
,BOG,,,,,,,,1,,,,,,,,,,1
,CTG,1,,,,1,,,,,,,,,,,,,2
,DMD,1,,,,,1,,,,,,,,,,,,2
,GUL,1,,1,,,1,,,1,1,,,,1,,,1,7
,KBH,,1,,,,,,,,,,,,,,,,1
,KHU,,,,,,,,,,,,,,,,1,,1
,MIR,,,,1,,,,,,,,,,,,,,1
,MOH,,,,,,,1,,,,,,,,,,,1
,ONL,1,,,,,,,,,,,,1,,,,,2
,RUP,,,,,,,,,,,,,1,,,,,1
,UTT,1,,,,,,,,,,1,,,,,,,2
,Total,5,1,3,1,1,2,1,1,1,1,1,1,3,1,1,1,1,26`;

export const SAMPLE_STOCK_MATRIX_TEXT = `Category Name,Branch Name,0.24,0.25,0.26,0.27,0.29,0.34,0.37,0.46,0.48,0.6,0.61,0.66,0.68,0.71,0.8,0.81,1,1.01,1.02,1.04,1.06,1.08,1.1,1.12,1.18,1.2,1.21,1.4,1.42,1.45,1.8,2,2.6,3,4,Total
D.Solitaire Earring,BAC,,,,,,,,,,,,,,,,,3,1,,,,,,1,,1,,1,,,,,,,,7
,BCT,1,,,,,,,,,,1,,,,1,,1,,,,,,,,,,,1,,,,,,,,5
,BLY,,,,,,,,,1,,,,,,,1,,,,,,,,,,,,,,,,,,,,2
,BOG,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1
,CHU,,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1
,CTG,,,,,,,,,,,,,,,,1,1,,,1,1,,,,1,,,1,,,,,,,,6
,CUM,,,,,,,,,,,,,,,,,,,,,,1,,,,,,,,,,,,,,1
,DMD,,,,1,,,,,,1,,,,,,1,1,,,,,,,,,,,2,,,,,,,,6
,DNM,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1
,DWL,,,,,,,,,,,,,1,,,,,,,,,,,,,,,,,,1,1,1,,,4
,GUL,,1,,,,,,1,,,,1,,1,,,3,,1,1,,1,1,1,,,2,,1,1,2,,,1,1,20
,JAS,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1
,KHU,,,,,,,,,,,,,,,,,1,,,,,,,,,,,,,,,,,,,1
,MIR,1,,1,,,,,,,1,,,,,,2,1,,,,,,,,,,,,,,1,,,,,7
,MOH,,,,,1,,,,,,,,,,,,1,,,,,,,,,,,,,,,,,,,2
,NAK,,,,,,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,1
,PCT,,,,,,,,,,,,,,,,,1,,,,,,,,,,,1,,,,,,,,2
,RAJ,,,,,,,,,,1,,,,,,,1,,,,,,,,,,,,,,,,,,,2
,RAN,,,,,,,,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,1
,RUP,,,,,,,,,,1,,,,,,,1,,,,,,,,,,,,,,,,,,,2
,SAV,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1
,SYL,,,,,,,,,,,,,,,,,1,,,,,,,,,,,,,,,,,,,1
,UTT,,,,,1,,1,,1,,,,,,,,,,1,,,,,1,,,,,,,,,,,,5
,Total :,3,1,1,1,5,1,1,1,2,5,1,2,1,1,1,5,16,1,2,2,1,2,1,3,1,1,2,6,1,1,4,1,1,1,1,80`;

export const DailyDualFileUploadModal: React.FC<DailyDualFileUploadModalProps> = ({
  isOpen,
  onClose,
  onImportRecords,
  currentPeriod = 'Last 30 Days'
}) => {
  const [stockFileName, setStockFileName] = useState('');
  const [stockContent, setStockContent] = useState<string | ArrayBuffer>('');
  const [stockMode, setStockMode] = useState<'upload' | 'paste'>('upload');

  const [soldFileName, setSoldFileName] = useState('');
  const [soldContent, setSoldContent] = useState<string | ArrayBuffer>('');
  const [soldMode, setSoldMode] = useState<'upload' | 'paste'>('upload');

  const [period, setPeriod] = useState(currentPeriod || 'Last 30 Days (Daily Update)');
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedDataResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcessMerge = (stock: string | ArrayBuffer, sold: string | ArrayBuffer) => {
    if (!stock || !sold) {
      setParsedResult(null);
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMsg('');
      const result = mergeDualStockAndSoldData(stock, sold, stockFileName || 'stock.csv', soldFileName || 'sold.csv');
      if (result.records.length === 0) {
        setErrorMsg('Could not detect any valid branch and carat records. Please verify headers contain Branch Name and Carat weights.');
        setParsedResult(null);
      } else {
        setParsedResult(result);
      }
    } catch (err: any) {
      setErrorMsg(`Error parsing files: ${err.message || 'Check file formatting'}`);
      setParsedResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStockFileName(file.name);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        setStockContent(buf);
        if (soldContent) {
          handleProcessMerge(buf, soldContent);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const txt = ev.target?.result as string;
        setStockContent(txt);
        if (soldContent) {
          handleProcessMerge(txt, soldContent);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSoldFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSoldFileName(file.name);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        setSoldContent(buf);
        if (stockContent) {
          handleProcessMerge(stockContent, buf);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const txt = ev.target?.result as string;
        setSoldContent(txt);
        if (stockContent) {
          handleProcessMerge(stockContent, txt);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    setStockFileName('Current_Stock_Report.csv');
    setStockContent(SAMPLE_STOCK_MATRIX_TEXT);
    setStockMode('paste');

    setSoldFileName('Soldout_Sales_Report.csv');
    setSoldContent(SAMPLE_SOLDOUT_MATRIX_TEXT);
    setSoldMode('paste');

    handleProcessMerge(SAMPLE_STOCK_MATRIX_TEXT, SAMPLE_SOLDOUT_MATRIX_TEXT);
  };

  const handleApply = () => {
    if (!parsedResult || parsedResult.records.length === 0) {
      setErrorMsg('Please upload both Stock and Sold Out files before applying.');
      return;
    }
    // Automatically save daily snapshot into the daily movement tracking engine
    saveDailySnapshot(
      parsedResult.records,
      undefined,
      `Daily Ingestion (${period}) - ${parsedResult.summary.totalStock} Pcs`
    );
    onImportRecords(parsedResult.records, period);
    onClose();
  };

  return (
    <div
      id="daily-dual-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Daily 2-File Upload (Current Stock & Sold Out Files)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Dual Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your daily Current Stock and Sold Out files (Excel, CSV, or paste text). The system will automatically map the matrices and calculate redistribution.
              </p>
            </div>
          </div>
          <button
            id="close-daily-upload-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Quick Helper Banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Format Support:</strong> Both files share the same branch rows and product/carat columns. The engine merges stock and sales to compute optimal redistribution.
              </span>
            </div>
            <button
              id="btn-load-sample-solitaire"
              type="button"
              onClick={handleLoadSample}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Load Sample Data (Solitaire Earring)
            </button>
          </div>

          {/* Two Side-by-side or stacked File Dropzones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Current Stock */}
            <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                      📦 Current Stock File
                      <span className="text-xs text-blue-400 font-normal">(Stock Data)</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setStockMode('upload')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      stockMode === 'upload' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    File
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode('paste')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      stockMode === 'paste' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Paste
                  </button>
                </div>
              </div>

              {stockMode === 'upload' ? (
                <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-850/50 hover:bg-slate-800/40 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleStockFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-blue-400" />
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200">
                      {stockFileName || 'Select or drop Current Stock file'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">.xlsx, .xls, .csv, .txt</p>
                  </div>
                  {stockFileName && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <Check className="w-3 h-3" /> File Selected
                    </span>
                  )}
                </label>
              ) : (
                <textarea
                  rows={4}
                  value={typeof stockContent === 'string' ? stockContent : ''}
                  onChange={(e) => {
                    setStockContent(e.target.value);
                    if (soldContent) handleProcessMerge(e.target.value, soldContent);
                  }}
                  placeholder="Paste Current Stock CSV / matrix text here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              )}
            </div>

            {/* Box 2: Sold Out */}
            <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                      🛒 Sold Out / Sales File
                      <span className="text-xs text-amber-400 font-normal">(Sales Demand)</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSoldMode('upload')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      soldMode === 'upload' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoldMode('paste')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      soldMode === 'paste' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Paste
                  </button>
                </div>
              </div>

              {soldMode === 'upload' ? (
                <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-850/50 hover:bg-slate-800/40 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleSoldFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-amber-400" />
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200">
                      {soldFileName || 'Select or drop Sold Out file'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">.xlsx, .xls, .csv, .txt</p>
                  </div>
                  {soldFileName && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <Check className="w-3 h-3" /> File Selected
                    </span>
                  )}
                </label>
              ) : (
                <textarea
                  rows={4}
                  value={typeof soldContent === 'string' ? soldContent : ''}
                  onChange={(e) => {
                    setSoldContent(e.target.value);
                    if (stockContent) handleProcessMerge(stockContent, e.target.value);
                  }}
                  placeholder="Paste Sold Out CSV / matrix text here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              )}
            </div>
          </div>

          {/* Period Setting */}
          <div className="flex items-center gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300">Sales Period:</span>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. Last 30 Days, Today, or Q1 2026"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Error Message if Any */}
          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Ingestion Summary & Preview */}
          {parsedResult && (
            <div className="border border-slate-800 rounded-xl bg-slate-850/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Combined Ingestion Summary (Verified Data)
                </h4>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready to Ingest
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Branches</span>
                  <span className="text-base font-bold text-slate-100">
                    {parsedResult.summary.branchesFound}
                  </span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Carats / Products</span>
                  <span className="text-base font-bold text-slate-100">
                    {parsedResult.summary.weightsFound}
                  </span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Current Stock</span>
                  <span className="text-base font-bold text-blue-400">
                    {parsedResult.summary.totalStock} pcs
                  </span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Sold Quantity</span>
                  <span className="text-base font-bold text-amber-400">
                    {parsedResult.summary.totalSold} pcs
                  </span>
                </div>
              </div>

              {/* Sample 5 Records Preview */}
              <div className="mt-2">
                <span className="text-[11px] text-slate-400 block mb-1.5">Sample Merged Records:</span>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 border-b border-slate-800 font-semibold">Branch</th>
                        <th className="px-3 py-1.5 border-b border-slate-800 font-semibold">Carat / Item</th>
                        <th className="px-3 py-1.5 border-b border-slate-800 font-semibold text-right">Current Stock</th>
                        <th className="px-3 py-1.5 border-b border-slate-800 font-semibold text-right">Sold Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                      {parsedResult.records.slice(0, 6).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="px-3 py-1 font-sans font-medium text-slate-200">{rec.branch}</td>
                          <td className="px-3 py-1">{rec.weight}</td>
                          <td className="px-3 py-1 text-right text-blue-400 font-semibold">{rec.currentStock}</td>
                          <td className="px-3 py-1 text-right text-amber-400 font-semibold">{rec.soldQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {(!parsedResult || parsedResult.records.length === 0) && (
              <button
                type="button"
                onClick={() => {
                  if (stockContent && soldContent) {
                    handleProcessMerge(stockContent, soldContent);
                  } else {
                    setErrorMsg('Please select or paste both files to process.');
                  }
                }}
                disabled={!stockContent || !soldContent}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 disabled:opacity-50 transition-colors"
              >
                Verify & Merge Files
              </button>
            )}

            <button
              id="btn-apply-daily-upload"
              type="button"
              onClick={handleApply}
              disabled={!parsedResult || parsedResult.records.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply & Calculate Redistribution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
