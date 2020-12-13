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
        wire: any, // TwoWire &wirePort = Wire,
        reset: boolean,
    ): boolean;
    // Returns `true` if device ACKs at the I2C address.
    isConnected(): boolean;
    // Returns `true` if Cycle Ready bit is set (conversion is complete).
    available(): boolean;


    // Returns 24-bit reading. Assumes CR Cycle Ready bit (ADC conversion complete) has been checked by .available().
    getReading(): number;
    // Return the average of a given number of readings.
    getAverage(
        samplesToTake: number,
    ): number;


    // Also called taring. Call this with nothing on the scale;
    calculateZeroOffset(
        averageAmount: number,
    ): void;
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
    ): void;
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
    ): number;


    // Set the gain. x1, 2, 4, 8, 16, 32, 64, 128 are available.
    setGain(
        gainValue: number,
    ): boolean;
    // Set the onboard Low-Drop-Out voltage regulator to a given value. 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5V are avaialable.
    setLDO(
        ldoValue: number,
    ): boolean;
    // Set the readings per second. 10, 20, 40, 80, and 320 samples per second is available.
    setSampleRate(
        rate: number,
    ): boolean;
    // Select between 1 and 2.
    setChannel(
        channelNumber: number,
    ): boolean;


    // Synchronous calibration of the analog front end of the NAU7802. Returns true if CAL_ERR bit is 0 (no error).
    calibrateAFE(): boolean;
    // Begin asynchronous calibration of the analog front end of the NAU7802. Poll for completion with calAFEStatus() or wait with waitForCalibrateAFE().
    beginCalibrateAFE(): void;
    // Wait for asynchronous AFE calibration to complete with optional timeout.
    waitForCalibrateAFE(
        timeout_ms: number,
    ): boolean;
    // Check calibration status.
    calAFEStatus(): NAU7802_Cal_Status;


    // Resets all registers to Power Of Defaults
    reset(): boolean;


    // Power up digital and analog sections of scale, ~2mA
    powerUp(): boolean;
    // Puts scale into low-power 200nA mode.
    powerDown(): boolean;


    // Set Int pin to be high when data is ready (default).
    setIntPolarityHigh(): boolean;
    // Set Int pin to be low when data is ready.
    setIntPolarityLow(): boolean;


    // Get the revision code of this IC. Always `0x0F`.
    getRevisionCode(): number;


    // Mask & set a given bit within a register.
    setBit(
        bitNumber: number,
        registerAddress: number,
    ): boolean;
    // Mask & clear a given bit within a register.
    clearBit(
        bitNumber: number,
        registerAddress: number,
    ): boolean;
    // Return a given bit within a register.
    getBit(
        bitNumber: number,
        registerAddress: number,
    ): boolean;


    // Get contents of a register.
    getRegister(
        registerAddress: number,
    ): number;
    // Send a given value to be written to given address. Return true if successful.
    setRegister(
        registerAddress: number,
        value: number,
    ): boolean;
}
// #endregion module
