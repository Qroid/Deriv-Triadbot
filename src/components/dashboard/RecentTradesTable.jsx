import moment from "moment";

export default function RecentTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No trades yet. Start a bot to begin trading.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bot</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stake</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-3 px-4 font-medium text-foreground">{trade.bot_name}</td>
              <td className="py-3 px-4 text-muted-foreground text-xs">{trade.asset}</td>
              <td className="py-3 px-4 text-right font-mono text-foreground">${trade.stake?.toFixed(2)}</td>
              <td className={`py-3 px-4 text-right font-mono font-semibold ${
                trade.profit >= 0 ? "text-success" : "text-destructive"
              }`}>
                {trade.profit >= 0 ? "+" : ""}{trade.profit?.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  trade.result === "win"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {trade.result}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-muted-foreground text-xs hidden md:table-cell">
                {moment(trade.created_date).fromNow()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}