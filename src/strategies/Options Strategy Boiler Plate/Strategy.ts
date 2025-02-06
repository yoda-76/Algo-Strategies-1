import axios from "axios";
import { OptionChainEntry } from "./types";
import { socketRedisClient } from "lib/redis";
import { subscribeInstrument } from "lib/subscribeInstrument";

export class Strategy {
  private static instance: Strategy | null = null;
  private static accessToken: string = '';
  private static expiry_date: string = "2025-02-06";
  private static baseInstrument: { name: string, symbol: string } = { name: "NIFTY", symbol: "NSE_INDEX|Nifty 50" };
  private static intervalTimeInSeconds: number = 5;
  private tokenList: string[] = [];
  private ltpMap = new Map<string, { value: number }>();
  private optionChain: OptionChainEntry[] = [];


  public static async getInstance(accessToken:string, baseInstrument:{ name: string, symbol: string }, expiry_date:string, intervalTimeInSeconds:number): Promise<Strategy> {
    if (!Strategy.instance) {
      if(!accessToken) throw new Error("Access Token is required");
      if(!baseInstrument) throw new Error("Base Instrument is required");
      if(!expiry_date) throw new Error("Expiry Date is required");
      if(!intervalTimeInSeconds) throw new Error("Interval Time In Seconds is required");

      Strategy.instance = new Strategy(); // Create a new instance
      Strategy.accessToken = accessToken; // Set the access token
      Strategy.baseInstrument = baseInstrument; // Set the base instrument
      Strategy.expiry_date = expiry_date; // Set the expiry date
      Strategy.intervalTimeInSeconds = intervalTimeInSeconds; // Set the interval time in seconds
      await Strategy.instance.fetchOptionChain(); // Fetch the option chain
      Strategy.instance.initializeLtpMap(Strategy.instance.optionChain); // Initialize the LTP map
      await subscribeInstrument(Strategy.instance.tokenList); // Subscribe to the instruments
      Strategy.instance.initializeLtpReader(); // Initialize the LTP reader
      Strategy.instance.strategyInterval(); // Start the strategy interval

    }
    return Strategy.instance;
  }

  // To fetch the option chain from upstox
  private fetchOptionChain = async () => {
    try {
      const access_token = Strategy.accessToken
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.upstox.com/v2/option/chain?expiry_date=${Strategy.expiry_date}&instrument_key=${Strategy.baseInstrument.symbol}`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      };
      const response = await axios(config)
      const chain: OptionChainEntry[] = response.data.data
      this.optionChain = chain

    } catch (error) {
      console.log(error)

    }
  }

  // To initialize the LTP map which will be used to store the refrence to LTP of each instrument
  private initializeLtpMap(data: OptionChainEntry[]) {
    this.ltpMap.clear();
    data.forEach((entry) => {
      this.ltpMap.set(entry.call_options.instrument_key, { value: entry.call_options.market_data.ltp });
      this.ltpMap.set(entry.put_options.instrument_key, { value: entry.put_options.market_data.ltp });
      
      // store tokens to subscribe
      this.tokenList.push(entry.call_options.instrument_key);
      this.tokenList.push(entry.put_options.instrument_key);
    });
  }

  // To read LTP from the socket
  private async initializeLtpReader() {
    socketRedisClient.subscribe("market-data");
    socketRedisClient.on("message", (channel, message) => {
      const ticks = JSON.parse(message);
      // console.log(ticks);
      const data = ticks.feeds;
      Object.keys(data).forEach((instrument_key) => {
        const ltp = data[instrument_key].ltp;
        this.updateLTP(instrument_key, ltp);
      });
    })
  }

  // To update LTP directly in the option chain
  private updateLTP(instrument_key: string, newLTP: number) {
    const ltpRef = this.ltpMap.get(instrument_key);
    if (ltpRef) {
      ltpRef.value = newLTP; // Updates the original optionChain data
    }
  }

  // Strategy interval initializer
  private strategyInterval() {
    setInterval(() => {
      this.strategyLogic();
    }, Strategy.intervalTimeInSeconds * 1000);
  }

  private strategyLogic() {
    // Implement your strategy over option chain here logic here
  }

  // To get the option chain with updated LTP
  public getOptionChain(): OptionChainEntry[] {
    return this.optionChain;
  }

}