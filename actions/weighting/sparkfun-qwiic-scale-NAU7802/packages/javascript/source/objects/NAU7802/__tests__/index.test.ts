// #region imports
    // #region external
    import NAU7802 from '../';
    // #endregion external
// #endregion imports



// #region module
describe('NAU7802', () => {
    it('gets readings', async () => {
        const address = 0x35;
        const scale = new NAU7802(address);
        scale.begin(1);

        // while(true) {
        //     const reading = scale.getReading();

        //     console.log('reading', reading);
        // }
    });
});
// #endregion module
