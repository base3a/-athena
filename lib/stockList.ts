export interface Stock {
  ticker: string;
  name: string;
}

export const STOCK_LIST: Stock[] = [
  // Mega-cap tech
  { ticker: "AAPL",  name: "Apple Inc." },
  { ticker: "MSFT",  name: "Microsoft Corporation" },
  { ticker: "NVDA",  name: "NVIDIA Corporation" },
  { ticker: "GOOGL", name: "Alphabet Inc. (Class A)" },
  { ticker: "GOOG",  name: "Alphabet Inc. (Class C)" },
  { ticker: "AMZN",  name: "Amazon.com Inc." },
  { ticker: "META",  name: "Meta Platforms Inc." },
  { ticker: "TSLA",  name: "Tesla Inc." },
  { ticker: "AVGO",  name: "Broadcom Inc." },
  { ticker: "ORCL",  name: "Oracle Corporation" },

  // Semiconductors
  { ticker: "AMD",   name: "Advanced Micro Devices Inc." },
  { ticker: "INTC",  name: "Intel Corporation" },
  { ticker: "QCOM",  name: "Qualcomm Inc." },
  { ticker: "MU",    name: "Micron Technology Inc." },
  { ticker: "AMAT",  name: "Applied Materials Inc." },
  { ticker: "LRCX",  name: "Lam Research Corporation" },
  { ticker: "KLAC",  name: "KLA Corporation" },
  { ticker: "TXN",   name: "Texas Instruments Inc." },
  { ticker: "MRVL",  name: "Marvell Technology Inc." },
  { ticker: "ON",    name: "ON Semiconductor Corporation" },

  // Software & Cloud
  { ticker: "CRM",   name: "Salesforce Inc." },
  { ticker: "NOW",   name: "ServiceNow Inc." },
  { ticker: "ADBE",  name: "Adobe Inc." },
  { ticker: "INTU",  name: "Intuit Inc." },
  { ticker: "SNOW",  name: "Snowflake Inc." },
  { ticker: "PLTR",  name: "Palantir Technologies Inc." },
  { ticker: "WDAY",  name: "Workday Inc." },
  { ticker: "TEAM",  name: "Atlassian Corporation" },
  { ticker: "DDOG",  name: "Datadog Inc." },
  { ticker: "ZS",    name: "Zscaler Inc." },
  { ticker: "CRWD",  name: "CrowdStrike Holdings Inc." },
  { ticker: "PANW",  name: "Palo Alto Networks Inc." },
  { ticker: "NET",   name: "Cloudflare Inc." },
  { ticker: "MDB",   name: "MongoDB Inc." },
  { ticker: "HUBS",  name: "HubSpot Inc." },
  { ticker: "VEEV",  name: "Veeva Systems Inc." },

  // Fintech & Payments
  { ticker: "V",     name: "Visa Inc." },
  { ticker: "MA",    name: "Mastercard Inc." },
  { ticker: "PYPL",  name: "PayPal Holdings Inc." },
  { ticker: "SQ",    name: "Block Inc." },
  { ticker: "AFRM",  name: "Affirm Holdings Inc." },
  { ticker: "COIN",  name: "Coinbase Global Inc." },
  { ticker: "FI",    name: "Fiserv Inc." },
  { ticker: "FIS",   name: "Fidelity National Information Services" },
  { ticker: "GPN",   name: "Global Payments Inc." },

  // Banking & Finance
  { ticker: "JPM",   name: "JPMorgan Chase & Co." },
  { ticker: "BAC",   name: "Bank of America Corporation" },
  { ticker: "WFC",   name: "Wells Fargo & Company" },
  { ticker: "GS",    name: "Goldman Sachs Group Inc." },
  { ticker: "MS",    name: "Morgan Stanley" },
  { ticker: "C",     name: "Citigroup Inc." },
  { ticker: "USB",   name: "U.S. Bancorp" },
  { ticker: "BLK",   name: "BlackRock Inc." },
  { ticker: "SCHW",  name: "Charles Schwab Corporation" },
  { ticker: "AXP",   name: "American Express Company" },
  { ticker: "BX",    name: "Blackstone Inc." },
  { ticker: "KKR",   name: "KKR & Co. Inc." },

  // Healthcare & Pharma
  { ticker: "LLY",   name: "Eli Lilly and Company" },
  { ticker: "JNJ",   name: "Johnson & Johnson" },
  { ticker: "UNH",   name: "UnitedHealth Group Inc." },
  { ticker: "ABBV",  name: "AbbVie Inc." },
  { ticker: "MRK",   name: "Merck & Co. Inc." },
  { ticker: "PFE",   name: "Pfizer Inc." },
  { ticker: "TMO",   name: "Thermo Fisher Scientific Inc." },
  { ticker: "ABT",   name: "Abbott Laboratories" },
  { ticker: "DHR",   name: "Danaher Corporation" },
  { ticker: "ISRG",  name: "Intuitive Surgical Inc." },
  { ticker: "VRTX",  name: "Vertex Pharmaceuticals Inc." },
  { ticker: "REGN",  name: "Regeneron Pharmaceuticals Inc." },
  { ticker: "GILD",  name: "Gilead Sciences Inc." },
  { ticker: "AMGN",  name: "Amgen Inc." },
  { ticker: "BMY",   name: "Bristol-Myers Squibb Company" },
  { ticker: "NVO",   name: "Novo Nordisk A/S" },
  { ticker: "MRNA",  name: "Moderna Inc." },
  { ticker: "BIIB",  name: "Biogen Inc." },
  { ticker: "ILMN",  name: "Illumina Inc." },
  { ticker: "DXCM",  name: "DexCom Inc." },

  // Consumer & Retail
  { ticker: "WMT",   name: "Walmart Inc." },
  { ticker: "COST",  name: "Costco Wholesale Corporation" },
  { ticker: "HD",    name: "Home Depot Inc." },
  { ticker: "TGT",   name: "Target Corporation" },
  { ticker: "LOW",   name: "Lowe's Companies Inc." },
  { ticker: "NKE",   name: "Nike Inc." },
  { ticker: "SBUX",  name: "Starbucks Corporation" },
  { ticker: "MCD",   name: "McDonald's Corporation" },
  { ticker: "LULU",  name: "Lululemon Athletica Inc." },
  { ticker: "DECK",  name: "Deckers Outdoor Corporation" },
  { ticker: "TJX",   name: "TJX Companies Inc." },
  { ticker: "EBAY",  name: "eBay Inc." },
  { ticker: "ETSY",  name: "Etsy Inc." },
  { ticker: "AMZN",  name: "Amazon.com Inc." },

  // Entertainment & Media
  { ticker: "NFLX",  name: "Netflix Inc." },
  { ticker: "DIS",   name: "Walt Disney Company" },
  { ticker: "SPOT",  name: "Spotify Technology S.A." },
  { ticker: "PARA",  name: "Paramount Global" },
  { ticker: "WBD",   name: "Warner Bros. Discovery Inc." },
  { ticker: "RBLX",  name: "Roblox Corporation" },
  { ticker: "EA",    name: "Electronic Arts Inc." },
  { ticker: "TTWO",  name: "Take-Two Interactive Software Inc." },

  // Electric Vehicles & Auto
  { ticker: "F",     name: "Ford Motor Company" },
  { ticker: "GM",    name: "General Motors Company" },
  { ticker: "RIVN",  name: "Rivian Automotive Inc." },
  { ticker: "LCID",  name: "Lucid Group Inc." },
  { ticker: "TM",    name: "Toyota Motor Corporation" },

  // Energy & Oil
  { ticker: "XOM",   name: "Exxon Mobil Corporation" },
  { ticker: "CVX",   name: "Chevron Corporation" },
  { ticker: "COP",   name: "ConocoPhillips" },
  { ticker: "SLB",   name: "SLB (Schlumberger)" },
  { ticker: "OXY",   name: "Occidental Petroleum Corporation" },
  { ticker: "PXD",   name: "Pioneer Natural Resources Company" },
  { ticker: "PSX",   name: "Phillips 66" },
  { ticker: "EOG",   name: "EOG Resources Inc." },

  // Renewable & Clean Energy
  { ticker: "ENPH",  name: "Enphase Energy Inc." },
  { ticker: "FSLR",  name: "First Solar Inc." },
  { ticker: "NEE",   name: "NextEra Energy Inc." },
  { ticker: "SEDG",  name: "SolarEdge Technologies Inc." },
  { ticker: "PLUG",  name: "Plug Power Inc." },
  { ticker: "BE",    name: "Bloom Energy Corporation" },

  // Aerospace & Defense
  { ticker: "BA",    name: "Boeing Company" },
  { ticker: "LMT",   name: "Lockheed Martin Corporation" },
  { ticker: "RTX",   name: "RTX Corporation" },
  { ticker: "GE",    name: "GE Aerospace" },
  { ticker: "NOC",   name: "Northrop Grumman Corporation" },
  { ticker: "HII",   name: "Huntington Ingalls Industries Inc." },
  { ticker: "AXON",  name: "Axon Enterprise Inc." },
  { ticker: "SPCE",  name: "Virgin Galactic Holdings Inc." },

  // Telecom
  { ticker: "T",     name: "AT&T Inc." },
  { ticker: "VZ",    name: "Verizon Communications Inc." },
  { ticker: "TMUS",  name: "T-Mobile US Inc." },

  // Real Estate & REITs
  { ticker: "AMT",   name: "American Tower Corporation" },
  { ticker: "PLD",   name: "Prologis Inc." },
  { ticker: "EQIX",  name: "Equinix Inc." },
  { ticker: "CCI",   name: "Crown Castle Inc." },
  { ticker: "SPG",   name: "Simon Property Group Inc." },

  // Industrials
  { ticker: "CAT",   name: "Caterpillar Inc." },
  { ticker: "DE",    name: "Deere & Company" },
  { ticker: "HON",   name: "Honeywell International Inc." },
  { ticker: "MMM",   name: "3M Company" },
  { ticker: "UPS",   name: "United Parcel Service Inc." },
  { ticker: "FDX",   name: "FedEx Corporation" },
  { ticker: "GD",    name: "General Dynamics Corporation" },
  { ticker: "EMR",   name: "Emerson Electric Co." },
  { ticker: "ITW",   name: "Illinois Tool Works Inc." },
  { ticker: "ETN",   name: "Eaton Corporation" },
  { ticker: "PH",    name: "Parker-Hannifin Corporation" },
  { ticker: "ROK",   name: "Rockwell Automation Inc." },

  // Materials & Chemicals
  { ticker: "LIN",   name: "Linde plc" },
  { ticker: "APD",   name: "Air Products and Chemicals Inc." },
  { ticker: "SHW",   name: "Sherwin-Williams Company" },
  { ticker: "FCX",   name: "Freeport-McMoRan Inc." },
  { ticker: "NEM",   name: "Newmont Corporation" },
  { ticker: "AA",    name: "Alcoa Corporation" },
  { ticker: "NUE",   name: "Nucor Corporation" },

  // AI & Robotics
  { ticker: "PATH",  name: "UiPath Inc." },
  { ticker: "AI",    name: "C3.ai Inc." },
  { ticker: "BBAI",  name: "BigBear.ai Holdings Inc." },
  { ticker: "SOUN",  name: "SoundHound AI Inc." },
  { ticker: "IONQ",  name: "IonQ Inc." },
  { ticker: "QUBT",  name: "Quantum Computing Inc." },
  { ticker: "RGTI",  name: "Rigetti Computing Inc." },

  // E-commerce & Marketplace
  { ticker: "SHOP",  name: "Shopify Inc." },
  { ticker: "MELI",  name: "MercadoLibre Inc." },
  { ticker: "SE",    name: "Sea Limited" },
  { ticker: "PDD",   name: "PDD Holdings Inc." },
  { ticker: "JD",    name: "JD.com Inc." },
  { ticker: "BABA",  name: "Alibaba Group Holding Limited" },
  { ticker: "BIDU",  name: "Baidu Inc." },

  // Travel & Hospitality
  { ticker: "ABNB",  name: "Airbnb Inc." },
  { ticker: "UBER",  name: "Uber Technologies Inc." },
  { ticker: "LYFT",  name: "Lyft Inc." },
  { ticker: "DASH",  name: "DoorDash Inc." },
  { ticker: "BKNG",  name: "Booking Holdings Inc." },
  { ticker: "EXPE",  name: "Expedia Group Inc." },
  { ticker: "MAR",   name: "Marriott International Inc." },
  { ticker: "HLT",   name: "Hilton Worldwide Holdings Inc." },
  { ticker: "CCL",   name: "Carnival Corporation & plc" },
  { ticker: "RCL",   name: "Royal Caribbean Cruises Ltd." },
  { ticker: "DAL",   name: "Delta Air Lines Inc." },
  { ticker: "UAL",   name: "United Airlines Holdings Inc." },
  { ticker: "AAL",   name: "American Airlines Group Inc." },
  { ticker: "LUV",   name: "Southwest Airlines Co." },

  // Food & Beverage
  { ticker: "KO",    name: "Coca-Cola Company" },
  { ticker: "PEP",   name: "PepsiCo Inc." },
  { ticker: "MDLZ",  name: "Mondelez International Inc." },
  { ticker: "GIS",   name: "General Mills Inc." },
  { ticker: "K",     name: "Kellanova" },
  { ticker: "HSY",   name: "Hershey Company" },
  { ticker: "MKC",   name: "McCormick & Company Inc." },

  // Insurance
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc. (Class B)" },
  { ticker: "BRK.A", name: "Berkshire Hathaway Inc. (Class A)" },
  { ticker: "PGR",   name: "Progressive Corporation" },
  { ticker: "ALL",   name: "Allstate Corporation" },
  { ticker: "MET",   name: "MetLife Inc." },
  { ticker: "PRU",   name: "Prudential Financial Inc." },
  { ticker: "AFL",   name: "Aflac Inc." },
  { ticker: "CB",    name: "Chubb Limited" },
  { ticker: "TRV",   name: "Travelers Companies Inc." },

  // Consumer Staples
  { ticker: "PG",    name: "Procter & Gamble Company" },
  { ticker: "CL",    name: "Colgate-Palmolive Company" },
  { ticker: "KMB",   name: "Kimberly-Clark Corporation" },
  { ticker: "CHD",   name: "Church & Dwight Co. Inc." },
  { ticker: "CLX",   name: "Clorox Company" },

  // Space & Satellite
  { ticker: "ASTS",  name: "AST SpaceMobile Inc." },
  { ticker: "RKLB",  name: "Rocket Lab USA Inc." },
  { ticker: "ASTR",  name: "Astra Space Inc." },

  // ETFs (most searched)
  { ticker: "SPY",   name: "SPDR S&P 500 ETF Trust" },
  { ticker: "QQQ",   name: "Invesco QQQ Trust (Nasdaq 100)" },
  { ticker: "IWM",   name: "iShares Russell 2000 ETF" },
  { ticker: "DIA",   name: "SPDR Dow Jones Industrial Average ETF" },
  { ticker: "VTI",   name: "Vanguard Total Stock Market ETF" },
  { ticker: "ARKK",  name: "ARK Innovation ETF" },
  { ticker: "GLD",   name: "SPDR Gold Shares ETF" },
  { ticker: "SLV",   name: "iShares Silver Trust ETF" },
  { ticker: "XLK",   name: "Technology Select Sector SPDR ETF" },
  { ticker: "XLE",   name: "Energy Select Sector SPDR ETF" },
  { ticker: "SOXS",  name: "Direxion Daily Semiconductor Bear 3x ETF" },
  { ticker: "SOXL",  name: "Direxion Daily Semiconductor Bull 3x ETF" },
  { ticker: "TQQQ",  name: "ProShares UltraPro QQQ ETF" },
  { ticker: "SQQQ",  name: "ProShares UltraPro Short QQQ ETF" },
];

