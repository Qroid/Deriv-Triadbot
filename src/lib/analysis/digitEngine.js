/**
 * digitEngine.js - CORE Analysis for Deriv Synthetic Markets
 * Focused on Matches/Differs, Over/Under, Odd/Even, and Rise/Fall.
 */

// ════════════════════════════════════════════════════════
// SECTION A — MATCHES / DIFFERS ENGINE
// ════════════════════════════════════════════════════════

export function analyzeMatchesDiffers(digitHistory, windowSize = 500) {
  const window = digitHistory.slice(-windowSize);
  if (window.length < 100) return null;

  // 1. Frequency analysis
  const counts = Array(10).fill(0);
  window.forEach(d => counts[d]++);
  const expected = window.length / 10;
  
  const digitStats = counts.map((count, digit) => ({
    digit,
    count,
    frequency: count / window.length,
    deviation: ((count - expected) / (expected || 1)) * 100,
    zScore: (count - expected) / Math.sqrt(expected || 1),
  }));
  
  const byFreq = [...digitStats].sort((a, b) => a.count - b.count);
  const coldDigits = byFreq.slice(0, 3);
  const hotDigits = byFreq.slice(-3).reverse();

  // 2. Consecutive streaks
  let currentMatchStreak = 0;
  let currentDifferStreak = 0;
  for (let i = window.length - 1; i > 0; i--) {
    if (window[i] === window[i-1]) {
      if (currentDifferStreak === 0) currentMatchStreak++;
      else break;
    } else {
      if (currentMatchStreak === 0) currentDifferStreak++;
      else break;
    }
  }

  // 3. Match vs Differ ratio
  let matchCount = 0, differCount = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i] === window[i-1]) matchCount++; else differCount++;
  }
  const totalStreaks = matchCount + differCount || 1;
  const matchRate = matchCount / totalStreaks;
  const differRate = 1 - matchRate;

  // 4. Markov transition
  const lastDigit = window[window.length - 1];
  const transitions = Array(10).fill(0);
  for (let i = 0; i < window.length - 1; i++) {
    if (window[i] === lastDigit) transitions[window[i+1]]++;
  }
  const totalTransitions = transitions.reduce((a, b) => a + b, 0);
  const transitionProbs = transitions.map((t, d) => ({
    digit: d,
    probability: totalTransitions > 0 ? t / totalTransitions : 0.1,
  }));
  const leastLikelyNext = [...transitionProbs].sort((a,b) => a.probability - b.probability)[0];
  const mostLikelyNext = [...transitionProbs].sort((a,b) => b.probability - a.probability)[0];

  // 5. Signal determination
  let differsConfidence = 60;
  if (currentDifferStreak >= 5) differsConfidence = Math.min(85, 60 + currentDifferStreak * 3);
  if (differRate > 0.92) differsConfidence = Math.min(90, differsConfidence + 10);
  
  let matchesConfidence = 0;
  let matchesTargetDigit = null;
  if (currentMatchStreak >= 2) {
    matchesConfidence = Math.min(75, 40 + currentMatchStreak * 15);
    matchesTargetDigit = lastDigit;
  }
  const hottestDigit = hotDigits[0];
  if (hottestDigit.zScore > 2.5 && matchesConfidence < 60) {
    matchesConfidence = 65;
    matchesTargetDigit = hottestDigit.digit;
  }

  return {
    contract: differsConfidence >= matchesConfidence ? 'DIFFERS' : 'MATCHES',
    differsConfidence,
    matchesConfidence,
    targetDigit: differsConfidence >= matchesConfidence ? lastDigit : matchesTargetDigit,
    differsBestTarget: coldDigits[0].digit,
    currentMatchStreak,
    currentDifferStreak,
    matchRate: Math.round(matchRate * 100),
    differRate: Math.round(differRate * 100),
    coldDigits: coldDigits.map(d => d.digit),
    hotDigits: hotDigits.map(d => d.digit),
    leastLikelyNext: leastLikelyNext.digit,
    mostLikelyNext: mostLikelyNext.digit,
    reasoning: differsConfidence >= matchesConfidence 
      ? `Differ streak: ${currentDifferStreak}. Differ rate: ${Math.round(differRate*100)}%. Base edge strong.`
      : `Match streak: ${currentMatchStreak}x on digit ${lastDigit}. Pattern momentum detected.`
  };
}

