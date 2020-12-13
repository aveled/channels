// #region imports
    // #region libraries
    import i2c from 'i2c-bus';
    // #endregion libraries
// #endregion imports



// #region module
class NAU7802 {
    private bus: number;
    private instance: i2c.PromisifiedBus | null = null;

    constructor(
        bus: number,
    ) {
        this.bus = bus;
    }

    async initialize(
        options: any,
    ) {
        this.instance = await i2c.openPromisified(
            this.bus,
        );
    }
}
// #endregion module



// #region exports
export default NAU7802;
// #endregion exports
