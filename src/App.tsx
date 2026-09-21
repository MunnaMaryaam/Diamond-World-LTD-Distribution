import React, { useState, useMemo } from 'react';
import { DEFAULT_RAW_RECORDS, DEFAULT_PERIOD } from './data/defaultDataset';
import { calculateRedistributionReport } from './utils/redistributionEngine';
import { RawInventoryRecord, SalesTimeframe, AuthUser } from './types';
import { getCurrentSession, setCurrentSession } from './utils/authEngine';
import { AppSettings, getStoredSettings, applyThemeToDocument } from './utils/settingsEngine';
import { Navbar } from './components/Navbar';
import { LoginPortal } from './components/LoginPortal';
import { UserManagementModal } from './components/UserManagementModal';
import { SettingsModal } from './components/SettingsModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { OptionWiseAllocationView } from './components/OptionWiseAllocationView';
import { MovementAndAgingReportView } from './components/MovementAndAgingReportView';
import { ConsignmentShipmentPlannerView } from './components/ConsignmentShipmentPlannerView';
import { RefillDemandReport } from './components/RefillDemandReport';
import { ExcelReportSheetView } from './components/ExcelReportSheetView';
import { MovementSummaryView } from './components/MovementSummaryView';
import { BranchSummaryTable } from './components/BranchSummaryTable';
import { WeightVelocityTab } from './components/WeightVelocityTab';
import { DemandOpportunityAnalysis } from './components/DemandOpportunityAnalysis';
import { OperationsDataDrawer } from './components/OperationsDataDrawer';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { BranchDetailModal } from './components/BranchDetailModal';
import { ProductLocationModal } from './components/ProductLocationModal';
import { DailyDualFileUploadModal } from './components/DailyDualFileUploadModal';
import { ERPLaunchpad } from './components/ERPLaunchpad';
import { SidebarNavigation } from './components/SidebarNavigation';
import { DashboardTopHeader } from './components/DashboardTopHeader';
import { NetSuiteTopHeader } from './components/NetSuiteTopHeader';
import { NetSuiteHomeDashboard } from './components/NetSuiteHomeDashboard';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ArrowRightLeft,
  Flame,
  Building2,
  Gem,
  ShieldCheck,
  PackagePlus,
  Files,
  Clock,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FolderLock,
  Home,
  LayoutGrid
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function App() {
  // Authentication & System Settings state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentSession());
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getStoredSettings());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Apply theme on initial load or settings change
  React.useEffect(() => {
    applyThemeToDocument(appSettings.theme);
  }, [appSettings.theme]);

  const [rawRecords, setRawRecords] = useState<RawInventoryRecord[]>(DEFAULT_RAW_RECORDS);
  const [period, setPeriod] = useState<string>(DEFAULT_PERIOD);
  const [selectedTimeframe, setSelectedTimeframe] = useState<SalesTimeframe>('1Y');

  // Primary Navigation View - default to 'dashboard' (Overview Scorecard) matching user's reference layout
  const [activeView, setActiveView] = useState<
    'menu' | 'dashboard' | 'option_allocation' | 'movement_aging' | 'consignment_shipment' | 'reports'
  >('dashboard');

  // Sub-report selection when in 'reports' mode:
  const [activeReport, setActiveReport] = useState<
    'refill_demand' | 'excel_sheet' | 'movement_summary' | 'branches' | 'weights' | 'demand_booster'
  >('refill_demand');

  // Selected Option / Carat (defaults to 0.02)
  const [selectedWeightFilter, setSelectedWeightFilter] = useState<string>('0.02');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('');

  // Inspection Modals
  const [inspectingBranch, setInspectingBranch] = useState<string | null>(null);
  const [inspectingProduct, setInspectingProduct] = useState<string | null>(null);

  // Drawers & Modals
  const [isOperationsFolderOpen, setIsOperationsFolderOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isDailyUploadOpen, setIsDailyUploadOpen] = useState(false);

  // Analytical Report calculation (with chosen timeframe)
  const report = useMemo(() => {
    return calculateRedistributionReport(rawRecords, period, undefined, undefined, undefined, selectedTimeframe);
  }, [rawRecords, period, selectedTimeframe]);

  const handleImportRecords = (newRecords: RawInventoryRecord[], newPeriod?: string) => {
    setRawRecords(newRecords);
    if (newPeriod) setPeriod(newPeriod);
    if (newRecords.length > 0) {
      const weights = Array.from(new Set(newRecords.map(r => r.weight)));
      if (weights.includes('0.02')) {
        setSelectedWeightFilter('0.02');
      } else if (weights.includes('0.24')) {
        setSelectedWeightFilter('0.24');
      } else if (weights.length > 0) {
        setSelectedWeightFilter(weights[0]);
      }
    }
    setActiveView('dashboard');
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranchFilter(branch);
    setInspectingBranch(branch);
  };

  const handleWeightSelect = (weight: string) => {
    setSelectedWeightFilter(weight);
    setInspectingProduct(weight);
  };

  const handleNavigateFromAlert = (tab: string) => {
    if (tab === 'option_allocation') {
      setActiveView('option_allocation');
    } else if (tab === 'movement_aging') {
      setActiveView('movement_aging');
    } else if (tab === 'consignment_shipment') {
      setActiveView('consignment_shipment');
    } else if (tab === 'redistribution') {
      setActiveView('reports');
      setActiveReport('movement_summary');
    } else if (tab === 'refill_demand' || tab === 'procurement') {
      setActiveView('consignment_shipment');
    } else if (tab === 'branches') {
      setActiveView('reports');
      setActiveReport('branches');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleResetData = () => {
    setRawRecords(DEFAULT_RAW_RECORDS);
    setPeriod(DEFAULT_PERIOD);
    setSelectedBranchFilter('');
    setSelectedWeightFilter('0.02');
    setSelectedTimeframe('1Y');
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const itemLabel = report.categoryConfig?.itemLabel || 'Carat';
    const itemUnit = report.categoryConfig?.itemUnit || 'pcs';

    // 1. Refill Demand Sheet
    const refillRows: any[] = [
      [itemLabel, `Required Refill Qty (${itemUnit})`, 'Customer Sold', 'Current Company Stock', 'Priority', 'Replenishment Rationale']
    ];
    report.procurementOrders.forEach(p => {
      refillRows.push([
        itemUnit === 'ct' ? `${p.weight} ct` : p.weight,
        p.qtyToBuy,
        p.soldDemand,
        p.availableStock,
        p.urgency,
        p.rationale
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(refillRows), 'Refill_Demand');

    // 2. Matrix Sheet
    const matrixRows: any[] = [];
    const matrixHeader = [`Particulars (${itemLabel})`, ...report.matrix.branches, 'Move IN', 'Move OUT', 'New Buy'];
    matrixRows.push(matrixHeader);

    report.matrix.weights.forEach(w => {
      const ws = report.weightSummaries.find(s => s.weight === w);
      const row: any[] = [itemUnit === 'ct' ? `${w} ct` : w];
      report.matrix.branches.forEach(b => {
        const net = report.matrix.cells[b]?.[w]?.netMove || 0;
        row.push(net);
      });
      row.push(ws?.moveInNeeded || 0);
      row.push(ws?.moveOutNeeded || 0);
      row.push(ws?.unmetShortage || 0);
      matrixRows.push(row);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matrixRows), 'Matrix_Redistribution');

    // 3. Movement Orders
    const transRows: any[] = [
      ['Transfer Order ID', itemLabel, 'From (Donor Branch)', 'To (Receiver Branch)', `Quantity (${itemUnit})`, 'Priority', 'Reason', 'Status']
    ];
    report.transferOrders.forEach(t => {
      transRows.push([t.id, itemUnit === 'ct' ? `${t.weight} ct` : t.weight, t.fromBranch, t.toBranch, t.qty, t.priority, t.reason, t.status]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(transRows), 'Movement_Orders');

    // 4. Branch Summary
    const branchRows: any[] = [
      ['Branch Name', 'Total Sold', 'Current Stock', `Move IN (${itemUnit})`, `Move OUT (${itemUnit})`, 'Net Change', 'Action Variants', 'Status']
    ];
    report.branchSummaries.forEach(b => {
      branchRows.push([b.branch, b.totalSold, b.totalCurrentStock, b.totalMoveIn, b.totalMoveOut, b.netChange, b.variantsNeedingAction, b.status]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(branchRows), 'Branch_Summary');

    // 5. Consignment Plan
    if (report.consignmentRecommendations) {
      const conRows: any[] = [
        ['Diamond Carat', 'Current Stock', 'Sales Demand', 'Stockout Risk', 'Recommended Order (pcs)', 'Sales Uplift (BDT)', 'Market Reason']
      ];
      report.consignmentRecommendations.forEach(c => {
        conRows.push([`${c.weight} ct`, c.currentNetworkStock, c.recentSalesDemand, c.stockoutRisk, c.recommendedConsignmentPcs, c.estimatedSalesUpliftBdt, c.marketReason]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(conRows), 'Consignment_Plan');
    }

    const filename = `Diamond_World_Redistribution_Report_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Authentication Gate: Require username and password login to access DWL Analytics
  if (!currentUser) {
    return (
      <LoginPortal
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentSession(user);
        }}
      />
    );
  }

  // Dynamic header information matching the reference image layout
  const headerInfo = {
    dashboard: {
      title: '2026 Diamond Stock Redistribution & Operations',
      subtitle: `Portfolio Scorecard | Reporting Period: ${period} | Refreshed Live System`
    },
    option_allocation: {
      title: 'Stock Allocation & Solitaire 0.02ct Matrix',
      subtitle: `Portfolio Scorecard | Showroom Solitaire Option Balancing & Target Distribution`
    },
    movement_aging: {
      title: 'Inventory Velocity, Movement & Aging Analytics',
      subtitle: `Portfolio Scorecard | Dormant Stock, Aging Brackets & Turnover Velocity`
    },
    consignment_shipment: {
      title: 'Consignment & Supplier Replenishment Requisitions',
      subtitle: `Portfolio Scorecard | Factory Reorders & Depleted Showroom Stockout Protection`
    },
    menu: {
      title: 'Enterprise ERP Modules Directory',
      subtitle: `Portfolio Scorecard | Central Launchpad & Operational Services`
    },
    reports: {
      refill_demand: {
        title: 'Refill Demand & Outlet Stock Requisitions',
        subtitle: `Portfolio Scorecard | Showroom Replenishment Priority & Stockout Avoidance`
      },
      excel_sheet: {
        title: 'Master Inventory & Sales Matrix',
        subtitle: `Portfolio Scorecard | Comprehensive Multi-Branch Sheet & Instant Export`
      },
      movement_summary: {
        title: 'Movement Summary & Transfer Orders',
        subtitle: `Portfolio Scorecard | Recommended Stock Balancing Actions & Inter-Branch Transfers`
      },
      branches: {
        title: 'Retail Showrooms & Branch Balance Ratios',
        subtitle: `Portfolio Scorecard | Overstock Risk, Deficit Assessment & Outlet Performance`
      },
      weights: {
        title: 'Carat & Weight Velocity Analysis',
        subtitle: `Portfolio Scorecard | 0.02ct Solitaire Velocity, Low-Turn & High-Turn Segments`
      },
      demand_booster: {
        title: 'Demand Booster & Sales Opportunity Analytics',
        subtitle: `Portfolio Scorecard | High-Demand Outlets vs. Dormant Outlet Redistribution`
      }
    }[activeReport] || {
      title: 'Analytical Reports Suite',
      subtitle: `Portfolio Scorecard | Diamond World Inventory Intelligence`
    }
  }[activeView];

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e293b] flex flex-col font-sans selection:bg-[#17395c] selection:text-white">
      
      {/* 1. ORACLE NETSUITE TOP HEADER BAR (Logo, Search, User, Navy Ribbon, Subheader) */}
      <NetSuiteTopHeader
        activeView={activeView}
        activeReport={activeReport}
        onNavigateView={(view, report) => {
          setActiveView(view);
          if (report) {
            setActiveReport(report);
          }
        }}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        period={period}
        onPeriodChange={setPeriod}
        onOpenDailyUpload={() => setIsDailyUploadOpen(true)}
        onExportExcel={handleExportExcel}
        onToggleAICopilot={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
        onOpenOperations={() => setIsOperationsFolderOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          setCurrentSession(null);
        }}
        onQuickSearchBranch={(branch) => {
          setInspectingBranch(branch);
        }}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto">
        
        {/* VIEW 1: NETSUITE HOME DASHBOARD (3-Column Layout: Reminders, Tiles, KPIs, Trends) */}
        {(activeView === 'dashboard' || activeView === 'menu') && (
          <NetSuiteHomeDashboard
            report={report}
            onNavigateView={(view, subReport) => {
              setActiveView(view);
              if (subReport) {
                setActiveReport(subReport);
              }
            }}
            onSelectBranch={handleBranchSelect}
            onSelectWeight={handleWeightSelect}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            onOpenDailyUpload={() => setIsDailyUploadOpen(true)}
          />
        )}

        {/* SUB-VIEW CONTAINER (When viewing deep modules: Option Allocation, Movement, Consignment, Reports) */}
        {activeView !== 'dashboard' && activeView !== 'menu' && (
          <div className="p-3 sm:p-5 space-y-4">
            
            {/* Quick Navigation Breadcrumb & Back to NetSuite Home */}
            <div className="bg-white border border-[#d8dee6] rounded p-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#17395c] hover:bg-[#0f2b48] text-white font-bold cursor-pointer transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>← Return to Operations Cockpit</span>
                </button>
                <span className="text-[#94a3b8]">|</span>
                <span className="text-[#64748b]">
                  Active Module: <strong className="text-[#17395c] uppercase font-mono">{activeView.replace('_', ' ')}</strong>
                </span>
              </div>

              {selectedBranchFilter && (
                <div className="flex items-center gap-1.5 bg-[#f1f5f9] border border-[#cbd5e1] rounded px-2.5 py-0.5 text-xs text-[#334155]">
                  <span>Filter: <strong>{selectedBranchFilter}</strong></span>
                  <button
                    onClick={() => setSelectedBranchFilter('')}
                    className="ml-1 text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* VIEW 2: OPTION-WISE ALLOCATION & TRANSFER ENGINE */}
            {activeView === 'option_allocation' && (
              <OptionWiseAllocationView
                report={report}
                selectedWeight={selectedWeightFilter}
                onSelectBranch={handleBranchSelect}
                onSelectWeight={(w) => setSelectedWeightFilter(w)}
                onBackToHome={() => setActiveView('dashboard')}
              />
            )}

            {/* VIEW 3: UNIFIED MOVEMENT & AGING ANALYSIS */}
            {activeView === 'movement_aging' && (
              <MovementAndAgingReportView
                report={report}
                rawRecords={rawRecords}
                onSelectBranch={handleBranchSelect}
                onSelectWeight={handleWeightSelect}
                onBackToHome={() => setActiveView('dashboard')}
              />
            )}

            {/* VIEW 4: NEW SHIPMENT CONSIGNMENT PLANNER */}
            {activeView === 'consignment_shipment' && (
              <ConsignmentShipmentPlannerView
                report={report}
                onSelectWeight={handleWeightSelect}
                onBackToHome={() => setActiveView('dashboard')}
              />
            )}

            {/* VIEW 5: ALL REPORTS HUB */}
            {activeView === 'reports' && (
              <div className="space-y-4">
                <div className="bg-white rounded p-2 border border-[#d8dee6] shadow-2xs flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setActiveReport('refill_demand')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'refill_demand'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    Refill Demand
                  </button>
                  <button
                    onClick={() => setActiveReport('excel_sheet')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'excel_sheet'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Excel Matrix
                  </button>
                  <button
                    onClick={() => setActiveReport('movement_summary')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'movement_summary'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Movement Dispatch
                  </button>
                  <button
                    onClick={() => setActiveReport('branches')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'branches'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Branch Balances
                  </button>
                  <button
                    onClick={() => setActiveReport('weights')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'weights'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <Gem className="w-3.5 h-3.5" />
                    Carat Velocity
                  </button>
                  <button
                    onClick={() => setActiveReport('demand_booster')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeReport === 'demand_booster'
                        ? 'bg-[#17395c] text-white shadow-2xs'
                        : 'text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Opportunity Booster
                  </button>
                </div>

                {activeReport === 'refill_demand' && <RefillDemandReport report={report} onSelectBranch={handleBranchSelect} onSelectWeight={handleWeightSelect} />}
                {activeReport === 'excel_sheet' && <ExcelReportSheetView report={report} onSelectBranch={handleBranchSelect} onSelectWeight={handleWeightSelect} />}
                {activeReport === 'movement_summary' && <MovementSummaryView report={report} onSelectBranch={handleBranchSelect} onSelectWeight={handleWeightSelect} />}
                {activeReport === 'branches' && <BranchSummaryTable report={report} onSelectBranch={handleBranchSelect} />}
                {activeReport === 'weights' && <WeightVelocityTab report={report} onSelectWeight={handleWeightSelect} />}
                {activeReport === 'demand_booster' && <DemandOpportunityAnalysis report={report} onSelectBranch={handleBranchSelect} onSelectWeight={handleWeightSelect} />}
              </div>
            )}

          </div>
        )}

      </main>

      {/* ENTERPRISE FOOTER */}
      <footer className="bg-white border-t border-[#d8dee6] py-3 px-4 sm:px-8 text-xs text-[#64748b] mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17395c]">DIAMOND WORLD LTD</span>
            <span>•</span>
            <span className="font-semibold text-[#0f172a]">Stock Operations ERP</span>
            <span className="hidden md:inline text-[#cbd5e1]">•</span>
            <span className="hidden md:inline">Developed by <strong className="text-[#17395c]">MD Shahadat Hossen</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Period: <strong className="text-[#1e293b]">{report.period}</strong></span>
            <span>•</span>
            <span>Sales: <strong className="text-[#17395c]">{selectedTimeframe}</strong></span>
            {currentUser && (
              <>
                <span>•</span>
                <span>User: <strong className="text-[#17395c] font-medium">{currentUser.name}</strong></span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* User Management & Access Control Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
      />

      {/* Settings, Theme & Account Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
        }}
        settings={appSettings}
        onSettingsUpdated={(newSettings) => {
          setAppSettings(newSettings);
        }}
        onOpenUserManagement={() => {
          setIsSettingsOpen(false);
          setIsUserManagementOpen(true);
        }}
        onResetToDefaults={() => {
          handleResetData();
          setIsSettingsOpen(false);
        }}
        rawRecordsCount={rawRecords.length}
      />

      {/* Operations & Data Center (Drawer / Folder Mode) */}
      <OperationsDataDrawer
        isOpen={isOperationsFolderOpen}
        onClose={() => setIsOperationsFolderOpen(false)}
        report={report}
        rawRecords={rawRecords}
        onImportRecords={handleImportRecords}
        onNavigateTab={(tab) => {
          handleNavigateFromAlert(tab);
        }}
      />

      {/* Daily Dual File Upload Modal (Current Stock + Sold Out) */}
      <DailyDualFileUploadModal
        isOpen={isDailyUploadOpen}
        onClose={() => setIsDailyUploadOpen(false)}
        onImportRecords={handleImportRecords}
        currentPeriod={period}
      />

      {/* Movement Analysis AI Copilot Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        report={report}
      />

      {/* Branch 360° Comprehensive Report Modal */}
      <BranchDetailModal
        branchName={inspectingBranch}
        onClose={() => setInspectingBranch(null)}
        report={report}
        onSelectProduct={(w) => {
          setInspectingBranch(null);
          setInspectingProduct(w);
        }}
        onSelectAnotherBranch={(b) => setInspectingBranch(b)}
      />

      {/* Product Location Tracker Modal */}
      <ProductLocationModal
        productWeight={inspectingProduct}
        onClose={() => setInspectingProduct(null)}
        report={report}
        onSelectBranch={(b) => {
          setInspectingProduct(null);
          setInspectingBranch(b);
        }}
        onSelectAnotherProduct={(w) => setInspectingProduct(w)}
      />

    </div>
  );
}
