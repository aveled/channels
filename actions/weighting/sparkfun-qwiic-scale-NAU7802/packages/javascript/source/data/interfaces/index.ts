// #region imports
    // #region external
    import {
        NAU7802_Cal_Status,
    } from '../enumerations';
    // #endregion external
// #endregion imports



// #region module
export interface NAU7802 {
    // Check communication and initialize sensor.
    begin(
        bus: number,
        reset: boolean,
    ): Promise<boolean>;
    // Returns `true` if device ACKs at the I2C address.
    isConnected(): boolean;


    // Returns `true` if Cycle Ready bit is set (conversion is complete).
    available(): Promise<boolean>;
    // Returns 24-bit reading. Assumes CR Cycle Ready bit (ADC conversion complete) has been checked by .available().
    getReading(): Promise<number>;
    // Return the average of a given number of readings.
    getAverage(
        samplesToTake: number,
    ): Promise<number>;


    // Also called taring. Call this with nothing on the scale;
    calculateZeroOffset(
        averageAmount: number,
    ): Promise<void>;
    // Sets the internal variable. Useful for users who are loading values from NVM.
    setZeroOffset(
        newZeroOffset: number,
    ): void;
    // Ask library for this value. Useful for storing value into NVM.
    getZeroOffset(): number;


    // Call this with the value of the thing on the scale. Sets the calibration factor based on the weight on scale and zero offset.
    calculateCalibrationFactor(
        weightOnScale: number,
        averageAmount: number,
    ): Promise<void>;
    // Pass a known calibration factor into library. Helpful if users is loading settings from NVM.
    setCalibrationFactor(
        calFactor: number,
    ): void;
    // Ask library for this value. Useful for storing value into NVM.
    getCalibrationFactor(): number;


    // Once you've set zero offset and cal factor, you can ask the library to do the calculations for you.
    getWeight(
        allowNegativeWeights: boolean,
        samplesToTake: number,
    ): Promise<number>;


    // Set the gain. x1, 2, 4, 8, 16, 32, 64, 128 are available.
    setGain(
        gainValue: number,
    ): Promise<boolean>;
    // Set the onboard Low-Drop-Out voltage regulator to a given value. 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5V are avaialable.
    setLDO(
        ldoValue: number,
    ): Promise<boolean>;
    // Set the readings per second. 10, 20, 40, 80, and 320 samples per second is available.
    setSampleRate(
        rate: number,
    ): Promise<boolean>;
    // Select between 1 and 2.
    setChannel(
        channelNumber: number,
    ): Promise<boolean>;


    // Synchronous calibration of the analog front end of the NAU7802. Returns true if CAL_ERR bit is 0 (no error).
    calibrateAFE(): Promise<boolean>;
    // Begin asynchronous calibration of the analog front end of the NAU7802. Poll for completion with calAFEStatus() or wait with waitForCalibrateAFE().
    beginCalibrateAFE(): Promise<void>;
    // Wait for asynchronous AFE calibration to complete with optional timeout.
    waitForCalibrateAFE(
        timeout_ms: number,
    ): Promise<boolean>;
    // Check calibration status.
    calAFEStatus(): Promise<NAU7802_Cal_Status>;


    // Resets all registers to Power Of Defaults
    reset(): Promise<boolean>;


    // Power up digital and analog sections of scale, ~2mA
    powerUp(): Promise<boolean>;
    // Puts scale into low-power 200nA mode.
    powerDown(): Promise<boolean>;


    // Set Int pin to be high when data is ready (default).
    setIntPolarityHigh(): Promise<boolean>;
    // Set Int pin to be low when data is ready.
    setIntPolarityLow(): Promise<boolean>;


    // Get the revision code of this IC. Always `0x0F`.
    getRevisionCode(): Promise<number>;


    // Mask & set a given bit within a register.
    setBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean>;
    // Mask & clear a given bit within a register.
    clearBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean>;
    // Return a given bit within a register.
    getBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean>;


    // Get contents of a register.
    getRegister(
        registerAddress: number,
    ): Promise<number>;
    // Send a given value to be written to given address. Return true if successful.
    setRegister(
        registerAddress: number,
        value: number,
    ): Promise<boolean>;
}


export interface NAU7802Options {
    debug: boolean;
}
// #endregion module
