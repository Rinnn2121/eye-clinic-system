// src/components/SalesChart.js

import React, { useState, useMemo } from 'react';

function SalesChart({ orders = [], range = 'Week', width = 400, height = 200 }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(() => {
    const now = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // ✅ NEW: Handle TODAY by grouping into 4-hour blocks
    if (range === 'Today') {
      const buckets = [
        { label: '12A', total: 0 },
        { label: '4A',  total: 0 },
        { label: '8A',  total: 0 },
        { label: '12P', total: 0 },
        { label: '4P',  total: 0 },
        { label: '8P',  total: 0 },
      ];

      orders.forEach((o) => {
        if (!o.orderDate) return;
        const d = new Date(o.orderDate);
        // Check if the order happened today
        if (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        ) {
          const hour = d.getHours();
          // Group hours: 0-3 (12A), 4-7 (4A), 8-11 (8A), 12-15 (12P), 16-19 (4P), 20-23 (8P)
          const idx = Math.min(Math.floor(hour / 4), 5);
          buckets[idx].total += Number(o.totalAmount) || 0;
        }
      });
      return buckets;
    }

    // Existing WEEK logic
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

    // Existing MONTH logic
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

  const PAD = { top: 40, right: 10, bottom: 30, left: 45 };
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const niceMax = Math.ceil(maxVal / 500) * 500; 

  const yFor = (v) => PAD.top + chartH - (v / niceMax) * chartH;
  
  const barSpacing = chartW / data.length;
  const barWidth = barSpacing * 0.6; 

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        
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

        {data.map((d, i) => {
          const x = PAD.left + (i * barSpacing) + (barSpacing - barWidth) / 2;
          const y = yFor(d.total);
          const barHeight = chartH - (y - PAD.top); 
          
          const isHovered = hover === i;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight > 0 ? barHeight : 0}
                fill={isHovered ? '#2563eb' : '#3b82f6'}
                rx="4" 
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              
              {isHovered && d.total > 0 && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 32}
                    width="60"
                    height="22"
                    rx="4"
                    fill="#1e293b" 
                  />
                  <text
                    x={x + barWidth / 2} y={y - 18}
                    fontSize="10" fill="white" textAnchor="middle" fontWeight="bold"
                  >
                    ₱ {d.total.toLocaleString()}
                  </text>
                  <polygon 
                    points={`${x + barWidth / 2 - 4},${y - 10} ${x + barWidth / 2 + 4},${y - 10} ${x + barWidth / 2},${y - 5}`}
                    fill="#1e293b"
                  />
                </g>
              )}
            </g>
          );
        })}

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