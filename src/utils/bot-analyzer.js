
export const analyzeBotXml = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const blocks = Array.from(xmlDoc.querySelectorAll("block"));
  
  const analysis = {
    detected: {},
    ignored: [],
    indicators: [],
    logicComplexity: "Low",
    warnings: [],
  };

  // Helper to get field value by name
  const getFieldValue = (name) => {
    const field = xmlDoc.querySelector(`field[name="${name}"]`);
    return field ? field.textContent : null;
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
  analysis.detected.asset = assetMap[symbol] || "Volatility 10 Index";

  // 2. Identify Strategy
  let strategy = "Fixed Stake";
  const xmlLower = xmlString.toLowerCase();
  if (xmlLower.includes("martingale")) strategy = "Martingale";
  else if (xmlLower.includes("dalembert") || xmlLower.includes("d'alembert")) strategy = "D'Alembert";
  else if (xmlLower.includes("fibonacci")) strategy = "Fibonacci";
  else if (xmlLower.includes("oscar") || xmlLower.includes("grind")) strategy = "Oscar's Grind";
  else if (xmlLower.includes("percentage")) strategy = "Percentage Stake";
  analysis.detected.strategy = strategy;

  // 3. Identify Indicators
  const indicatorBlocks = {
    "sma": "Simple Moving Average (SMA)",
    "ema": "Exponential Moving Average (EMA)",
    "rsi": "Relative Strength Index (RSI)",
    "bb": "Bollinger Bands",
    "macd": "MACD",
    "stoch": "Stochastic",
    "cci": "CCI",
  };

  blocks.forEach(block => {
    const type = block.getAttribute("type")?.toLowerCase() || "";
    for (const [key, name] of Object.entries(indicatorBlocks)) {
      if (type.includes(key) && !analysis.indicators.includes(name)) {
        analysis.indicators.push(name);
      }
    }
  });

  // 4. Identify Contract Type
  const tradeType = getFieldValue("TRADETYPE_LIST") || "risefall";
  const contractTypeMap = {
    "risefall": "Rise/Fall",
    "evenodd": "Even/Odd",
    "matchdiff": "Matches/Differs",
    "overunder": "Over/Under",
    "highlow": "Higher/Lower",
  };
  analysis.detected.contract_type = contractTypeMap[tradeType] || "Rise/Fall";

  // 5. Identify Parameters
  const amountBlock = xmlDoc.querySelector('value[name="AMOUNT"] shadow field') || 
                      xmlDoc.querySelector('field[name="AMOUNT"]');
  analysis.detected.initial_stake = amountBlock ? parseFloat(amountBlock.textContent) : 0.35;

  const durationBlock = xmlDoc.querySelector('value[name="DURATION"] shadow field') ||
                        xmlDoc.querySelector('field[name="DURATION"]');
  analysis.detected.duration = durationBlock ? parseInt(durationBlock.textContent) : 5;

  const predictionBlock = xmlDoc.querySelector('value[name="PREDICTION"] shadow field') ||
                          xmlDoc.querySelector('field[name="PREDICTION"]') ||
                          xmlDoc.querySelector('field[name="MATCHDIFF_LIST"]') ||
                          xmlDoc.querySelector('field[name="EVENODD_LIST"]') ||
                          xmlDoc.querySelector('field[name="OVERUNDER_LIST"]');
  let prediction = predictionBlock ? predictionBlock.textContent : "Rise";
  
  if (prediction === "even") prediction = "Even";
  if (prediction === "odd") prediction = "Odd";
  if (prediction === "matches") prediction = "Matches";
  if (prediction === "differs") prediction = "Differs";
  if (prediction === "over") prediction = "Over";
  if (prediction === "under") prediction = "Under";
  if (prediction === "rise") prediction = "Rise";
  if (prediction === "fall") prediction = "Fall";
  analysis.detected.prediction = prediction;

  // 6. Identify Ignored Blocks (Experimental)
  const supportedBlocks = [
    "trade_definition", "trade_definition_market", "trade_definition_tradeoptions",
    "trade_definition_auth", "trade_definition_status", "before_purchase",
    "purchase", "after_purchase", "check_result", "main_stake", "main_duration",
    "main_prediction", "math_number", "logic_compare", "logic_operation", "variables_get"
  ];

  const uniqueIgnoredTypes = new Set();
  blocks.forEach(block => {
    const type = block.getAttribute("type");
    if (type && !supportedBlocks.some(s => type.includes(s))) {
      uniqueIgnoredTypes.add(type);
    }
  });
  analysis.ignored = Array.from(uniqueIgnoredTypes).slice(0, 10); // Limit to top 10 for clarity

  // 7. Logic Complexity
  const ifCount = xmlDoc.querySelectorAll('block[type="controls_if"]').length;
  if (ifCount > 10) analysis.logicComplexity = "Very High";
  else if (ifCount > 5) analysis.logicComplexity = "High";
  else if (ifCount > 2) analysis.logicComplexity = "Medium";
  else analysis.logicComplexity = "Low";

  // 8. Warnings
  if (analysis.ignored.length > 5) {
    analysis.warnings.push("Large number of unsupported blocks detected. Strategy might behave differently.");
  }
  if (!xmlString.includes("after_purchase")) {
    analysis.warnings.push("Missing 'After Purchase' block. Bot might only run once.");
  }

  analysis.detected.name = `Analyzed ${strategy} - ${analysis.detected.asset}`;

  return analysis;
};