// ════════════════════════════════════════════════════════
// SECTION B — OVER / UNDER ENGINE
// ════════════════════════════════════════════════════════

export function analyzeOverUnder(digitHistory, windowSize = 500) {
  const window = digitHistory.slice(-windowSize);
  if (window.length < 100) return null;

  const counts = Array(10).fill(0);
  window.forEach(d => counts[d]++);
  const total = window.length;

  const overStats = Array.from({length: 9}, (_, i) => {
    const barrier = i;
    const winningDigits = counts.slice(barrier + 1).reduce((a, b) => a + b, 0);
    const actualRate = winningDigits / total;
    const expectedRate = (9 - barrier) / 10;
    const edge = actualRate - expectedRate;
    return { barrier, actualRate, expectedRate, edge, winningDigits };
  });

  const underStats = Array.from({length: 9}, (_, i) => {
    const barrier = i + 1;
    const winningDigits = counts.slice(0, barrier).reduce((a, b) => a + b, 0);
    const actualRate = winningDigits / total;
    const expectedRate = barrier / 10;
    const edge = actualRate - expectedRate;
    return { barrier, actualRate, expectedRate, edge, winningDigits };
  });

  const viableOver = overStats.filter(s => s.expectedRate >= 0.5 && s.edge > 0)
    .sort((a, b) => (b.edge * b.actualRate) - (a.edge * a.actualRate));
  
  const viableUnder = underStats.filter(s => s.expectedRate >= 0.5 && s.edge > 0)
    .sort((a, b) => (b.edge * b.actualRate) - (a.edge * a.actualRate));

  const bestOver = viableOver[0] || null;
  const bestUnder = viableUnder[0] || null;

  const overScore = bestOver ? bestOver.edge * 100 * bestOver.actualRate : 0;
  const underScore = bestUnder ? bestUnder.edge * 100 * bestUnder.actualRate : 0;

  const recent50 = digitHistory.slice(-50);
  const recentAvg = recent50.reduce((a, b) => a + b, 0) / (recent50.length || 1);
  const recentBias = recentAvg < 4.5 ? 'LOW_BIAS' : recentAvg > 5.5 ? 'HIGH_BIAS' : 'NEUTRAL';

  const contract = overScore >= underScore ? 'OVER' : 'UNDER';
  const best = contract === 'OVER' ? bestOver : bestUnder;

  const baseConfidence = best ? Math.min(85, 50 + Math.abs(best.edge) * 500) : 0;
  const biasPenalty = (contract === 'OVER' && recentBias === 'LOW_BIAS') ? -5 
    : (contract === 'UNDER' && recentBias === 'HIGH_BIAS') ? -5 : 5;

  return {
    contract,
    barrier: best?.barrier ?? (contract === 'OVER' ? 4 : 5),
    confidence: Math.max(0, Math.min(85, baseConfidence + biasPenalty)),
    edge: best?.edge ?? 0,
    actualWinRate: best ? Math.round(best.actualRate * 100) : 50,
    expectedWinRate: best ? Math.round(best.expectedRate * 100) : 50,
    recentBias,
    overStats,
    underStats,
    bestOver,
    bestUnder,
    reasoning: best 
      ? `${contract} ${best.barrier}: actual win rate ${Math.round(best.actualRate*100)}% vs expected ${Math.round(best.expectedRate*100)}%. Edge: +${(best.edge*100).toFixed(1)}%`
      : 'No statistical edge detected for Over/Under'
  };
}

// ════════════════════════════════════════════════════════
// SECTION C — ODD / EVEN ENGINE
// ════════════════════════════════════════════════════════

