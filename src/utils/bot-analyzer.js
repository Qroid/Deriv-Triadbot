
export const analyzeBotXml = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Helper to get field value by name
  const getFieldValue = (name) => {
    const field = xmlDoc.querySelector(`field[name="${name}"]`);
    return field ? field.textContent : null;
  };

  // Helper to get block value by type
  const getBlockValue = (type) => {
    const block = xmlDoc.querySelector(`block[type="${type}"]`);
    if (!block) return null;
    const value = block.querySelector('value[name="AMOUNT"] shadow field');
    return value ? value.textContent : null;
  };

  // 1. Identify Asset (Symbol)
  const symbol = getFieldValue("SYMBOL_LIST") || getFieldValue("SYMBOL") || "R_10";
  const assetMap = {
    "R_10": "Volatility 10 Index",
    "R_25": "Volatility 25 Index",
    "R_50": "Volatility 50 Index",
    "R_75": "Volatility 75 Index",
    "R_100": "Volatility 100 Index",
    "B1000": "Boom 1000 Index",
    "B500": "Boom 500 Index",
    "C1000": "Crash 1000 Index",
    "C500": "Crash 500 Index",
    "STPR": "Step Index",
    "RB100": "Range Break 100 Index",
    "RB200": "Range Break 200 Index",
  };
  const asset = assetMap[symbol] || "Volatility 10 Index";

  // 2. Identify Strategy
  // We'll search for specific keywords or block patterns
  let strategy = "Martingale"; // Default
  const xmlLower = xmlString.toLowerCase();
  if (xmlLower.includes("martingale")) strategy = "Martingale";
  else if (xmlLower.includes("dalembert") || xmlLower.includes("d'alembert")) strategy = "D'Alembert";
  else if (xmlLower.includes("fibonacci")) strategy = "Fibonacci";
  else if (xmlLower.includes("oscar") || xmlLower.includes("grind")) strategy = "Oscar's Grind";
  else if (xmlLower.includes("percentage")) strategy = "Percentage Stake";
  else strategy = "Fixed Stake";

  // 3. Identify Contract Type
  const tradeType = getFieldValue("TRADETYPE_LIST") || "risefall";
  const contractTypeMap = {
    "risefall": "Rise/Fall",
    "evenodd": "Even/Odd",
    "matchdiff": "Matches/Differs",
    "overunder": "Over/Under",
    "highlow": "Higher/Lower",
  };
  const contract_type = contractTypeMap[tradeType] || "Rise/Fall";

  // 4. Identify Initial Stake
  // Usually in a block with name "AMOUNT"
  const amountBlock = xmlDoc.querySelector('value[name="AMOUNT"] shadow field') || 
                      xmlDoc.querySelector('field[name="AMOUNT"]');
  const initial_stake = amountBlock ? parseFloat(amountBlock.textContent) : 0.35;

  // 5. Identify Duration
  const durationBlock = xmlDoc.querySelector('value[name="DURATION"] shadow field') ||
                        xmlDoc.querySelector('field[name="DURATION"]');
  const duration = durationBlock ? parseInt(durationBlock.textContent) : 5;

  // 6. Identify Prediction
  const predictionBlock = xmlDoc.querySelector('value[name="PREDICTION"] shadow field') ||
                          xmlDoc.querySelector('field[name="PREDICTION"]') ||
                          xmlDoc.querySelector('field[name="MATCHDIFF_LIST"]') ||
                          xmlDoc.querySelector('field[name="EVENODD_LIST"]') ||
                          xmlDoc.querySelector('field[name="OVERUNDER_LIST"]');
  let prediction = predictionBlock ? predictionBlock.textContent : "Rise";
  
  // Normalize prediction
  if (prediction === "even") prediction = "Even";
  if (prediction === "odd") prediction = "Odd";
  if (prediction === "matches") prediction = "Matches";
  if (prediction === "differs") prediction = "Differs";
  if (prediction === "over") prediction = "Over";
  if (prediction === "under") prediction = "Under";
  if (prediction === "rise") prediction = "Rise";
  if (prediction === "fall") prediction = "Fall";

  // 7. Extract Name from filename or a comment (if possible)
  // For now, let's just use a generic name based on strategy and asset
  const name = `Imported ${strategy} - ${asset}`;

  return {
    name,
    asset,
    strategy,
    contract_type,
    prediction: prediction || "Rise",
    initial_stake: initial_stake || 0.35,
    take_profit: 10, // Default for imported bots
    stop_loss: 5,   // Default for imported bots
    max_trades: 100,
    duration: duration || 5,
    multiplier: 2,   // Default for martingale
  };
};
