"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface OverviewProps {
  data?: { name: string; total: number }[];
}

export function Overview({ data }: OverviewProps) {
  // Fallback if no data
  const chartData = data && data.length > 0 ? data : [
     { name: "Mon", total: 0 },
     { name: "Tue", total: 0 },
     { name: "Wed", total: 0 },
     { name: "Thu", total: 0 },
     { name: "Fri", total: 0 },
     { name: "Sat", total: 0 },
     { name: "Sun", total: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData}>
        <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#333' }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorTotal)" 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
