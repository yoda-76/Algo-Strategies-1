export interface MarketData {
    ltp: number;
    close_price: number;
    volume: number;
    oi: number;
    bid_price: number;
    bid_qty: number;
    ask_price: number;
    ask_qty: number;
    prev_oi: number;
  }
  
  export interface OptionGreeks {
    vega: number;
    theta: number;
    gamma: number;
    delta: number;
    iv: number;
  }
  
  export interface Option {
    instrument_key: string;
    market_data: MarketData;
    option_greeks: OptionGreeks;
  }
  
  export interface OptionChainEntry {
    expiry: string;
    strike_price: number;
    underlying_key: string;
    underlying_spot_price: number;
    call_options: Option;
    put_options: Option;
    pcr?: number;
  }
