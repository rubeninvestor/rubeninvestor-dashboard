export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const stockSymbols = [
    "AMZN","GOOGL","CSU.TO","NVDA","MA","MSFT",
    "META","LLY","SPGI","FICO","V","ZTS","WKL.AS","FBTC.MI"
  ];

  const fxSymbols = ["EURUSD=X","CADUSD=X"];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://finance.yahoo.com",
    "Referer": "https://finance.yahoo.com/"
  };

  const fetchSymbol = async (symbol) => {
    // Use 5d range so we get sparkline data + 52W metadata
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) continue;
        const d = await r.json();
        const meta = d?.chart?.result?.[0]?.meta;
        const quotes = d?.chart?.result?.[0]?.indicators?.quote?.[0];
        if (!meta || !meta.regularMarketPrice) continue;
        const price = meta.regularMarketPrice;
        const prev = meta.previousClose || price;
        // Extract 5-day closes for sparkline
        const closes = (quotes?.close || [])
          .filter(c => c !== null && c !== undefined && !isNaN(c));
        return {
          symbol,
          price,
          change: price - prev,
          changePct: ((price - prev) / prev) * 100,
          currency: meta.currency || "USD",
          marketState: meta.marketState || "REGULAR",
          high52w: meta.fiftyTwoWeekHigh || null,
          low52w: meta.fiftyTwoWeekLow || null,
          sparkline: closes.slice(-5)
        };
      } catch { continue; }
    }
    return null;
  };

  try {
    const allSymbols = [...stockSymbols, ...fxSymbols];
    const results = await Promise.all(allSymbols.map(fetchSymbol));

    const data = {};
    const fx = {};

    results.forEach(r => {
      if (!r) return;
      if (r.symbol === "EURUSD=X") {
        fx.EURUSD = r.price;
      } else if (r.symbol === "CADUSD=X") {
        fx.CADUSD = r.price;
      } else {
        data[r.symbol] = r;
      }
    });

    if (!fx.EURUSD) fx.EURUSD = 1.13;
    if (!fx.CADUSD) fx.CADUSD = 0.73;

    return res.status(200).json({
      success: true,
      data,
      fx,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    return res.status(200).json({
      success: false,
      error: e.message,
      data: {},
      fx: { EURUSD: 1.13, CADUSD: 0.73 },
      timestamp: new Date().toISOString()
    });
  }
}
