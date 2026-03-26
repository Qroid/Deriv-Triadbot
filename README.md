# Deriv Triadbot

Deriv Triadbot is a specialized high-frequency trading assistant and market scanner designed for Deriv's **Synthetic Indices**. It provides real-time analysis, digit frequency tracking, and automated trading strategies for professional traders.

## Features

- **Market Scanner**: Real-time analysis of Volatility, Boom/Crash, Step, and Range Break indices.
- **Digit Frequency Engine**: Tracks last-digit distributions (0–9) across 1000 ticks for precise Over/Under and Matches/Differs setups.
- **High-Frequency Execution**: Features "Sequential Rapid Fire" execution for 1-tick duration contracts.
- **Strategy Models**:
  - **Digit Pattern Recognition**: Detects least-frequent digit pairs with confidence scoring.
  - **Spike Detection**: Immediate detection of Boom/Crash spikes.
  - **Trend Bias**: 1000-tick bullish/bearish trend alignment.
- **Automated Bots**: Manage and run multiple strategy bots (Martingale, Fibonacci, D'Alembert, etc.) with custom TP/SL and stake management.

## Getting Started

### Prerequisites

- Node.js (v18+)
- A valid [Deriv API Token](https://app.deriv.com/account/api-token)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/Deriv-Triadbot.git
   cd Deriv-Triadbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Trading Disclaimer

Trading Synthetic Indices involves significant risk. This tool is an assistant and does not guarantee profits. Always trade with capital you can afford to lose and test strategies in a Demo account first.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
