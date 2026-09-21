import {
  RawInventoryRecord,
  BranchSummary,
  WeightSummary,
  TransferOrder,
  ProcurementOrder,
  ActionAlert,
  RedistributionReport,
  CategoryConfig,
  SalesTimeframe,
  StockAgingBucket,
  ConsignmentRecommendation,
  OptionAllocationSummary,
  OptionAllocationRow
} from '../types';
import { ALL_BRANCHES, ALL_WEIGHTS, DEFAULT_PERIOD } from '../data/defaultDataset';
import { CATEGORY_PRESETS } from '../data/categoryPresets';

export function calculateRedistributionReport(
  records: RawInventoryRecord[],
  period: string = DEFAULT_PERIOD,
  categoryConfig?: CategoryConfig,
  baseBranches?: string[],
  baseWeights?: string[],
  selectedTimeframe: SalesTimeframe = '1Y'
): RedistributionReport {
  const activeCategory: CategoryConfig = categoryConfig || CATEGORY_PRESETS[0];

  // Determine branch list
  let branches: string[];
  if (baseBranches && baseBranches.length > 0) {
    const bSet = new Set<string>(baseBranches);
    records.forEach(r => { if (r.branch) bSet.add(r.branch); });
    branches = Array.from(bSet);
  } else if (records.length > 0) {
    const bSet = new Set<string>();
    records.forEach(r => { if (r.branch) bSet.add(r.branch); });
    branches = Array.from(bSet);
  } else {
    branches = [...ALL_BRANCHES];
  }

  // Determine items / weights list
  let weights: string[];
  if (baseWeights && baseWeights.length > 0) {
    const wSet = new Set<string>(baseWeights);
    records.forEach(r => { if (r.weight) wSet.add(r.weight); });
    weights = Array.from(wSet);
  } else if (records.length > 0) {
    const wSet = new Set<string>();
    records.forEach(r => { if (r.weight) wSet.add(r.weight); });
    weights = Array.from(wSet);
  } else {
    weights = [...ALL_WEIGHTS];
  }

  // Sort weights/items smartly (numeric if all numbers, otherwise alphabetical)
  weights.sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB) && /^[-+]?[0-9]*\.?[0-9]+$/.test(a) && /^[-+]?[0-9]*\.?[0-9]+$/.test(b)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  const isWarehouseBranch = (b: string) => {
    const lower = b.toLowerCase();
    return lower === 'dwl' || lower.includes('warehouse') || lower.includes('central') || lower.includes('hub') || lower.includes('dc') || lower.includes('distribution');
  };

  // Matrix cells setup
  const matrixCells: Record<string, Record<string, {
    sold: number;
    stock: number;
    moveIn: number;
    moveOut: number;
    netMove: number;
  }>> = {};

  branches.forEach((b) => {
    matrixCells[b] = {};
    weights.forEach((w) => {
      matrixCells[b][w] = { sold: 0, stock: 0, moveIn: 0, moveOut: 0, netMove: 0 };
    });
  });

  // Track multi-period and age statistics per record
  const branchPeriodSold: Record<string, { m3: number; m6: number; y1: number; y2: number }> = {};
  const branchAgingMap: Record<string, { fresh: number; aging: number; slow: number; old: number; dormant: number }> = {};
  const weightPeriodSold: Record<string, { m3: number; m6: number; y1: number; y2: number; totalAge: number; ageCount: number }> = {};

  branches.forEach(b => {
    branchPeriodSold[b] = { m3: 0, m6: 0, y1: 0, y2: 0 };
    branchAgingMap[b] = { fresh: 0, aging: 0, slow: 0, old: 0, dormant: 0 };
  });

  weights.forEach(w => {
    weightPeriodSold[w] = { m3: 0, m6: 0, y1: 0, y2: 0, totalAge: 0, ageCount: 0 };
  });

  records.forEach((r) => {
    if (!matrixCells[r.branch]) matrixCells[r.branch] = {};
    if (!matrixCells[r.branch][r.weight]) {
      matrixCells[r.branch][r.weight] = { sold: 0, stock: 0, moveIn: 0, moveOut: 0, netMove: 0 };
    }

    const sold = Number(r.soldQty) || 0;
    const stock = Number(r.currentStock) || 0;

    // Multi-period sales resolution
    const s3m = r.sales3M !== undefined ? r.sales3M : Math.max(0, Math.round(sold * 0.4));
    const s6m = r.sales6M !== undefined ? r.sales6M : Math.max(0, Math.round(sold * 0.7));
    const s1y = r.sales1Y !== undefined ? r.sales1Y : sold;
    const s2y = r.sales2Y !== undefined ? r.sales2Y : Math.max(0, Math.round(sold * 1.8));

    // Inventory Age in Days
    const ageDays = r.ageDays !== undefined ? r.ageDays : (stock > 0 && sold === 0 ? 310 : 65);

    // Active timeframe sold for matrix
    let activeTimeframeSold = s1y;
    if (selectedTimeframe === '3M') activeTimeframeSold = s3m;
    else if (selectedTimeframe === '6M') activeTimeframeSold = s6m;
    else if (selectedTimeframe === '2Y') activeTimeframeSold = s2y;

    matrixCells[r.branch][r.weight].sold += activeTimeframeSold;
    matrixCells[r.branch][r.weight].stock += stock;

    if (branchPeriodSold[r.branch]) {
      branchPeriodSold[r.branch].m3 += s3m;
      branchPeriodSold[r.branch].m6 += s6m;
      branchPeriodSold[r.branch].y1 += s1y;
      branchPeriodSold[r.branch].y2 += s2y;
    }

    if (branchAgingMap[r.branch] && stock > 0) {
      if (ageDays <= 90) branchAgingMap[r.branch].fresh += stock;
      else if (ageDays <= 180) branchAgingMap[r.branch].aging += stock;
      else if (ageDays <= 365) branchAgingMap[r.branch].slow += stock;
      else if (ageDays <= 730) branchAgingMap[r.branch].old += stock;
      else branchAgingMap[r.branch].dormant += stock;
    }

    if (weightPeriodSold[r.weight]) {
      weightPeriodSold[r.weight].m3 += s3m;
      weightPeriodSold[r.weight].m6 += s6m;
      weightPeriodSold[r.weight].y1 += s1y;
      weightPeriodSold[r.weight].y2 += s2y;
      if (stock > 0) {
        weightPeriodSold[r.weight].totalAge += ageDays * stock;
        weightPeriodSold[r.weight].ageCount += stock;
      }
    }
  });

  // Track weight-level company metrics
  const weightMetricsMap: Record<string, {
    sold: number;
    stock: number;
    moveIn: number;
    moveOut: number;
    unmetShortage: number;
  }> = {};

  weights.forEach((w) => {
    weightMetricsMap[w] = { sold: 0, stock: 0, moveIn: 0, moveOut: 0, unmetShortage: 0 };
  });

  branches.forEach((b) => {
    weights.forEach((w) => {
      const cell = matrixCells[b][w];
      weightMetricsMap[w].sold += cell.sold;
      weightMetricsMap[w].stock += cell.stock;
    });
  });

  // Automated Redistribution Matching Engine
  const transferOrders: TransferOrder[] = [];
  const procurementOrders: ProcurementOrder[] = [];

  weights.forEach((w) => {
    // 1. Identify deficits (branches that need stock moved IN)
    // 2. Identify surpluses (branches with excess/idle stock that can move OUT)
    const deficits: { branch: string; deficitQty: number; sold: number; stock: number; priorityScore: number }[] = [];
    const surpluses: { branch: string; surplusQty: number; sold: number; stock: number; isWarehouse: boolean }[] = [];

    branches.forEach((b) => {
      const isWarehouse = isWarehouseBranch(b);
      const cell = matrixCells[b][w];

      if (isWarehouse) {
        if (cell.stock > 0) {
          surpluses.push({
            branch: b,
            surplusQty: cell.stock,
            sold: cell.sold,
            stock: cell.stock,
            isWarehouse: true
          });
        }
        return;
      }

      // Deficit evaluation:
      // Case A: Complete stockout with active sales (critical deficit = sold quantity)
      if (cell.stock === 0 && cell.sold > 0) {
        deficits.push({
          branch: b,
          deficitQty: Math.max(1, cell.sold),
          sold: cell.sold,
          stock: cell.stock,
          priorityScore: cell.sold * 10 + 50 // highest urgency
        });
      }
      // Case B: Demand exceeds current stock (stock shortage = sold - stock)
      else if (cell.sold > cell.stock) {
        const shortQty = cell.sold - cell.stock;
        deficits.push({
          branch: b,
          deficitQty: shortQty,
          sold: cell.sold,
          stock: cell.stock,
          priorityScore: cell.sold * 10
        });
      }

      // Surplus evaluation:
      // Case C: Idle stock with zero sales in period (100% can move OUT)
      if (cell.stock > 0 && cell.sold === 0) {
        surpluses.push({
          branch: b,
          surplusQty: cell.stock,
          sold: cell.sold,
          stock: cell.stock,
          isWarehouse: false
        });
      }
      // Case D: Overstock where stock exceeds sales velocity
      // Keep a buffer equal to sales (or min 1 display piece), the rest is excess to move OUT
      else if (cell.stock > cell.sold) {
        const buffer = Math.max(1, cell.sold);
        const excess = cell.stock - buffer;
        if (excess > 0) {
          surpluses.push({
            branch: b,
            surplusQty: excess,
            sold: cell.sold,
            stock: cell.stock,
            isWarehouse: false
          });
        }
      }
    });

    // Sort deficits: highest urgency & sales demand first
    deficits.sort((a, b) => b.priorityScore - a.priorityScore || b.deficitQty - a.deficitQty);

    // Sort surpluses: warehouse first, then highest idle surplus stock first
    surpluses.sort((a, b) => {
      if (a.isWarehouse && !b.isWarehouse) return -1;
      if (!a.isWarehouse && b.isWarehouse) return 1;
      return b.surplusQty - a.surplusQty;
    });

    let dIndex = 0;
    let sIndex = 0;

    while (dIndex < deficits.length && sIndex < surpluses.length) {
      const currentDeficit = deficits[dIndex];
      const currentSurplus = surpluses[sIndex];
      const transferQty = Math.min(currentDeficit.deficitQty, currentSurplus.surplusQty);

      if (transferQty > 0) {
        transferOrders.push({
          id: `TR-${w.replace('.', '')}-${currentSurplus.branch.substring(0, 3).toUpperCase()}-${currentDeficit.branch.substring(0, 3).toUpperCase()}`,
          weight: w,
          fromBranch: currentSurplus.branch,
          toBranch: currentDeficit.branch,
          qty: transferQty,
          priority: currentDeficit.sold >= 2 ? 'CRITICAL' : 'HIGH',
          reason: currentSurplus.isWarehouse
            ? `Central Warehouse replenishment to meet ${currentDeficit.sold} sales demand at ${currentDeficit.branch}`
            : `Reallocate ${transferQty} pcs excess/idle stock from ${currentSurplus.branch} to stockout store ${currentDeficit.branch}`,
          impactScore: currentDeficit.sold * 10,
          status: 'RECOMMENDED'
        });

        matrixCells[currentSurplus.branch][w].moveOut += transferQty;
        matrixCells[currentSurplus.branch][w].netMove -= transferQty;

        matrixCells[currentDeficit.branch][w].moveIn += transferQty;
        matrixCells[currentDeficit.branch][w].netMove += transferQty;

        weightMetricsMap[w].moveIn += transferQty;
        weightMetricsMap[w].moveOut += transferQty;

        currentDeficit.deficitQty -= transferQty;
        currentSurplus.surplusQty -= transferQty;
      }

      if (currentDeficit.deficitQty <= 0) dIndex++;
      if (currentSurplus.surplusQty <= 0) sIndex++;
    }

    let remainingDeficit = 0;
    for (let i = dIndex; i < deficits.length; i++) {
      remainingDeficit += deficits[i].deficitQty;
    }

    const companyTotalSold = weightMetricsMap[w].sold;
    const companyTotalStock = weightMetricsMap[w].stock;
    const directShortage = Math.max(0, companyTotalSold - companyTotalStock);
    const finalUnmet = Math.max(remainingDeficit, directShortage);

    if (finalUnmet > 0) {
      weightMetricsMap[w].unmetShortage = finalUnmet;
      procurementOrders.push({
        weight: w,
        qtyToBuy: finalUnmet,
        soldDemand: companyTotalSold,
        availableStock: companyTotalStock,
        urgency: companyTotalSold >= 3 ? 'HIGH' : 'MEDIUM',
        rationale: `Total demand (${companyTotalSold} ${activeCategory.itemUnit}) exceeds total network stock (${companyTotalStock} ${activeCategory.itemUnit}). Intra-branch transfers exhausted.`
      });
    }
  });

  // Compile Branch Summaries
  const branchSummaries: BranchSummary[] = branches.map((b) => {
    let totalSold = 0;
    let totalCurrentStock = 0;
    let totalMoveIn = 0;
    let totalMoveOut = 0;
    let variantsNeedingAction = 0;

    weights.forEach((w) => {
      const cell = matrixCells[b][w];
      totalSold += cell.sold;
      totalCurrentStock += cell.stock;
      totalMoveIn += cell.moveIn;
      totalMoveOut += cell.moveOut;

      if (cell.moveIn > 0 || cell.moveOut > 0) {
        variantsNeedingAction++;
      }
    });

    const isWarehouse = isWarehouseBranch(b);
    const netChange = totalMoveIn - totalMoveOut;
    const sellThroughRate = (totalSold + totalCurrentStock) > 0
      ? (totalSold / (totalSold + totalCurrentStock)) * 100
      : 0;

    const overstockScore = totalSold === 0 && totalCurrentStock > 0
      ? totalCurrentStock * 20
      : Math.max(0, totalCurrentStock - totalSold) * 10;

    const shortageScore = totalCurrentStock === 0 && totalSold > 0
      ? totalSold * 25
      : Math.max(0, totalSold - totalCurrentStock) * 12;

    let status: BranchSummary['status'] = 'BALANCED';
    if (isWarehouse) {
      status = 'WAREHOUSE';
    } else if (totalCurrentStock === 0 && totalSold > 0) {
      status = 'SHORTAGE';
    } else if (totalMoveIn > totalMoveOut && totalMoveIn >= 2) {
      status = 'SHORTAGE';
    } else if (totalSold === 0 && totalCurrentStock > 0) {
      status = 'OVERSTOCKED';
    } else if (totalMoveOut > totalMoveIn && totalMoveOut >= 2) {
      status = 'OVERSTOCKED';
    }

    const bAging = branchAgingMap[b] || { fresh: 0, aging: 0, slow: 0, old: 0, dormant: 0 };
    const bPeriods = branchPeriodSold[b] || { m3: 0, m6: 0, y1: 0, y2: 0 };

    return {
      branch: b,
      totalSold,
      totalSold3M: bPeriods.m3,
      totalSold6M: bPeriods.m6,
      totalSold1Y: bPeriods.y1,
      totalSold2Y: bPeriods.y2,
      totalCurrentStock,
      totalMoveIn,
      totalMoveOut,
      netChange,
      variantsNeedingAction,
      isWarehouse,
      sellThroughRate,
      overstockScore,
      shortageScore,
      status,
      agingBreakdown: {
        freshPcs: bAging.fresh,
        agingPcs: bAging.aging,
        slowPcs: bAging.slow,
        oldPcs: bAging.old,
        dormantPcs: bAging.dormant
      }
    };
  });

  // Compile Weight Summaries
  const weightSummaries: WeightSummary[] = weights.map((w) => {
    const wm = weightMetricsMap[w];
    const weightNum = parseFloat(w) || 0;
    const wPeriods = weightPeriodSold[w] || { m3: 0, m6: 0, y1: 0, y2: 0, totalAge: 0, ageCount: 0 };

    let velocityCategory: WeightSummary['velocityCategory'] = 'Slow-Moving';
    if (wm.sold >= 3) velocityCategory = 'Best-Seller';
    else if (wm.sold >= 1) velocityCategory = 'Steady';
    else if (wm.stock > 0 && wm.sold === 0) velocityCategory = 'Zero-Sales Stock';

    const turnoverRatio = wm.stock > 0 ? (wm.sold / wm.stock) : (wm.sold > 0 ? 5 : 0);
    const avgAge = wPeriods.ageCount > 0 ? Math.round(wPeriods.totalAge / wPeriods.ageCount) : 60;

    return {
      weight: w,
      weightNum,
      soldQty: wm.sold,
      sold3M: wPeriods.m3,
      sold6M: wPeriods.m6,
      sold1Y: wPeriods.y1,
      sold2Y: wPeriods.y2,
      currentStock: wm.stock,
      moveInNeeded: wm.moveIn,
      moveOutNeeded: wm.moveOut,
      unmetShortage: wm.unmetShortage,
      velocityCategory,
      turnoverRatio,
      averageAgeDays: avgAge
    };
  });

  // Top rankings
  const retailBranches = branchSummaries.filter((b) => !b.isWarehouse);

  // Top 5 Selling Outlets
  const top5SellingBranches = [...retailBranches]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  // Lowest 5 Selling Outlets (Slow performers with idle stock)
  const lowest5SellingBranches = [...retailBranches]
    .sort((a, b) => a.totalSold - b.totalSold || b.totalCurrentStock - a.totalCurrentStock)
    .slice(0, 5);

  const topOverstockedBranches = [...branchSummaries]
    .filter((b) => !b.isWarehouse && b.totalCurrentStock > 0)
    .sort((a, b) => b.overstockScore - a.overstockScore)
    .slice(0, 5);

  const topShortageBranches = [...branchSummaries]
    .filter((b) => !b.isWarehouse)
    .sort((a, b) => b.shortageScore - a.shortageScore)
    .slice(0, 5);

  const top5BestSellingWeights = [...weightSummaries]
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, 5);

  const top5SlowMovingWeights = [...weightSummaries]
    .filter((w) => w.currentStock > 0 && w.soldQty === 0)
    .sort((a, b) => b.currentStock - a.currentStock)
    .slice(0, 5);

  const lowest5SellingWeights = [...weightSummaries]
    .sort((a, b) => a.soldQty - b.soldQty || b.currentStock - a.currentStock)
    .slice(0, 5);

  // Global Totals
  const totalSold = branchSummaries.reduce((sum, b) => sum + b.totalSold, 0);
  const totalSold3M = branchSummaries.reduce((sum, b) => sum + (b.totalSold3M || 0), 0);
  const totalSold6M = branchSummaries.reduce((sum, b) => sum + (b.totalSold6M || 0), 0);
  const totalSold1Y = branchSummaries.reduce((sum, b) => sum + (b.totalSold1Y || 0), 0);
  const totalSold2Y = branchSummaries.reduce((sum, b) => sum + (b.totalSold2Y || 0), 0);
  const totalCurrentStock = branchSummaries.reduce((sum, b) => sum + b.totalCurrentStock, 0);
  const totalMoveIn = branchSummaries.reduce((sum, b) => sum + b.totalMoveIn, 0);
  const totalMoveOut = branchSummaries.reduce((sum, b) => sum + b.totalMoveOut, 0);
  const netStockPosition = totalMoveIn - totalMoveOut;
  const totalNewStockToBuy = procurementOrders.reduce((sum, p) => sum + p.qtyToBuy, 0);
  const variantsNeedingActionCount = transferOrders.length + procurementOrders.length;

  // Build Comprehensive Stock Aging Analysis Buckets
  let totalPiecesFresh = 0;
  let totalPiecesAging = 0;
  let totalPiecesSlow = 0;
  let totalPiecesOld = 0;
  let totalPiecesDormant = 0;

  const trapped0_90: any[] = [];
  const trapped91_180: any[] = [];
  const trapped181_365: any[] = [];
  const trapped1_2y: any[] = [];
  const trapped2y_plus: any[] = [];

  records.forEach((r) => {
    const stock = Number(r.currentStock) || 0;
    if (stock <= 0) return;
    const sold = Number(r.soldQty) || 0;
    const age = r.ageDays !== undefined ? r.ageDays : (sold === 0 ? 310 : 65);

    const itemData = {
      branch: r.branch,
      weight: r.weight,
      qty: stock,
      daysOld: age,
      salesInBranch: sold
    };

    if (age <= 90) {
      totalPiecesFresh += stock;
      trapped0_90.push(itemData);
    } else if (age <= 180) {
      totalPiecesAging += stock;
      trapped91_180.push(itemData);
    } else if (age <= 365) {
      totalPiecesSlow += stock;
      if (sold === 0) trapped181_365.push(itemData);
    } else if (age <= 730) {
      totalPiecesOld += stock;
      if (sold === 0) trapped1_2y.push(itemData);
    } else {
      totalPiecesDormant += stock;
      trapped2y_plus.push(itemData);
    }
  });

  const totalStockForAging = Math.max(1, totalCurrentStock);

  const agingBuckets: StockAgingBucket[] = [
    {
      bucket: "0-90 Days",
      description: "Fresh Inventory (High customer turnover window)",
      totalPieces: totalPiecesFresh,
      percentage: Math.round((totalPiecesFresh / totalStockForAging) * 100),
      status: 'HEALTHY',
      affectedBranchesCount: new Set(trapped0_90.map(t => t.branch)).size,
      trappedItems: trapped0_90.slice(0, 5)
    },
    {
      bucket: "91-180 Days",
      description: "Normal Holding Period (Requires monitoring)",
      totalPieces: totalPiecesAging,
      percentage: Math.round((totalPiecesAging / totalStockForAging) * 100),
      status: 'MODERATE',
      affectedBranchesCount: new Set(trapped91_180.map(t => t.branch)).size,
      trappedItems: trapped91_180.slice(0, 5)
    },
    {
      bucket: "181-365 Days",
      description: "Slow-Moving Inventory (Should rotate between outlets)",
      totalPieces: totalPiecesSlow,
      percentage: Math.round((totalPiecesSlow / totalStockForAging) * 100),
      status: 'ATTENTION',
      affectedBranchesCount: new Set(trapped181_365.map(t => t.branch)).size,
      trappedItems: trapped181_365.slice(0, 6)
    },
    {
      bucket: "1-2 Years",
      description: "Stagnant Stock (Locked capital in idle locations)",
      totalPieces: totalPiecesOld,
      percentage: Math.round((totalPiecesOld / totalStockForAging) * 100),
      status: 'CRITICAL',
      affectedBranchesCount: new Set(trapped1_2y.map(t => t.branch)).size,
      trappedItems: trapped1_2y.slice(0, 6)
    },
    {
      bucket: ">2 Years",
      description: "Dormant / Dead Stock (Urgent transfer or remake needed)",
      totalPieces: totalPiecesDormant,
      percentage: Math.round((totalPiecesDormant / totalStockForAging) * 100),
      status: 'DEAD_STOCK',
      affectedBranchesCount: new Set(trapped2y_plus.map(t => t.branch)).size,
      trappedItems: trapped2y_plus.slice(0, 6)
    }
  ];

  // Consignment & New Shipment Planner (Products that will boost sales)
  const consignmentRecommendations: ConsignmentRecommendation[] = [];

  weightSummaries.forEach((w) => {
    const totalSold1Y = w.sold1Y || w.soldQty;
    const stock = w.currentStock;
    const demandDeficit = Math.max(0, totalSold1Y - stock);
    const isCriticalStockout = stock === 0 && totalSold1Y > 0;
    const isUnderstocked = stock > 0 && totalSold1Y >= stock;

    if (isCriticalStockout || isUnderstocked || (totalSold1Y >= 2 && stock <= 1)) {
      const recommendedQty = isCriticalStockout
        ? Math.max(2, Math.round(totalSold1Y * 2))
        : Math.max(2, Math.round(totalSold1Y * 1.5) - stock);
      const estimatedUnitPrice = activeCategory.estimatedAvgUnitPrice || 45000;
      const projectedSalesUplift = recommendedQty * estimatedUnitPrice * 0.85;

      consignmentRecommendations.push({
        weight: w.weight,
        category: activeCategory.itemTypeNoun,
        currentNetworkStock: stock,
        recentSalesDemand: totalSold1Y,
        demandVelocity: totalSold1Y >= 5 ? 'VERY_HIGH' : (totalSold1Y >= 2 ? 'HIGH' : 'MODERATE'),
        stockoutRisk: stock === 0 ? 'CRITICAL' : (stock <= 1 ? 'HIGH' : 'MODERATE'),
        recommendedConsignmentPcs: Math.max(1, recommendedQty),
        estimatedSalesUpliftBdt: Math.round(projectedSalesUplift),
        marketReason: stock === 0
          ? `High market customer demand (${totalSold1Y} pcs sold out). Complete network stockout (0 pcs available). New procurement order required immediately to capture sales.`
          : `Proven customer demand (${totalSold1Y} pcs sold). Network stock (${stock} pcs) is depleted. Reordering ${recommendedQty} pcs will boost overall revenue.`
      });
    }
  });

  consignmentRecommendations.sort((a, b) => {
    if (a.stockoutRisk === 'CRITICAL' && b.stockoutRisk !== 'CRITICAL') return -1;
    if (b.stockoutRisk === 'CRITICAL' && a.stockoutRisk !== 'CRITICAL') return 1;
    return b.recentSalesDemand - a.recentSalesDemand;
  });

  // Actionable Alerts
  const actionAlerts: ActionAlert[] = [];

  if (topShortageBranches.length > 0 && topShortageBranches[0].totalCurrentStock === 0) {
    actionAlerts.push({
      id: "alert-shortage-1",
      type: "CRITICAL_SHORTAGE",
      title: `Critical Stockout at ${topShortageBranches[0].branch}`,
      description: `${topShortageBranches[0].branch} generated ${topShortageBranches[0].totalSold} units of demand for ${activeCategory.name} but has ZERO available units on shelves.`,
      branch: topShortageBranches[0].branch,
      actionText: `Execute Move IN of ${topShortageBranches[0].totalMoveIn || 1} ${activeCategory.itemUnit} immediately to prevent sales walkout.`,
      priority: "URGENT"
    });
  }

  if (topOverstockedBranches.length > 0 && topOverstockedBranches[0].totalSold === 0) {
    actionAlerts.push({
      id: "alert-overstock-1",
      type: "OVERSTOCK_WARNING",
      title: `Idle Capital Lockup at ${topOverstockedBranches[0].branch}`,
      description: `${topOverstockedBranches[0].branch} holds ${topOverstockedBranches[0].totalCurrentStock} ${activeCategory.itemUnit} inventory with 0 period sales, creating holding cost and capital lockup.`,
      branch: topOverstockedBranches[0].branch,
      actionText: `Authorize Move OUT transfer order to reallocate inventory to high-velocity locations.`,
      priority: "WARNING"
    });
  }

  if (consignmentRecommendations.length > 0) {
    const topRec = consignmentRecommendations[0];
    actionAlerts.push({
      id: "alert-consignment-1",
      type: "PROCUREMENT_REQUIRED",
      title: `Consignment Requisition: Import ${topRec.weight} ct (${topRec.recommendedConsignmentPcs} pcs)`,
      description: `High sales demand (${topRec.recentSalesDemand} sold) vs only ${topRec.currentNetworkStock} in network stock. Ordering new consignment will boost revenue by $${topRec.estimatedSalesUpliftBdt.toLocaleString()}.`,
      actionText: `Include in upcoming factory import order.`,
      priority: "URGENT"
    });
  }

  transferOrders.forEach((to, idx) => {
    if (idx < 2) {
      actionAlerts.push({
        id: `alert-transfer-${to.id}`,
        type: "TRANSFER_OPPORTUNITY",
        title: `Dispatch Transfer: ${to.weight} (${to.fromBranch} → ${to.toBranch})`,
        description: `Transfer ${to.qty} ${activeCategory.itemUnit} of ${to.weight} from overstocked branch (${to.fromBranch}) to stockout branch (${to.toBranch}).`,
        branch: to.toBranch,
        weight: to.weight,
        actionText: "Ready to print dispatch slip",
        priority: to.priority === 'CRITICAL' ? 'URGENT' : 'WARNING'
      });
    }
  });

  return {
    period,
    selectedTimeframe,
    categoryConfig: activeCategory,
    totalSold,
    totalSold3M,
    totalSold6M,
    totalSold1Y,
    totalSold2Y,
    totalCurrentStock,
    totalMoveIn,
    totalMoveOut,
    netStockPosition,
    totalNewStockToBuy,
    variantsNeedingActionCount,
    branchSummaries,
    weightSummaries,
    top5SellingBranches,
    lowest5SellingBranches,
    topOverstockedBranches,
    topShortageBranches,
    top5BestSellingWeights,
    top5SlowMovingWeights,
    lowest5SellingWeights,
    transferOrders,
    procurementOrders,
    actionAlerts,
    agingBuckets,
    consignmentRecommendations,
    matrix: {
      branches,
      weights,
      cells: matrixCells
    }
  };
}