export function analyzeOddEven(digitHistory, windowSize = 500) {
  const window = digitHistory.slice(-windowSize);
  if (window.length < 100) return null;

  const parityHistory = window.map(d => d % 2 === 0 ? 'E' : 'O');
  
  const evenCount = parityHistory.filter(p => p === 'E').length;
  const oddCount = parityHistory.length - evenCount;
  const evenRate = evenCount / parityHistory.length;
  const oddRate = oddCount / parityHistory.length;

  let currentStreak = { type: parityHistory[parityHistory.length - 1], length: 0 };
  for (let i = parityHistory.length - 1; i >= 0; i--) {
    if (parityHistory[i] === currentStreak.type) currentStreak.length++;
    else break;
  }

  let alternations = 0;
  for (let i = 1; i < parityHistory.length; i++) {
    if (parityHistory[i] !== parityHistory[i-1]) alternations++;
  }
  const alternationRate = alternations / (parityHistory.length - 1 || 1);

  const recent30 = parityHistory.slice(-30);
  const recentEvenRate = recent30.filter(p => p === 'E').length / (recent30.length || 1);

  let detectedCycle = 'NONE';
  if (alternationRate > 0.7) detectedCycle = 'HIGH_ALTERNATION';
  else if (alternationRate < 0.35) detectedCycle = 'CLUSTERING';

  let contract, confidence;
  if (currentStreak.length >= 4) {
    if (alternationRate > 0.55) {
      contract = currentStreak.type === 'O' ? 'EVEN' : 'ODD';
      confidence = Math.min(78, 55 + currentStreak.length * 3 + (alternationRate - 0.5) * 60);
    } else {
      contract = currentStreak.type === 'O' ? 'ODD' : 'EVEN';
      confidence = Math.min(72, 50 + currentStreak.length * 2);
    }
  } else {
    if (Math.abs(evenRate - 0.5) > 0.05) {
      contract = evenRate > 0.5 ? 'EVEN' : 'ODD';
      confidence = Math.min(70, 50 + Math.abs(evenRate - 0.5) * 200);
    } else {
      contract = 'EVEN';
      confidence = 52;
    }
  }

  if (contract === 'EVEN' && recentEvenRate > 0.6) confidence = Math.min(80, confidence + 8);
  if (contract === 'ODD' && recentEvenRate < 0.4) confidence = Math.min(80, confidence + 8);

  return {
    contract,
    confidence: Math.round(confidence),
    evenRate: Math.round(evenRate * 100),
    oddRate: Math.round(oddRate * 100),
    recentEvenRate: Math.round(recentEvenRate * 100),
    currentStreak,
    alternationRate: Math.round(alternationRate * 100),
    detectedCycle,
    reasoning: `${contract} signal. Streak: ${currentStreak.length}x ${currentStreak.type}. ` + 
               `Alternation: ${Math.round(alternationRate*100)}%. Recent even rate: ${Math.round(recentEvenRate*100)}%.`
  };
}

// ════════════════════════════════════════════════════════
// SECTION D — RISE / FALL ENGINE (Synthetic-aware)
// ════════════════════════════════════════════════════════

