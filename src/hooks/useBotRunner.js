import { useState, useCallback } from 'react';
import { javascriptGenerator } from 'blockly/javascript';
import { useDerivTrading } from './useDerivTrading';

export function useBotRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState([]);
  const { initiateSequentialRapidFire } = useDerivTrading();

  const run = useCallback((workspace) => {
    const code = javascriptGenerator.workspaceToCode(workspace);
    setIsRunning(true);
    setLog([]);

    const purchaseFunc = (purchase_type) => {
      // Re-run the code to get the latest trade definition (stake, barrier, market, etc.)
      const trade = new Function('purchase', 'last_trade', code)(purchaseFunc, { result: 'win' });
      
      if (!trade.market || !trade.stake) {
        setLog(prev => [...prev, "Error: Trade definition missing market or stake."]);
        return;
      }

      initiateSequentialRapidFire(1, trade.stake, purchase_type, trade.barrier, trade.market);
      setLog(prev => [...prev, `🚀 EXECUTE: ${purchase_type} on ${trade.market} | Stake: $${trade.stake}`]);
    };

    try {
      // Pass the purchaseFunc to the generated code so the 'purchase' block works
      const trade = new Function('purchase', 'last_trade', code)(purchaseFunc, { result: 'win' });
      setLog(prev => [...prev, `✅ Bot Loaded: ${JSON.stringify(trade)}`]);
    } catch (e) {
      setLog(prev => [...prev, `❌ Error: ${e.message}`]);
    }

    setIsRunning(false);
  }, [initiateSequentialRapidFire]);

  return { isRunning, log, run };
}