/**
 * Calculates Option-wise (e.g. 0.02 carat) Company-wide Allocation, Deserved Ratio & Transfer Matrix:
 * Directly solves the user's requirement:
 * "amar stock e suppose 0.02 carat shob branch miliye koto pcs ache and oi outlet e koto pcs ideal 
 * and current stock sales contribution miliye she actually koto pcs deserve kore and amar kache koto pcs ache 
 * ami kon outlet theke koto pcs dibo and uthabo"
 */
export function getOptionAllocationSummary(
  report: RedistributionReport,
  weight: string,
  timeframe: SalesTimeframe = '1Y',
  growthMultiplier: number = 1.0
): OptionAllocationSummary {
  const branches = report.matrix.branches;
  let totalCompanyStock = 0;
  let totalSoldPeriod = 0;

  // Compute total stock and sales for this option across all branches
  branches.forEach((b) => {
    const cell = report.matrix.cells[b]?.[weight];
    if (cell) {
      totalCompanyStock += cell.stock;
      totalSoldPeriod += cell.sold;
    }
  });

  const rows: OptionAllocationRow[] = [];
  const excessList: { branch: string; excess: number }[] = [];
  const shortageList: { branch: string; shortage: number }[] = [];

  // Gather branch metrics for the chosen timeframe
  const branchData = branches.map((b) => {
    const cell = report.matrix.cells[b]?.[weight] || { sold: 0, stock: 0, moveIn: 0, moveOut: 0, netMove: 0 };
    const stock = cell.stock;

    const s1y = cell.sold;
    const s3m = Math.max(0, Math.round(s1y * 0.4));
    const s6m = Math.max(0, Math.round(s1y * 0.7));
    const s2y = Math.max(0, Math.round(s1y * 1.8));

    let salesInChosen = s1y;
    if (timeframe === '3M') salesInChosen = s3m;
    else if (timeframe === '6M') salesInChosen = s6m;
    else if (timeframe === '2Y') salesInChosen = s2y;

    return {
      branch: b,
      stock,
      salesInChosen,
      s3m,
      s6m,
      s1y,
      s2y
    };
  });

  const totalSoldInTimeframe = branchData.reduce((sum, d) => sum + d.salesInChosen, 0);

  // Exact Largest-Remainder Allocation Method ensuring sum(deservedStock) === totalCompanyStock
  const allocatedDeserved: Record<string, number> = {};

  if (totalCompanyStock === 0) {
    branches.forEach((b) => { allocatedDeserved[b] = 0; });
  } else if (totalSoldInTimeframe > 0) {
    let totalAllocated = 0;
    const remainders: { branch: string; fraction: number; sales: number }[] = [];

    branchData.forEach((d) => {
      const exactQuota = (d.salesInChosen / totalSoldInTimeframe) * totalCompanyStock;
      const floorQuota = Math.floor(exactQuota);
      allocatedDeserved[d.branch] = floorQuota;
      totalAllocated += floorQuota;
      remainders.push({
        branch: d.branch,
        fraction: exactQuota - floorQuota,
        sales: d.salesInChosen
      });
    });

    let unassigned = totalCompanyStock - totalAllocated;
    remainders.sort((a, b) => {
      // Prioritize outlets that generated sales but received 0 integer quota
      if (a.sales > 0 && allocatedDeserved[a.branch] === 0 && (b.sales === 0 || allocatedDeserved[b.branch] > 0)) return -1;
      if (b.sales > 0 && allocatedDeserved[b.branch] === 0 && (a.sales === 0 || allocatedDeserved[a.branch] > 0)) return 1;
      return b.fraction - a.fraction;
    });

    for (let i = 0; i < remainders.length && unassigned > 0; i++) {
      allocatedDeserved[remainders[i].branch] += 1;
      unassigned--;
    }
  } else {
    // Equal distribution if zero sales in period
    const baseQuota = Math.floor(totalCompanyStock / branches.length);
    let rem = totalCompanyStock - (baseQuota * branches.length);
    branches.forEach((b, idx) => {
      allocatedDeserved[b] = baseQuota + (idx < rem ? 1 : 0);
    });
  }

  // Construct rows with accurate variance and action quantities
  branchData.forEach((d) => {
    const salesContributionPct = totalSoldInTimeframe > 0
      ? Math.round((d.salesInChosen / totalSoldInTimeframe) * 1000) / 10
      : 0;

    const deservedStock = allocatedDeserved[d.branch] || 0;
    const variance = d.stock - deservedStock;
    let action: OptionAllocationRow['action'] = 'BALANCED';
    let actionQty = Math.abs(variance);

    if (variance > 0) {
      action = 'WITHDRAW'; // Move Out excess stock
      excessList.push({ branch: d.branch, excess: variance });
    } else if (variance < 0) {
      action = 'SEND';     // Move In needed stock
      shortageList.push({ branch: d.branch, shortage: Math.abs(variance) });
    }

    const growthTargetStock = growthMultiplier > 1.0 && deservedStock > 0
      ? Math.max(deservedStock, Math.round(deservedStock * growthMultiplier))
      : deservedStock;
    const opportunityStock = Math.max(0, growthTargetStock - d.stock);

    rows.push({
      branch: d.branch,
      currentStock: d.stock,
      salesPeriod: d.salesInChosen,
      sales3M: d.s3m,
      sales6M: d.s6m,
      sales1Y: d.s1y,
      sales2Y: d.s2y,
      salesContributionPct,
      deservedStock,
      variance,
      action,
      actionQty,
      growthTargetStock,
      opportunityStock
    });
  });

  rows.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  const transferPairs: OptionAllocationSummary['transferPairs'] = [];
  excessList.sort((a, b) => b.excess - a.excess);
  shortageList.sort((a, b) => b.shortage - a.shortage);

  let eIdx = 0;
  let sIdx = 0;

  while (eIdx < excessList.length && sIdx < shortageList.length) {
    const excessObj = excessList[eIdx];
    const shortageObj = shortageList[sIdx];
    const moveQty = Math.min(excessObj.excess, shortageObj.shortage);

    if (moveQty > 0) {
      transferPairs.push({
        fromBranch: excessObj.branch,
        toBranch: shortageObj.branch,
        qty: moveQty,
        reason: `${excessObj.branch} has +${excessObj.excess} pcs excess stock. Transfer ${moveQty} pcs to ${shortageObj.branch} (shortage: ${shortageObj.shortage} pcs) to meet customer sales demand.`
      });

      excessObj.excess -= moveQty;
      shortageObj.shortage -= moveQty;
    }

    if (excessObj.excess <= 0) eIdx++;
    if (shortageObj.shortage <= 0) sIdx++;
  }

  const totalExcessToWithdraw = rows.filter(r => r.action === 'WITHDRAW').reduce((sum, r) => sum + r.actionQty, 0);
  const totalShortageToSend = rows.filter(r => r.action === 'SEND').reduce((sum, r) => sum + r.actionQty, 0);
  const availableCompanyBuffer = Math.max(0, totalExcessToWithdraw - totalShortageToSend);

  return {
    weight,
    totalCompanyStock,
    totalSoldPeriod,
    timeframe,
    growthMultiplier,
    availableCompanyBuffer,
    rows,
    totalExcessToWithdraw,
    totalShortageToSend,
    transferPairs
  };
}

