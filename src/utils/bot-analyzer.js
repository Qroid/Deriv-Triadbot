
export const analyzeBotXml = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const blocks = Array.from(xmlDoc.querySelectorAll("block"));
  const variables = Array.from(xmlDoc.querySelectorAll("variable"));
  
  const analysis = {
    detected: {},
    ignored: [],
    indicators: [],
    logicComplexity: "Low",
    warnings: [],
    impactAssessment: {
      logic: { status: "preserved", detail: "Core logic intact." },
      money: { status: "preserved", detail: "Money management fully mapped." },
      indicators: { status: "preserved", detail: "Technical analysis preserved." },
      performance: { status: "optimized", detail: "Standard execution speed." }
    },
    compatibilityScore: 100,
  };

  // Helper to get field value by name
  const getFieldValue = (name) => {
    const field = xmlDoc.querySelector(`field[name="${name}"]`);
    return field ? field.textContent : null;
  };

  // 1. Identify Asset
  const symbol = getFieldValue("SYMBOL_LIST") || getFieldValue("SYMBOL") || "R_10";
  const assetMap = {
    "R_10": "Volatility 10 Index", "R_25": "Volatility 25 Index", "R_50": "Volatility 50 Index",
    "R_75": "Volatility 75 Index", "R_100": "Volatility 100 Index", "B1000": "Boom 1000 Index",
    "B500": "Boom 500 Index", "C1000": "Crash 1000 Index", "C500": "Crash 500 Index",
    "STPR": "Step Index", "RB100": "Range Break 100 Index", "RB200": "Range Break 200 Index",
    "1HZ10V": "Volatility 10 (1s) Index", "1HZ100V": "Volatility 100 (1s) Index"
  };
  analysis.detected.asset = assetMap[symbol] || "Volatility 10 Index";

  // 2. Identify Strategy & Money Management Impact
  let strategy = "Fixed Stake";
  const xmlLower = xmlString.toLowerCase();
  if (xmlLower.includes("martingale")) strategy = "Martingale";
  else if (xmlLower.includes("dalembert") || xmlLower.includes("d'alembert")) strategy = "D'Alembert";
  else if (xmlLower.includes("fibonacci")) strategy = "Fibonacci";
  else if (xmlLower.includes("oscar") || xmlLower.includes("grind")) strategy = "Oscar's Grind";
  else if (xmlLower.includes("percentage")) strategy = "Percentage Stake";
  
  analysis.detected.strategy = strategy;

  // 3. Identify Indicators & Technical Impact
  const indicatorBlocks = {
    "sma": "SMA", "ema": "EMA", "rsi": "RSI", "bb": "Bollinger Bands",
    "macd": "MACD", "stoch": "Stochastic", "cci": "CCI",
  };

  blocks.forEach(block => {
    const type = block.getAttribute("type")?.toLowerCase() || "";
    for (const [key, name] of Object.entries(indicatorBlocks)) {
      if (type.includes(key) && !analysis.indicators.includes(name)) {
        analysis.indicators.push(name);
      }
    }
  });

  if (analysis.indicators.length > 0) {
    analysis.impactAssessment.indicators = {
      status: "partial",
      detail: `${analysis.indicators.join(", ")} logic will be simplified to core signals.`
    };
    analysis.compatibilityScore -= 10;
  }

  // 4. Identify Parameters
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
  analysis.detected.prediction = prediction;

  // 5. Advanced Heuristic Mapping (Special for FREDDY's bots)
  const hasRandomVar = variables.some(v => v.textContent === "Random");
  const randomVarAssigned = blocks.some(b => 
    b.getAttribute("type") === "variables_set" && 
    b.querySelector('field[name="VAR"]')?.textContent === "Random"
  );

  if (hasRandomVar && !randomVarAssigned) {
    analysis.impactAssessment.logic = {
      status: "optimized",
      detail: "Detected unassigned 'Random' variable. Auto-mapping to real-time Last Digit stream."
    };
    analysis.compatibilityScore += 5;
  }

  // 6. Social Logic & Reporting Impact
  const hasHeavyReporting = blocks.filter(b => ["notify", "text_print", "text_join"].includes(b.getAttribute("type"))).length > 5;
  if (hasHeavyReporting) {
    analysis.impactAssessment.performance = {
      status: "optimized",
      detail: "Heavy reporting detected. Moving social logic to background thread for zero-latency trading."
    };
    analysis.compatibilityScore += 5;
  }

  // 7. Logic Complexity & Impact Analysis
  const supportedBlocks = [
    "trade_definition", "before_purchase", "purchase", "after_purchase", 
    "check_result", "main_stake", "variables_get", "math_number"
  ];

  const criticalIgnored = new Set();
  blocks.forEach(block => {
    const type = block.getAttribute("type");
    if (type && !supportedBlocks.some(s => type.includes(s))) {
      if (type.includes("controls_if") || type.includes("logic_") || type.includes("procedures_")) {
        criticalIgnored.add(type);
      }
      if (!analysis.ignored.includes(type)) analysis.ignored.push(type);
    }
  });

  if (criticalIgnored.size > 0 && analysis.impactAssessment.logic.status !== "optimized") {
    analysis.impactAssessment.logic = {
      status: "high-impact",
      detail: "Custom conditional logic detected. Using high-speed behavioral prototype."
    };
    analysis.compatibilityScore -= 20;
  }

  const ifCount = xmlDoc.querySelectorAll('block[type="controls_if"]').length;
  analysis.logicComplexity = ifCount > 10 ? "Very High" : ifCount > 5 ? "High" : ifCount > 2 ? "Medium" : "Low";

  // 8. Final Prototype Readiness
  if (!xmlString.includes("after_purchase")) {
    analysis.warnings.push("No post-trade logic found. Risk of single-trade execution.");
    analysis.compatibilityScore -= 20;
  }

  analysis.compatibilityScore = Math.min(100, Math.max(10, analysis.compatibilityScore));
  analysis.detected.name = `Prototype: ${strategy} (${analysis.detected.asset})`;

  return analysis;
};
