import React, { useState, useMemo } from 'react';
import { RedistributionReport, SalesTimeframe } from '../types';
import { getOptionAllocationSummary } from '../utils/redistributionEngine';
import {
  Gem,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Building2,
  Calendar,
  Share2,
  Printer,
  ChevronRight,
  Home
} from 'lucide-react';

interface OptionWiseAllocationViewProps {
  report: RedistributionReport;
  selectedWeight?: string;
  onSelectBranch?: (branch: string) => void;
  onSelectWeight?: (weight: string) => void;
  onBackToHome?: () => void;
}

export const OptionWiseAllocationView: React.FC<OptionWiseAllocationViewProps> = ({
  report,
  selectedWeight: initialWeight = "0.02",
  onSelectBranch,
  onSelectWeight,
  onBackToHome
}) => {
  // Available weights in dataset
  const availableWeights = report.matrix.weights;

  // Selected Option / Weight
  const [activeWeight, setActiveWeight] = useState<string>(() => {
    if (initialWeight && availableWeights.includes(initialWeight)) return initialWeight;
    if (availableWeights.includes("0.02")) return "0.02";
    return availableWeights[0] || "0.24";
  });

  // Multi-Period Sales Filter (Last 3 Months, 6 Months, 1 Year, 2 Years)
  const [timeframe, setTimeframe] = useState<SalesTimeframe>('6M');

  // Growth Elasticity Multiplier (Allows user to simulate giving extra stock buffer to boost sales)
  const [growthMultiplier, setGrowthMultiplier] = useState<number>(1.0);

  // Branch search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'ALL' | 'WITHDRAW' | 'SEND' | 'BALANCED'>('ALL');

  // Compute option-wise allocation with growth multiplier
  const allocation = useMemo(() => {
    return getOptionAllocationSummary(report, activeWeight, timeframe, growthMultiplier);
  }, [report, activeWeight, timeframe, growthMultiplier]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return allocation.rows.filter(r => {
      const matchesSearch = r.branch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = filterAction === 'ALL' || r.action === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [allocation, searchQuery, filterAction]);

  const unitPrice = report.categoryConfig?.estimatedAvgUnitPrice || 45000;
  const itemLabel = report.categoryConfig?.itemLabel || 'Carat';

  const handleWeightChange = (newWeight: string) => {
    setActiveWeight(newWeight);
    if (onSelectWeight) onSelectWeight(newWeight);
  };

  const handleExportCsv = () => {
    const headers = ['Branch', 'Current Stock', `${timeframe} Sales`, 'Sales Contribution %', 'Deserved Stock', 'Growth Multiplier', 'Growth Target Stock', 'Variance', 'Action', 'Action Qty'];
    const csvRows = [
      headers.join(','),
      ...allocation.rows.map(r => [
        `"${r.branch}"`,
        r.currentStock,
        r.salesPeriod,
        `${r.salesContributionPct}%`,
        r.deservedStock,
        `${growthMultiplier}x`,
        r.growthTargetStock || r.deservedStock,
        r.variance,
        r.action,
        r.actionQty
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Redistribution_Plan_${activeWeight}ct_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="option-allocation-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Return to Home / Executive Dashboard"
                >
                  <Home className="w-3.5 h-3.5 text-indigo-400" />
                  <span>← Back to Home</span>
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
                <Gem className="w-3.5 h-3.5" />
                Option-Wise Deserved Contribution Model
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>{activeWeight} {itemLabel} Stock & Redistribution</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Calculates how many pieces each outlet deserves based on its <span className="text-amber-400 font-semibold">{timeframe} sales contribution</span>, comparing current stock to identify exactly where to Move Out (Withdraw) and where to Move In (Send).
            </p>
          </div>

          {/* Quick Option / Carat Picker */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 pl-1">Carat / Option:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {['0.24', '0.27', '0.29', '0.34', '0.60', '0.81', '1.00', '1.06', '1.40', '1.80'].map((w) => {
                const isSelected = activeWeight === w;
                const exists = availableWeights.includes(w);
                if (!exists) return null;
                return (
                  <button
                    key={w}
                    onClick={() => handleWeightChange(w)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {w} ct
                  </button>
                );
              })}
              
              {/* Dropdown for all other carats */}
              <select
                value={activeWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                {availableWeights.map((w) => (
                  <option key={w} value={w}>
                    {w} {itemLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timeframe Selector & Core Summary Cards */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Sales Timeframe:
              </span>
              <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                {(['3M', '6M', '1Y', '2Y'] as SalesTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      timeframe === tf
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {tf === '3M' ? '3 Months' : tf === '6M' ? '6 Months' : tf === '1Y' ? '1 Year' : '2 Years'}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth & Elasticity Customization */}
            <div className="flex items-center gap-2 pl-0 sm:pl-3 sm:border-l sm:border-slate-800">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5" title="Customize if branches can absorb extra stock to accelerate sales">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Sales Elasticity Boost:
              </span>
              <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                {[
                  { label: '1.0x Base Quota', val: 1.0 },
                  { label: '1.25x Growth', val: 1.25 },
                  { label: '1.5x Display Boost', val: 1.5 },
                  { label: '2.0x Double Buffer', val: 2.0 }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setGrowthMultiplier(item.val)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      growthMultiplier === item.val
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">All Branches Stock</span>
              <span className="text-lg font-bold text-slate-100">{allocation.totalCompanyStock} <span className="text-xs font-normal text-slate-400">pcs</span></span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">{timeframe} Sales Demand</span>
              <span className="text-lg font-bold text-emerald-400">{allocation.totalSoldPeriod} <span className="text-xs font-normal text-slate-400">pcs</span></span>
            </div>
            <div className="bg-amber-950/30 rounded-xl p-2.5 border border-amber-800/40 text-center">
              <span className="text-[11px] text-amber-300 block font-medium">Excess to Move Out</span>
              <span className="text-lg font-bold text-amber-400">{allocation.totalExcessToWithdraw} <span className="text-xs font-normal text-amber-300/80">pcs</span></span>
            </div>
            <div className="bg-emerald-950/30 rounded-xl p-2.5 border border-emerald-800/40 text-center">
              <span className="text-[11px] text-emerald-300 block font-medium">Shortage to Move In</span>
              <span className="text-lg font-bold text-emerald-400">{allocation.totalShortageToSend} <span className="text-xs font-normal text-emerald-300/80">pcs</span></span>
            </div>
          </div>
        </div>

        {growthMultiplier > 1.0 && (
          <div className="mt-3 p-2.5 bg-indigo-950/40 border border-indigo-700/40 rounded-xl flex items-center justify-between text-xs text-indigo-200">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Elasticity Simulation Active: Calculating if outlets with high customer traffic have capacity to absorb +{Math.round((growthMultiplier - 1) * 100)}% stock to trigger higher sales.
            </span>
            <span className="font-bold text-amber-300">
              Surplus Company Reserve: {allocation.availableCompanyBuffer || 0} pcs available
            </span>
          </div>
        )}
      </div>

      {/* Clear Transfer Action Plan */}
      {allocation.transferPairs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Direct Transfer Orders: Inter-Branch Redistribution Routing
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pre-matched redistribution routing for {activeWeight} ct diamonds based on sales contribution
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 self-start sm:self-auto">
              {allocation.transferPairs.length} Optimized Transfers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allocation.transferPairs.map((pair, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                      Take from: {pair.fromBranch}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                      Send to: {pair.toBranch}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded-md shrink-0 shadow-sm">
                    {pair.qty} pcs
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-normal pl-1 border-l-2 border-slate-300">
                  {pair.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outlet-wise Stock & Sales Contribution Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Outlet-Wise Deserved vs Current Stock ({activeWeight} ct)
              </h3>
              <p className="text-xs text-slate-500">
                Shows exact pieces currently on shelf vs deserved allocation based on sales contribution %
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search outlet..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
            </div>

            {/* Action Filter */}
            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs">
              <button
                onClick={() => setFilterAction('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  filterAction === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterAction('WITHDRAW')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  filterAction === 'WITHDRAW' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Move Out (Excess)
              </button>
              <button
                onClick={() => setFilterAction('SEND')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  filterAction === 'SEND' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Move In (Shortage)
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold rounded-lg border border-slate-700 transition-colors shadow-xs"
              title="Download clean CSV of this allocation and transfer orders"
            >
              <Share2 className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Outlet / Branch</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-3 text-center">{timeframe} Sales</th>
                <th className="py-3 px-3 text-center">Sales Contribution</th>
                <th className="py-3 px-3 text-center">Deserved Stock</th>
                {growthMultiplier > 1.0 && (
                  <th className="py-3 px-3 text-center bg-indigo-50 text-indigo-900 font-bold border-x border-indigo-100">
                    Boost Target ({growthMultiplier}x)
                  </th>
                )}
                <th className="py-3 px-3 text-center">Stock Variance</th>
                <th className="py-3 px-4 text-center">Required Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.map((row) => {
                const isShortage = row.action === 'SEND';
                const isExcess = row.action === 'WITHDRAW';

                return (
                  <tr
                    key={row.branch}
                    onClick={() => onSelectBranch && onSelectBranch(row.branch)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {row.branch}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {row.currentStock} pcs
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                      {row.salesPeriod} pcs
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{row.salesContributionPct}%</span>
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, row.salesContributionPct * 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50/50">
                      {row.deservedStock} pcs
                    </td>
                    {growthMultiplier > 1.0 && (
                      <td className="py-3 px-3 text-center font-extrabold text-indigo-700 bg-indigo-50/40 border-x border-indigo-100">
                        {row.growthTargetStock} pcs
                        {row.opportunityStock && row.opportunityStock > 0 ? (
                          <span className="block text-[10px] text-amber-600 font-normal">
                            +{row.opportunityStock} capacity
                          </span>
                        ) : null}
                      </td>
                    )}
                    <td className="py-3 px-3 text-center font-semibold">
                      {row.variance > 0 ? (
                        <span className="text-amber-700">+{row.variance} (Excess)</span>
                      ) : row.variance < 0 ? (
                        <span className="text-rose-600">{row.variance} (Short)</span>
                      ) : (
                        <span className="text-slate-400">0 (Balanced)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isExcess && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300">
                          <ArrowUpRight className="w-3 h-3" />
                          Move Out {row.actionQty} pcs
                        </span>
                      )}
                      {isShortage && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300">
                          <ArrowDownLeft className="w-3 h-3" />
                          Move In {row.actionQty} pcs
                        </span>
                      )}
                      {!isExcess && !isShortage && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile-Friendly Cards View (Designed for Phones & Light Usage) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredRows.map((row) => {
            const isShortage = row.action === 'SEND';
            const isExcess = row.action === 'WITHDRAW';

            return (
              <div
                key={row.branch}
                onClick={() => onSelectBranch && onSelectBranch(row.branch)}
                className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">{row.branch}</span>
                  </div>

                  {isExcess && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                      Move Out: {row.actionQty} pcs
                    </span>
                  )}
                  {isShortage && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md border border-emerald-300">
                      Move In: +{row.actionQty} pcs
                    </span>
                  )}
                  {!isExcess && !isShortage && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Balanced
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stock</span>
                    <span className="font-bold text-slate-800">{row.currentStock}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{timeframe} Sold</span>
                    <span className="font-bold text-emerald-600">{row.salesPeriod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contrib %</span>
                    <span className="font-bold text-indigo-600">{row.salesContributionPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Deserved</span>
                    <span className="font-bold text-slate-900">{row.deservedStock}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