export function analyzeRiseFall(priceHistory, asset, windowSize = 200) {
  const prices = priceHistory.map(parseFloat).filter(p => !isNaN(p));
  if (prices.length < 20) return null;

  const window = prices.slice(-windowSize);
  const last = window[window.length - 1];
  const prev = window[window.length - 2];

  const last5 = window.slice(-5);
  let upTicks = 0, downTicks = 0;
  for (let i = 1; i < last5.length; i++) {
    if (last5[i] > last5[i-1]) upTicks++;
    else if (last5[i] < last5[i-1]) downTicks++;
  }
  const microMomentum = upTicks > downTicks ? 'UP' : downTicks > upTicks ? 'DOWN' : 'NEUTRAL';

  let directionStreak = 0;
  let streakDir = last > prev ? 'UP' : 'DOWN';
  for (let i = window.length - 1; i > 0; i--) {
    const dir = window[i] > window[i-1] ? 'UP' : 'DOWN';
    if (dir === streakDir) directionStreak++;
    else break;
  }

  let assetContext = { signal: 'NEUTRAL', boost: 0, reason: '' };
  if (asset.includes('Boom')) {
    const change = Math.abs(last - prev) / (prev || 1);
    if (change > 0.005) {
      assetContext = { signal: 'RISE', boost: 15, reason: 'Boom spike detected. Post-spike rise tendency.' };
    } else {
      assetContext = { signal: 'FALL', boost: 5, reason: 'Boom: inter-spike slight downward drift.' };
    }
  } else if (asset.includes('Crash')) {
    const change = Math.abs(last - prev) / (prev || 1);
    if (change > 0.005) {
      assetContext = { signal: 'FALL', boost: 15, reason: 'Crash spike detected. Post-spike fall tendency.' };
    } else {
      assetContext = { signal: 'RISE', boost: 5, reason: 'Crash: inter-spike slight upward drift.' };
    }
  } else if (asset.includes('Step')) {
    if (directionStreak >= 3) {
      assetContext = { 
        signal: streakDir === 'UP' ? 'FALL' : 'RISE', 
        boost: 12, 
        reason: `Step Index: ${directionStreak} consecutive ${streakDir} moves. Reversal expected.` 
      };
    }
  } else {
    if (directionStreak >= 4) {
      assetContext = { 
        signal: streakDir === 'UP' ? 'FALL' : 'RISE', 
        boost: 8, 
        reason: `Volatility streak: ${directionStreak}x ${streakDir}. Mean reversion signal.` 
      };
    } else if (microMomentum !== 'NEUTRAL') {
      assetContext = { 
        signal: microMomentum, 
        boost: 5, 
        reason: `Micro-momentum: ${upTicks} up vs ${downTicks} down in last 5 ticks.` 
      };
    }
  }

  const min = Math.min(...window);
  const max = Math.max(...window);
  const range = max - min;
  const position = range > 0 ? (last - min) / range : 0.5;
  
  let rangeBoost = 0;
  if (position > 0.85) rangeBoost = -5;
  if (position < 0.15) rangeBoost = 5;

  const contract = assetContext.signal === 'NEUTRAL' ? 
    (microMomentum === 'UP' ? 'RISE' : 'FALL') : 
    assetContext.signal;

  const baseConfidence = 50 + assetContext.boost + rangeBoost;
  const confidence = Math.max(45, Math.min(80, baseConfidence));

  return {
    contract,
    confidence: Math.round(confidence),
    microMomentum,
    directionStreak,
    streakDirection: streakDir,
    pricePosition: Math.round(position * 100),
    assetSpecificReason: assetContext.reason,
    reasoning: assetContext.reason || 
      `${contract}: micro-momentum ${microMomentum}, streak ${directionStreak}x ${streakDir}`
  };
}

// ════════════════════════════════════════════════════════
// SECTION E — STATISTICAL EDGE CORE
// ════════════════════════════════════════════════════════

export function computeStatisticalEdge(digitHistory, windowSize = 500) {
  const window = digitHistory.slice(-windowSize);
  if (window.length < 100) return { exploitable: false, score: 0 };

  const counts = Array(10).fill(0);
  window.forEach(d => counts[d]++);
  const total = window.length;
  const expected = total / 10;

  const chiSquare = counts.reduce((sum, obs) => 
    sum + Math.pow(obs - expected, 2) / (expected || 1), 0);
  const chiSignificance = chiSquare > 27.88 ? 'VERY_HIGH' 
    : chiSquare > 21.67 ? 'HIGH' 
    : chiSquare > 16.92 ? 'MEDIUM' 
    : 'LOW';

  let entropy = 0;
  counts.forEach(c => {
    if (c > 0) {
      const p = c / total;
      entropy -= p * Math.log2(p);
    }
  });
  const maxEntropy = Math.log2(10);
  const normalizedEntropy = entropy / maxEntropy;
  const entropyPattern = normalizedEntropy < 0.88 ? 'HIGHLY_EXPLOITABLE' 
    : normalizedEntropy < 0.93 ? 'EXPLOITABLE' 
    : normalizedEntropy < 0.97 ? 'SLIGHT_BIAS' 
    : 'RANDOM';

  const digitZScores = counts.map((count, digit) => ({
    digit,
    count,
    zScore: (count - expected) / Math.sqrt(expected || 1),
    percentFromExpected: ((count - expected) / (expected || 1)) * 100,
  }));
  
  const coldDigits = digitZScores.filter(d => d.zScore < -1.5).sort((a, b) => a.zScore - b.zScore);
  const hotDigits = digitZScores.filter(d => d.zScore > 1.5).sort((a, b) => b.zScore - a.zScore);

  let score = 0;
  if (chiSignificance === 'VERY_HIGH') score += 40;
  else if (chiSignificance === 'HIGH') score += 30;
  else if (chiSignificance === 'MEDIUM') score += 15;

  if (entropyPattern === 'HIGHLY_EXPLOITABLE') score += 35;
  else if (entropyPattern === 'EXPLOITABLE') score += 20;
  else if (entropyPattern === 'SLIGHT_BIAS') score += 8;

  score += Math.min(25, coldDigits.length * 8);

  return {
    chiSquare: Math.round(chiSquare * 100) / 100,
    chiSignificance,
    entropy: Math.round(normalizedEntropy * 100) / 100,
    entropyPattern,
    coldDigits: coldDigits.map(d => ({ digit: d.digit, zScore: Math.round(d.zScore*10)/10 })),
    hotDigits: hotDigits.map(d => ({ digit: d.digit, zScore: Math.round(d.zScore*10)/10 })),
    exploitable: score > 30,
    score: Math.min(100, score),
  };
}

