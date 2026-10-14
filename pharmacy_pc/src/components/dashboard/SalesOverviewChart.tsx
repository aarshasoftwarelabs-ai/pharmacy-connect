import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, LineChart, Sparkles, Layers, ArrowUpRight, IndianRupee, Receipt } from 'lucide-react';
import { Bill } from '../../types/billing';

interface SalesOverviewChartProps {
  bills: Bill[];
  className?: string;
}

type ChartViewType = 'HYBRID' | 'WAVE' | 'BARS';

export default function SalesOverviewChart({ bills, className = '' }: SalesOverviewChartProps) {
  const [viewMode, setViewMode] = useState<ChartViewType>('HYBRID');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute 7-day data
  const chartData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const dayBills = bills.filter(b => new Date(b.createdAt).toDateString() === dayStr);
      const daySales = dayBills.reduce((s, b) => s + Number(b.total || 0), 0);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales,
        billCount: dayBills.length,
        isToday: i === 6
      };
    });
  }, [bills]);

  // Aggregate metrics
  const totalSales = useMemo(() => chartData.reduce((acc, d) => acc + d.sales, 0), [chartData]);
  const totalBills = useMemo(() => chartData.reduce((acc, d) => acc + d.billCount, 0), [chartData]);
  const avgSales = Math.round(totalSales / 7);
  const maxSales = useMemo(() => Math.max(500, ...chartData.map(d => d.sales)), [chartData]);
  const peakDay = useMemo(() => {
    return chartData.reduce((max, d) => d.sales > max.sales ? d : max, chartData[0]);
  }, [chartData]);

  // Generate smooth cubic bezier spline (Catmull-Rom to Cubic Bezier)
  const { linePath, areaPath, points } = useMemo(() => {
    const width = 1000;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    const pts = chartData.map((d, i) => {
      const x = paddingX + (i / (chartData.length - 1)) * usableWidth;
      const normalizedSales = d.sales / maxSales;
      // Add a slight minimum baseline lift so zero days don't clip flat
      const y = height - paddingY - normalizedSales * usableHeight;
      return { x, y, sales: d.sales, day: d.day };
    });

    if (pts.length === 0) return { linePath: '', areaPath: '', points: [] };

    // Catmull-Rom to Cubic Bezier path calculation
    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const firstPt = pts[0];
    const lastPt = pts[pts.length - 1];
    const area = `${path} L ${lastPt.x.toFixed(1)},${height} L ${firstPt.x.toFixed(1)},${height} Z`;

    return { linePath: path, areaPath: area, points: pts };
  }, [chartData, maxSales]);

  // Format currency
  const formatCurrency = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const activeIndex = hoveredIdx !== null ? hoveredIdx : (chartData.findIndex(d => d.sales === peakDay.sales) || 6);
  const activeItem = chartData[activeIndex];

  return (
    <div className={`bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/90 flex flex-col group hover:shadow-md transition-all relative overflow-hidden ${className}`}>
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none"></div>

      {/* Top Header & Analytics Summary */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Sales Analytics</h3>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live POS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Real-time revenue performance for past 7 days</p>
            </div>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Weekly Total Pill */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">7-Day Total:</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(totalSales)}</span>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('HYBRID')}
              title="Combined View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'HYBRID'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hybrid</span>
            </button>
            <button
              onClick={() => setViewMode('WAVE')}
              title="Smooth Trend Wave"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'WAVE'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Wave</span>
            </button>
            <button
              onClick={() => setViewMode('BARS')}
              title="3D Modern Bars"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'BARS'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Board */}
      <div className="relative mt-2 h-60 sm:h-64 lg:h-72 w-full select-none">
        {/* Background Y-Axis Grid Lines & Milestones */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
          {[1, 0.66, 0.33, 0].map((ratio, idx) => (
            <div key={idx} className="flex items-center w-full">
              <span className="w-12 text-[10px] font-bold text-slate-400 font-mono text-right pr-2 shrink-0">
                {formatCurrency(Math.round(maxSales * ratio))}
              </span>
              <div className="w-full h-px bg-slate-100 border-t border-dashed border-slate-200/70"></div>
            </div>
          ))}
        </div>

        {/* SVG Drawing Canvas for Waves & Curves */}
        {(viewMode === 'WAVE' || viewMode === 'HYBRID') && (
          <div className="absolute inset-0 pl-12 pb-8 pt-4 w-full h-full pointer-events-none">
            <svg 
              viewBox="0 0 1000 240" 
              preserveAspectRatio="none" 
              className="w-full h-full overflow-visible"
            >
              <defs>
                {/* Lush Emerald to Cyan Wave Gradient */}
                <linearGradient id="lushWaveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="45%" stopColor="#14b8a6" stopOpacity="0.18" />
                  <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>

                {/* Animated Stroke Gradient */}
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Glow Filter for the wave line */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Gradient Area Fill */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                d={areaPath}
                fill="url(#lushWaveGradient)"
              />

              {/* Glowing Curved Trendline */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                d={linePath}
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
              />

              {/* Data Points on the wave */}
              {points.map((pt, i) => {
                const isHovered = hoveredIdx === i;
                const isPeak = chartData[i]?.sales === peakDay.sales && peakDay.sales > 0;

                return (
                  <g key={i}>
                    {/* Pulsing ring for peak day or active hover */}
                    {(isHovered || isPeak) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        fill="#10b981"
                        fillOpacity="0.15"
                        className="animate-ping"
                      />
                    )}
                    {/* Outer border circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '7' : isPeak ? '5.5' : '4.5'}
                      fill="#ffffff"
                      stroke={isPeak ? '#059669' : '#10b981'}
                      strokeWidth={isHovered ? '3.5' : '2.5'}
                      className="transition-all duration-200"
                    />
                    {/* Inner core circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '3' : '2'}
                      fill={isHovered ? '#059669' : '#10b981'}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Interactive Columns & Modern 3D Bar Columns */}
        <div className="absolute inset-0 pl-12 pb-8 pt-4 w-full h-full flex items-end justify-between">
          {chartData.map((d, i) => {
            const isHovered = hoveredIdx === i;
            const isPeak = d.sales === peakDay.sales && peakDay.sales > 0;
            const heightPercent = maxSales > 0 ? Math.max(6, Math.round((d.sales / maxSales) * 85)) : 6;

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 h-full flex flex-col justify-end items-center px-1.5 sm:px-3 cursor-pointer group/bar z-20"
              >
                {/* Vertical hover light beam */}
                <div 
                  className={`absolute inset-y-0 w-full rounded-2xl transition-all duration-200 pointer-events-none ${
                    isHovered ? 'bg-emerald-500/10' : 'group-hover/bar:bg-slate-100/50'
                  }`}
                />

                {/* 3D Modern Bar (Rendered in BARS or HYBRID mode) */}
                {(viewMode === 'BARS' || viewMode === 'HYBRID') && (
                  <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-full">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: `${heightPercent}%`, 
                        opacity: viewMode === 'HYBRID' ? (isHovered ? 0.9 : 0.45) : (isHovered ? 1 : 0.85) 
                      }}
                      transition={{ 
                        duration: 0.8, 
                        delay: i * 0.08,
                        ease: [0.34, 1.56, 0.64, 1] 
                      }}
                      className={`w-full rounded-t-xl rounded-b-md relative overflow-hidden transition-all duration-200 ${
                        isHovered 
                          ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400' 
                          : isPeak
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm'
                            : 'bg-gradient-to-t from-slate-200 via-teal-200 to-emerald-300'
                      }`}
                    >
                      {/* Top gloss highlight on bar */}
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-white/60 rounded-t-xl"></div>
                    </motion.div>
                  </div>
                )}

                {/* Floating Interactive Tooltip (Shown on hover) */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-[calc(100%-10px)] mb-2 z-40 pointer-events-none"
                    >
                      <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 min-w-[150px] text-center backdrop-blur-md">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          {d.fullDate}
                        </div>
                        <div className="text-lg font-black text-emerald-400">
                          {formatCurrency(d.sales)}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                          <Receipt className="w-3 h-3 text-teal-400" />
                          <span>{d.billCount} {d.billCount === 1 ? 'Bill' : 'Bills'} generated</span>
                        </div>
                        {isPeak && (
                          <div className="mt-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full inline-block border border-amber-500/30">
                            ⭐ Highest Peak
                          </div>
                        )}
                        {/* Downward tooltip arrow */}
                        <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/80 rotate-45 mx-auto -mb-4 mt-1.5"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom X-Axis Days Labels */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between items-center pt-2 border-t border-slate-100">
          {chartData.map((d, i) => {
            const isHovered = hoveredIdx === i;
            const isPeak = d.sales === peakDay.sales && peakDay.sales > 0;

            return (
              <div 
                key={i} 
                className="flex-1 text-center cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={`inline-flex flex-col items-center px-2 py-1 rounded-xl transition-all ${
                  isHovered 
                    ? 'bg-emerald-600 text-white shadow-sm scale-105' 
                    : d.isToday
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                }`}>
                  <span className="text-xs font-bold leading-tight">{d.day}</span>
                  <span className={`text-[10px] leading-tight ${isHovered ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {d.shortDate.split(' ')[1]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creative Bottom Metrics Strip */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center sm:text-left relative z-10">
        <div className="p-2 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Peak Day</p>
            <p className="text-sm font-black text-slate-800">{peakDay.day} ({formatCurrency(peakDay.sales)})</p>
          </div>
        </div>

        <div className="p-2 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Daily Average</p>
            <p className="text-sm font-black text-slate-800">{formatCurrency(avgSales)}</p>
          </div>
        </div>

        <div className="p-2 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Bills</p>
            <p className="text-sm font-black text-slate-800">{totalBills} Bills</p>
          </div>
        </div>
      </div>
    </div>
  );
}
