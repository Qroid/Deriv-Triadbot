import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";

export default function MiniChart({ data, color = "hsl(187, 85%, 53%)", height = 120 }) {
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    // Generate sample fluctuating data
    const points = [];
    let value = 100;
    for (let i = 0; i < 30; i++) {
      value += (Math.random() - 0.48) * 8;
      points.push({ time: i, value: Math.max(50, value) });
    }
    return points;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" hide />
        <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
        <Tooltip
          contentStyle={{
            background: "hsl(222, 44%, 8%)",
            border: "1px solid hsl(222, 20%, 16%)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(210, 40%, 96%)",
          }}
          formatter={(val) => [`$${val.toFixed(2)}`, "Value"]}
          labelFormatter={() => ""}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}