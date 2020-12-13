// #region imports
    // #region libraries
    import i2c from 'i2c-bus';
    // #endregion libraries


    // #region external
    import {
        NAU7802 as INAU7802,
    } from '#data/interfaces';

    import {
        NAU7802_Cal_Status,
        NAU7802_LDO_Values,
        NAU7802_Gain_Values,
        NAU7802_SPS_Values,
        Scale_Registers,
        PGA_PWR_Bits,
        PU_CTRL_Bits,
        CTRL1_Bits,
    } from '#data/enumerations';
    // #endregion external
// #endregion imports



// #region module
class NAU7802 implements INAU7802 {
    private address: number;
    private instance: i2c.PromisifiedBus | null = null;
    private zeroOffset = 0;
    private calibrationFactor = 0;


    constructor(
        address: number,
    ) {
        this.address = address;
    }


    // Sets up the NAU7802 for basic function.
    // If initialize is true (or not specified), default init and calibration is performed.
    // If initialize is false, then it's up to the caller to initalize and calibrate.
    // Returns true upon completion.
    public async begin(
        wire: any,
        initialize: boolean,
    ): Promise<boolean> {
        this.instance = await i2c.openPromisified(
            wire,
        );

        // Check if the device ack's over I2C
        if (!this.isConnected()) {
            // There are rare times when the sensor is occupied and doesn't ack. A 2nd try resolves this.
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 500);
            });

            if (!this.isConnected()) {
                return false;
            }
        }

        // Accumulate a result as we do the setup
        let result = true;

        if (initialize) {
            // Reset all registers.
            result = this.reset();

            // Power on analog and digital sections of the scale.
            result = this.powerUp();

            // Set LDO to 3.3V.
            result = this.setLDO(NAU7802_LDO_Values.NAU7802_LDO_3V3);

            // Set gain to 128.
            result = this.setGain(NAU7802_Gain_Values.NAU7802_GAIN_128);

            // Set samples per second to 10.
            result = this.setSampleRate(NAU7802_SPS_Values.NAU7802_SPS_80);

            // Turn off CLK_CHP. From 9.1 power on sequencing.
            result = await this.setRegister(Scale_Registers.NAU7802_ADC, 0x30);

            // Enable 330pF decoupling cap on chan 2. From 9.14 application circuit note.
            result = await this.setBit(
                PGA_PWR_Bits.NAU7802_PGA_PWR_PGA_CAP_EN,
                Scale_Registers.NAU7802_PGA_PWR,
            );

            // Re-cal analog front end when we change gain, sample rate, or channel
            result = this.calibrateAFE();
        }

        return result;
    }

    // Returns true if device is present.
    // Tests for device ack to I2C address.
    public isConnected(): boolean {
        if (this.instance) {
            return true;
        }

        return false;
    }


    // Returns true if Cycle Ready bit is set (conversion is complete).
    public async available(): Promise<boolean> {
        return await this.getBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_CR,
            Scale_Registers.NAU7802_PU_CTRL,
        );
    }

    // Returns 24-bit reading.
    // Assumes CR Cycle Ready bit (ADC conversion complete) has been checked to be 1.
    public getReading(): number {
        if (!this.instance) {
            return 0;
        }

        // this.instance.writeByte(Scale_Registers.NAU7802_ADCO_B2)
        return 0;
    }

    // Return the average of a given number of readings.
    // Gives up after 1000ms so don't call this function to average 8 samples setup at 1Hz output (requires 8s).
    public getAverage(
        samplesToTake: number,
    ): number {
        let total = 0;
        let samplesAcquired = 0;

        const startTime = Date.now();

        while (true) {
            if (this.available()) {
                total += this.getReading();
                samplesAcquired += 1;

                if (samplesAcquired === samplesToTake) {
                    // All done.
                    break;
                }
            }

            const now = Date.now();

            // Timeout - Bail with error
            if (now - startTime > 1000) {
                return 0;
            }
        }

        total /= samplesToTake;

        return total;
    }


    // Call when scale is setup, level, at running temperature, with nothing on it.
    calculateZeroOffset(
        averageAmount: number,
    ): void {
        this.setZeroOffset(
            this.getAverage(averageAmount),
        );
    }

    // Sets the internal variable. Useful for users who are loading values from NVM.
    setZeroOffset(
        newZeroOffset: number,
    ): void {
        this.zeroOffset = newZeroOffset;
    }

    getZeroOffset(): number {
        return this.zeroOffset;
    }


    // Call after zeroing. Provide the float weight sitting on scale. Units do not matter.
    calculateCalibrationFactor(
        weightOnScale: number,
        averageAmount: number,
    ): void {
        const onScale = this.getAverage(averageAmount);
        const newCalFactor = (onScale - this.zeroOffset) / weightOnScale;
        this.setCalibrationFactor(newCalFactor);
    }

    // Pass a known calibration factor into library. Helpful if users is loading settings from NVM.
    // If you don't know your cal factor, call setZeroOffset(), then calculateCalibrationFactor() with a known weight.
    setCalibrationFactor(
        calFactor: number,
    ): void {
        this.calibrationFactor = calFactor;
    }

    getCalibrationFactor(): number {
        return this.calibrationFactor;
    }


    // Returns the y of y = mx + b using the current weight on scale, the cal factor, and the offset.
    getWeight(
        allowNegativeWeights: boolean,
        samplesToTake: number,
    ): number {
        let onScale = this.getAverage(samplesToTake);

        // Prevent the current reading from being less than zero offset.
        // This happens when the scale is zero'd, unloaded, and the load cell reports a value slightly less than zero value
        // causing the weight to be negative or jump to millions of pounds.
        if (allowNegativeWeights === false) {
            if (onScale < this.zeroOffset) {
                // Force reading to zero
                onScale = this.zeroOffset;
            }
        }

        const weight = (onScale - this.zeroOffset) / this.calibrationFactor;

        return weight;
    }


    setGain(
        gainValue: number,
    ): boolean {
        throw new Error('Method not implemented.');
    }
    setLDO(
        ldoValue: number,
    ): boolean {
        throw new Error('Method not implemented.');
    }
    setSampleRate(
        rate: number,
    ): boolean {
        throw new Error('Method not implemented.');
    }
    setChannel(
        channelNumber: number,
    ): boolean {
        throw new Error('Method not implemented.');
    }


    calibrateAFE(): boolean {
        throw new Error('Method not implemented.');
    }
    beginCalibrateAFE(): void {
        throw new Error('Method not implemented.');
    }
    waitForCalibrateAFE(
        timeout_ms: number,
    ): boolean {
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


    // Set Int pin to be high when data is ready (default).
    public async setIntPolarityHigh(): Promise<boolean> {
        // 0 = CRDY pin is high active (ready when 1)
        return this.clearBit(
            CTRL1_Bits.NAU7802_CTRL1_CRP,
            Scale_Registers.NAU7802_CTRL1,
        );
    }

    // Set Int pin to be low when data is ready.
    public async setIntPolarityLow(): Promise<boolean> {
        // 1 = CRDY pin is low active (ready when 0)
        return this.setBit(
            CTRL1_Bits.NAU7802_CTRL1_CRP,
            Scale_Registers.NAU7802_CTRL1,
        );
    }


    getRevisionCode(): number {
        throw new Error('Method not implemented.');
    }


    // Mask & set a given bit within a register.
    public async setBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean> {
        let value = await this.getRegister(registerAddress) || (1 << bitNumber);

        return this.setRegister(
            registerAddress,
            value,
        );
    }

    // Mask & clear a given bit within a register.
    public async clearBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean> {
        let value = await this.getRegister(registerAddress) && ~(1 << bitNumber);

        return this.setRegister(
            registerAddress,
            value,
        );
    }

    // Return a given bit within a register.
    public async getBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean> {
        let value = await this.getRegister(registerAddress) && (1 << bitNumber);

        return !!value;
    }


    // Get contents of a register.
    async getRegister(
        registerAddress: number,
    ): Promise<number> {
        if (!this.instance) {
            return 0;
        }

        const value = await this.instance.readWord(
            this.address,
            registerAddress,
        );

        return value;
    }


    public async setRegister(
        registerAddress: number,
        value: number,
    ): Promise<boolean> {
        if (!this.instance) {
            return false;
        }

        await this.instance.writeWord(
            this.address,
            registerAddress,
            value,
        );

        return true;
    }
}
// #endregion module



// #region exports
export default NAU7802;
// #endregion exports
