export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const symbols = "AMZN,GOOGL,CSU.TO,NVDA,MA,MSFT,META,LLY,SPGI,FICO,V,ZTS,WKL.AS,FBTC";

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbols}`,
    `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${symbols}`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
  ];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://finance.yahoo.com",
    "Referer": "https://finance.yahoo.com/",
  };

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;

      const data = await response.json();
      const quotes = data?.quoteResponse?.result || data?.quoteSummary?.result || [];

      if (!quotes.length) continue;

      const result = {};
      quotes.forEach(q => {
        result[q.symbol] = {
          price: q.regularMarketPrice || q.postMarketPrice || 0,
          change: q.regularMarketChange || 0,
          changePct: q.regularMarketChangePercent || 0,
          currency: q.currency || "USD",
          name: q.shortName || q.symbol,
          marketState: q.marketState || "CLOSED",
        };
      });

      if (Object.keys(result).length > 0) {
        return res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          source: "Yahoo Finance"
        });
      }
    } catch(e) {
      continue;
    }
  }

  // Fallback con precios de cierre conocidos (30 abril 2026)
  res.status(200).json({
    success: false,
    data: {},
    timestamp: new Date().toISOString(),
    note: "Mercado cerrado o API no disponible"
  });
}