/**
 * Parses raw CSV or TSV text uploaded by the user into RawInventoryRecord[]
 */
export function parseRawInventoryCSV(csvText: string): RawInventoryRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ''));
  
  let branchIdx = headers.findIndex((h) => h.includes('branch'));
  let weightIdx = headers.findIndex((h) => h.includes('weight') || h.includes('particular') || h.includes('carat') || h.includes('size'));
  let soldIdx = headers.findIndex((h) => h.includes('sold') || h.includes('sales') || h.includes('soldqty'));
  let stockIdx = headers.findIndex((h) => h.includes('stock') || h.includes('currentstock') || h.includes('qty'));

  if (branchIdx === -1) branchIdx = 0;
  if (weightIdx === -1) weightIdx = 1;
  if (soldIdx === -1) soldIdx = 2;
  if (stockIdx === -1) stockIdx = 3;

  const records: RawInventoryRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/[,\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;

    const branch = row[branchIdx] || "Main Branch";
    let weight = row[weightIdx] || "0.25";
    if (!isNaN(parseFloat(weight))) {
      weight = parseFloat(weight).toFixed(2);
    }
    const soldQty = parseInt(row[soldIdx], 10) || 0;
    const currentStock = parseInt(row[stockIdx], 10) || 0;

    records.push({
      id: `raw-${i}-${Date.now()}`,
      branch,
      weight,
      soldQty,
      currentStock,
      sales3M: Math.max(0, Math.round(soldQty * 0.4)),
      sales6M: Math.max(0, Math.round(soldQty * 0.7)),
      sales1Y: soldQty,
      sales2Y: Math.max(0, Math.round(soldQty * 1.8)),
      ageDays: currentStock > 0 && soldQty === 0 ? 320 : 65
    });
  }

  return records;
}
