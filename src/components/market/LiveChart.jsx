import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, ReferenceLine } from "recharts";
import { useMemo } from "react";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const val = parseFloat(payload[0]?.value);
  return (
    <div className="bg-card/90 backdrop-blur border border-border/50 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-foreground font-bold">{isNaN(val) ? "—" : val.toFixed(3)}</p>
    </div>
  );
};

export default function LiveChart({ ticks, changePct }) {
  const data = useMemo(() =>
    ticks?.map((value, index) => ({ index, value })) || [], [ticks]);

  const isUp = changePct >= 0;
  const color = isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)";
  const gradId = isUp ? "gradUp" : "gradDown";

  const domain = useMemo(() => {
    if (!data.length) return ["auto", "auto"];
    const vals = data.map(d => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1;
    return [min - pad, max + pad];
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={domain} hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}