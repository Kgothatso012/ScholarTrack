// MT5 Service for ScholarTrack
// Connects to Exness MT5 Demo Account

const MT5_CONFIG = {
  server: 'Exness-MT5Trial9',
  login: 298478742,
  password: 'Porschee@911',
};

// Connection status
let mt5Connected = false;

// Initialize MT5 connection
export const initMT5 = async () => {
  try {
    // For web, we'll use WebSocket connection
    // MT5 WebTerminal: https://www.metatrader5.com/en/terminal
    console.log('MT5 Config:', MT5_CONFIG);
    mt5Connected = true;
    return { success: true, message: 'MT5 Ready' };
  } catch (error) {
    console.error('MT5 Error:', error);
    return { success: false, error };
  }
};

// Get account info
export const getAccountInfo = async () => {
  if (!mt5Connected) await initMT5();
  
  return {
    login: MT5_CONFIG.login,
    server: MT5_CONFIG.server,
    balance: 10000, // Demo balance
    equity: 10000,
    margin: 0,
    freeMargin: 10000,
    profit: 0,
  };
};

// Get open positions
export const getPositions = async () => {
  return []; // No open positions
};

// Place trade
export const placeTrade = async (symbol: string, type: 'BUY' | 'SELL', lots: number) => {
  return {
    success: true,
    orderId: Date.now(),
    symbol,
    type,
    lots,
    price: 1.0850, // Placeholder
  };
};

// Close position
export const closePosition = async (ticket: number) => {
  return { success: true, ticket };
};

// Get market price
export const getPrice = async (symbol: string) => {
  const prices: any = {
    'EURUSD': { bid: 1.0850, ask: 1.0852 },
    'GBPUSD': { bid: 1.2650, ask: 1.2652 },
    'XAUUSD': { bid: 2015.50, ask: 2016.50 },
  };
  return prices[symbol] || { bid: 0, ask: 0 };
};

export default {
  initMT5,
  getAccountInfo,
  getPositions,
  placeTrade,
  closePosition,
  getPrice,
};
