export class RollingStraddle {
    private static instance: RollingStraddle|null = null;


    public static getInstance(): RollingStraddle {
        if (!RollingStraddle.instance) {
          RollingStraddle.instance = new RollingStraddle();
        }
        return RollingStraddle.instance;
      }
    
}