// De-duplicate (AMZN appears twice in source list above)
const seen = new Set<string>();
const dedupedList = STOCK_LIST.filter(({ ticker }) => {
  if (seen.has(ticker)) return false;
  seen.add(ticker);
  return true;
});

export { dedupedList as STOCKS };

/**
 * Search stocks by ticker or company name.
 * Relevance scoring:
 *   100 — exact ticker match
 *    80 — ticker starts with query
 *    60 — ticker contains query
 *    35 — company name starts with query (word boundary)
 *    20 — company name contains query
 */
export function searchStocks(rawQuery: string, maxResults = 5): Stock[] {
  const q = rawQuery.trim().toUpperCase();
  if (q.length < 2) return [];

  const scored: Array<{ stock: Stock; score: number }> = [];

  for (const stock of dedupedList) {
    const ticker  = stock.ticker.toUpperCase();
    const nameLow = stock.name.toUpperCase();

    let score = 0;

    if (ticker === q) {
      score = 100;
    } else if (ticker.startsWith(q)) {
      score = 80;
    } else if (ticker.includes(q)) {
      score = 60;
    } else if (nameLow.startsWith(q) || nameLow.split(/\s+/).some(word => word.startsWith(q))) {
      score = 35;
    } else if (nameLow.includes(q)) {
      score = 20;
    }

    if (score > 0) scored.push({ stock, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.stock.ticker.localeCompare(b.stock.ticker))
    .slice(0, maxResults)
    .map(({ stock }) => stock);
}