// ════════════════════════════════════════════════════════
// SECTION F — MASTER CONTRACT SELECTOR
// ════════════════════════════════════════════════════════

export function selectBestContract(digitHistory, priceHistory, asset) {
  if (!digitHistory || digitHistory.length < 100) {
    return { contract: null, confidence: 0, reason: 'Collecting data...' };
  }

  const prices = priceHistory?.map(parseFloat).filter(p => !isNaN(p)) || [];
  
  const mdAnalysis = analyzeMatchesDiffers(digitHistory);
  const ouAnalysis = analyzeOverUnder(digitHistory);
  const oeAnalysis = analyzeOddEven(digitHistory);
  const rfAnalysis = prices.length >= 20 ? analyzeRiseFall(prices, asset) : null;
  const statEdge = computeStatisticalEdge(digitHistory);

  const candidates = [];

  if (mdAnalysis) {
    candidates.push({ 
      contract: 'DIFFERS', type: 'DIFFERS', barrier: mdAnalysis.differsBestTarget, 
      confidence: mdAnalysis.differsConfidence, family: 'MATCHES_DIFFERS', 
      reason: mdAnalysis.reasoning, raw: mdAnalysis 
    });
    if (mdAnalysis.matchesConfidence >= 60) {
      candidates.push({ 
        contract: 'MATCHES', type: 'MATCHES', barrier: mdAnalysis.targetDigit, 
        confidence: mdAnalysis.matchesConfidence, family: 'MATCHES_DIFFERS', 
        reason: mdAnalysis.reasoning, raw: mdAnalysis 
      });
    }
  }

  if (ouAnalysis && ouAnalysis.confidence >= 55) {
    candidates.push({ 
      contract: ouAnalysis.contract, type: ouAnalysis.contract, barrier: ouAnalysis.barrier, 
      confidence: ouAnalysis.confidence, family: 'OVER_UNDER', 
      reason: ouAnalysis.reasoning, raw: ouAnalysis 
    });
  }

  if (oeAnalysis && oeAnalysis.confidence >= 55) {
    candidates.push({ 
      contract: oeAnalysis.contract, type: oeAnalysis.contract, barrier: null, 
      confidence: oeAnalysis.confidence, family: 'ODD_EVEN', 
      reason: oeAnalysis.reasoning, raw: oeAnalysis 
    });
  }

  if (rfAnalysis && rfAnalysis.confidence >= 55) {
    candidates.push({ 
      contract: rfAnalysis.contract, type: rfAnalysis.contract, barrier: null, 
      confidence: rfAnalysis.confidence, family: 'RISE_FALL', 
      reason: rfAnalysis.reasoning, raw: rfAnalysis 
    });
  }

  if (candidates.length === 0) {
    return { contract: null, confidence: 0, reason: 'No edge detected. Waiting...' };
  }

  candidates.forEach(c => {
    if (statEdge.exploitable && c.family !== 'RISE_FALL') {
      c.confidence = Math.min(92, c.confidence + Math.round(statEdge.score * 0.1));
    }
  });

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  return {
    contract: best.contract,
    type: best.type,
    barrier: best.barrier,
    confidence: best.confidence,
    family: best.family,
    reason: best.reason,
    statEdge,
    alternatives: candidates.slice(1, 3),
    allAnalysis: { mdAnalysis, ouAnalysis, oeAnalysis, rfAnalysis },
  };
}
