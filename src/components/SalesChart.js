// src/components/SalesChart.js

import React, { useState, useMemo } from 'react';

function SalesChart({ orders = [], range = 'Week', width = 400, height = 200 }) {
  const [hover, setHover] = useState(null);

  // 1. Build data points (Same logic as before)
  const data = useMemo(() => {
    const now = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (range === 'Week') {
      const totals = [0, 0, 0, 0, 0, 0, 0];
      const start = new Date();
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      
      orders.forEach((o) => {
        if (!o.orderDate) return;
        const d = new Date(o.orderDate);
        if (d >= start) totals[d.getDay()] += Number(o.totalAmount) || 0;
      });
      return dayLabels.map((l, i) => ({ label: l, total: totals[i] }));
    }

    if (range === 'Month') {
      const totals = {};
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      orders.forEach((o) => {
        if (!o.orderDate) return;
        const d = new Date(o.orderDate);
        if (d >= start) {
          const wk = `W${Math.ceil(d.getDate() / 7)}`;
          totals[wk] = (totals[wk] || 0) + (Number(o.totalAmount) || 0);
        }
      });
      return ['W1', 'W2', 'W3', 'W4', 'W5'].map((l) => ({ label: l, total: totals[l] || 0 }));
    }

    return [];
  }, [orders, range]);

  // 2. Geometry & Sizing
  const PAD = { top: 40, right: 10, bottom: 30, left: 45 };
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const niceMax = Math.ceil(maxVal / 500) * 500; // Rounds to nearest 500

  const yFor = (v) => PAD.top + chartH - (v / niceMax) * chartH;
  
  // Bar calculations
  const barSpacing = chartW / data.length;
  const barWidth = barSpacing * 0.6; // Bars take up 60% of available space

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        
        {/* Y-Axis Gridlines & Labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={yFor(tick)}
              x2={width - PAD.right} y2={yFor(tick)}
              stroke="#f3f4f6" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={yFor(tick) + 3}
              fontSize="10" fill="#9ca3af" textAnchor="end" fontWeight="500"
            >
              ₱{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          // Calculate X and Y for each bar
          const x = PAD.left + (i * barSpacing) + (barSpacing - barWidth) / 2;
          const y = yFor(d.total);
          const barHeight = chartH - (y - PAD.top); 
          
          const isHovered = hover === i;

          return (
            <g key={i}>
              {/* The Bar itself */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight > 0 ? barHeight : 0}
                fill={isHovered ? '#2563eb' : '#3b82f6'} // Darker blue on hover
                rx="4" // Rounded corners on top
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              
              {/* Hover Tooltip */}
              {isHovered && d.total > 0 && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 32}
                    width="60"
                    height="22"
                    rx="4"
                    fill="#1e293b" // Dark slate color for tooltip
                  />
                  <text
                    x={x + barWidth / 2} y={y - 18}
                    fontSize="10" fill="white" textAnchor="middle" fontWeight="bold"
                  >
                    ₱ {d.total.toLocaleString()}
                  </text>
                  {/* Little triangle pointer */}
                  <polygon 
                    points={`${x + barWidth / 2 - 4},${y - 10} ${x + barWidth / 2 + 4},${y - 10} ${x + barWidth / 2},${y - 5}`}
                    fill="#1e293b"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* X-Axis Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={PAD.left + (i * barSpacing) + barSpacing / 2}
            y={height - 10}
            fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="500"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default SalesChart;