const ccxt = require("ccxt");
const { MACD } = require("technicalindicators");

async function macdSignals() {
  const exchange = new ccxt.binance({ enableRateLimit: true });
  await exchange.loadMarkets();

  const symbols = Object.keys(exchange.markets)
    .filter(s => s.endsWith("/USDT"))
    .slice(0, 50);

  for (const symbol of symbols) {
    try {
      // Fetch last 100 1h candles
      const ohlcv = await exchange.fetchOHLCV(symbol, "1h", undefined, 100);
      const closes = ohlcv.map(c => c[4]); 

    
      const macdInput = {
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      };

      const macdResults = MACD.calculate(macdInput);

      if (macdResults.length < 2) {
        console.log(`${symbol}: Not enough data to calculate MACD`);
        continue;
      }

      const last = macdResults[macdResults.length - 1];
      const prev = macdResults[macdResults.length - 2];

      // Checking
      let signal = null;
      if (prev.MACD < prev.signal && last.MACD > last.signal) {
        signal = "BUY";
      } else if (prev.MACD > prev.signal && last.MACD < last.signal) {
        signal = "SELL";
      }

      console.log(`${symbol}: MACD=${last.MACD.toFixed(4)}, Signal=${last.signal.toFixed(4)}, Action=${signal ?? "HOLD"}`);

    
      await new Promise(r => setTimeout(r, exchange.rateLimit));
    } catch (err) {
      console.error(`Error fetching ${symbol}: ${err.message}`);
    }
  }
}

macdSignals();
