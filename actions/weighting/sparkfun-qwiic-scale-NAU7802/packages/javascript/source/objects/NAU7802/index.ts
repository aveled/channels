// #region imports
    // #region libraries
    import { NAU7802_Cal_Status } from '#data/enumerations';
import i2c from 'i2c-bus';
    // #endregion libraries


    // #region external
    import {
        NAU7802 as INAU7802,
    } from '../../data/interfaces';
    // #endregion external
// #endregion imports



// #region module
class NAU7802 implements INAU7802 {
    // private bus: number;
    // private instance: i2c.PromisifiedBus | null = null;

    // constructor(
    //     bus: number,
    // ) {
    //     this.bus = bus;
    // }

    // async initialize(
    //     options: any,
    // ) {
    //     this.instance = await i2c.openPromisified(
    //         this.bus,
    //     );
    // }



    begin(wire: any, reset: boolean): boolean {
        throw new Error('Method not implemented.');
    }
    isConnected(): boolean {
        throw new Error('Method not implemented.');
    }
    available(): boolean {
        throw new Error('Method not implemented.');
    }
    getReading(): number {
        throw new Error('Method not implemented.');
    }
    getAverage(samplesToTake: number): number {
        throw new Error('Method not implemented.');
    }
    calculateZeroOffset(averageAmount: number): void {
        throw new Error('Method not implemented.');
    }
    setZeroOffset(newZeroOffset: number): void {
        throw new Error('Method not implemented.');
    }
    getZeroOffset(): number {
        throw new Error('Method not implemented.');
    }
    calculateCalibrationFactor(weightOnScale: number, averageAmount: number): void {
        throw new Error('Method not implemented.');
    }
    setCalibrationFactor(calFactor: number): void {
        throw new Error('Method not implemented.');
    }
    getCalibrationFactor(): number {
        throw new Error('Method not implemented.');
    }
    getWeight(allowNegativeWeights: boolean, samplesToTake: number): number {
        throw new Error('Method not implemented.');
    }
    setGain(gainValue: number): boolean {
        throw new Error('Method not implemented.');
    }
    setLDO(ldoValue: number): boolean {
        throw new Error('Method not implemented.');
    }
    setSampleRate(rate: number): boolean {
        throw new Error('Method not implemented.');
    }
    setChannel(channelNumber: number): boolean {
        throw new Error('Method not implemented.');
    }
    calibrateAFE(): boolean {
        throw new Error('Method not implemented.');
    }
    beginCalibrateAFE(): void {
        throw new Error('Method not implemented.');
    }
    waitForCalibrateAFE(timeout_ms: number): boolean {
        throw new Error('Method not implemented.');
    }
    calAFEStatus(): NAU7802_Cal_Status {
        throw new Error('Method not implemented.');
    }
    reset(): boolean {
        throw new Error('Method not implemented.');
    }
    powerUp(): boolean {
        throw new Error('Method not implemented.');
    }
    powerDown(): boolean {
        throw new Error('Method not implemented.');
    }
    setIntPolarityHigh(): boolean {
        throw new Error('Method not implemented.');
    }
    setIntPolarityLow(): boolean {
        throw new Error('Method not implemented.');
    }
    getRevisionCode(): number {
        throw new Error('Method not implemented.');
    }
    setBit(bitNumber: number, registerAddress: number): boolean {
        throw new Error('Method not implemented.');
    }
    clearBit(bitNumber: number, registerAddress: number): boolean {
        throw new Error('Method not implemented.');
    }
    getBit(bitNumber: number, registerAddress: number): boolean {
        throw new Error('Method not implemented.');
    }
    getRegister(registerAddress: number): number {
        throw new Error('Method not implemented.');
    }
    setRegister(registerAddress: number, value: number): boolean {
        throw new Error('Method not implemented.');
    }
}
// #endregion module



// #region exports
export default NAU7802;
// #endregion exports
