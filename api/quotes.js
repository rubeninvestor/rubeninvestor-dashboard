export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const symbols = "AMZN,GOOGL,CSU.TO,NVDA,MA,MSFT,META,LLY,SPGI,FICO,V,ZTS,WKL.AS";

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,currency`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];
    const result = {};

    quotes.forEach(q => {
      result[q.symbol] = {
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePct: q.regularMarketChangePercent || 0,
        currency: q.currency || "USD",
      };
    });

    res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });

  } catch (error) {
    res.status(200).json({ success: false, error: error.message, data: {} });
  }
}
