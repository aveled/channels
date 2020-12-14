// #region imports
    // #region libraries
    import i2c from 'i2c-bus';
    // #endregion libraries


    // #region external
    import {
        NAU7802 as INAU7802,
        NAU7802Options,
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
        CTRL2_Bits,
        NAU7802_Channels,
    } from '#data/enumerations';

    import {
        delay,
    } from '../../utilities';
    // #endregion external
// #endregion imports



// #region module
class NAU7802 implements INAU7802 {
    private address: number;
    private instance: i2c.PromisifiedBus | null = null;
    private zeroOffset = 0;
    private calibrationFactor = 0;
    private options: NAU7802Options;


    constructor(
        address: number,
        options?: NAU7802Options,
    ) {
        this.address = address;

        this.options = {
            debug: options?.debug ?? false,
        };
    }


    // Sets up the NAU7802 for basic function.
    // If initialize is true (or not specified), default init and calibration is performed.
    // If initialize is false, then it's up to the caller to initalize and calibrate.
    // Returns true upon completion.
    public async begin(
        bus: number,
        initialize: boolean = true,
    ): Promise<boolean> {
        if (this.options.debug) {
            console.log('NAU7802.begin');
        }

        this.instance = await i2c.openPromisified(
            bus,
        );

        // Check if the device ack's over I2C
        if (!this.isConnected()) {
            // There are rare times when the sensor is occupied and doesn't ACK. A 2nd try resolves this.
            await delay(500);

            if (!this.isConnected()) {
                return false;
            }
        }

        // Accumulate a result as we do the setup
        let result = true;

        if (initialize) {
            // Reset all registers.
            result = await this.reset();
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: reset.');
            } else {
                console.log('NAU7802.begin :: Could not reset.');
            }

            // Power on analog and digital sections of the scale.
            result = await this.powerUp();
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: powerUp.');
            } else {
                console.log('NAU7802.begin :: Could not powerUp.');
            }

            // Set LDO to 3.3V.
            result = await this.setLDO(NAU7802_LDO_Values.NAU7802_LDO_3V3);
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: setLDO.');
            } else {
                console.log('NAU7802.begin :: Could not setLDO.');
            }

            // Set gain to 128.
            result = await this.setGain(NAU7802_Gain_Values.NAU7802_GAIN_128);
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: setGain.');
            } else {
                console.log('NAU7802.begin :: Could not setGain.');
            }

            // Set samples per second to 10.
            result = await this.setSampleRate(NAU7802_SPS_Values.NAU7802_SPS_80);
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: setSampleRate.');
            } else {
                console.log('NAU7802.begin :: Could not setSampleRate.');
            }

            // Turn off CLK_CHP. From 9.1 power on sequencing.
            result = await this.setRegister(Scale_Registers.NAU7802_ADC, 0x30);
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: setRegister.');
            } else {
                console.log('NAU7802.begin :: Could not setRegister.');
            }

            // Enable 330pF decoupling cap on chan 2. From 9.14 application circuit note.
            result = await this.setBit(
                PGA_PWR_Bits.NAU7802_PGA_PWR_PGA_CAP_EN,
                Scale_Registers.NAU7802_PGA_PWR,
            );
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: setBit.');
            } else {
                console.log('NAU7802.begin :: Could not setBit.');
            }

            // Re-cal analog front end when we change gain, sample rate, or channel
            result = await this.calibrateAFE();
            if (result && this.options.debug) {
                console.log('NAU7802.begin :: calibrateAFE.');
            } else {
                console.log('NAU7802.begin :: Could not calibrateAFE.');
            }
        }

        return result;
    }

    // Returns true if device is present.
    // Tests for device ack to I2C address.
    public isConnected(): boolean {
        if (this.instance) {
            if (this.options.debug) {
                console.log('NAU7802.isConnected :: connected.');
            }

            return true;
        }

        if (this.options.debug) {
            console.log('NAU7802.isConnected :: not connected.');
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
    public async getReading(): Promise<number> {
        if (!this.instance) {
            if (this.options.debug) {
                console.log('NAU7802.getReading :: no instance.');
            }

            return 0;
        }

        try {
            const addressBuffer = Buffer.from([Scale_Registers.NAU7802_ADCO_B2]);
            await this.instance.i2cWrite(
                this.address,
                addressBuffer.length,
                addressBuffer,
            );

            const readBuffer = Buffer.alloc(3);
            const bytes = await this.instance.i2cRead(
                this.address,
                3,
                readBuffer,
            );

            if (this.options.debug) {
                console.log('NAU7802.getReading :: bytes', bytes);
                console.log('NAU7802.getReading :: bytes.buffer', bytes.buffer);
            }

            let raw = bytes.buffer.readUIntBE(0, 3);
            if (this.options.debug) {
                console.log('NAU7802.getReading :: raw', raw);
            }
            //       MSB    -   MidSB   -  LSB
            raw = raw << 16 || raw << 8 || raw;
            if (this.options.debug) {
                console.log('NAU7802.getReading :: raw transformed', raw);
            }

            // The raw value coming from the ADC is a 24-bit number, so the sign bit now
            // resides on bit 23 (0 is LSB) of the uint32_t container. By shifting the
            // value to the left, I move the sign bit to the MSB of the uint32_t container.
            // By casting to a signed int32_t container I now have properly recovered
            // the sign of the original value.
            const valueShifted = raw << 8;
            if (this.options.debug) {
                console.log('NAU7802.getReading :: raw shifted', valueShifted);
            }

            // Shift the number back right to recover its intended magnitude.
            const value = valueShifted >> 8;
            if (this.options.debug) {
                console.log('NAU7802.getReading :: value', value);
            }

            return value;
        } catch (error) {
            if (this.options.debug) {
                console.log('NAU7802.getReading :: error', error);
            }

            return 0;
        }
    }

    // Return the average of a given number of readings.
    // Gives up after 1000ms so don't call this function to average 8 samples setup at 1Hz output (requires 8s).
    public async getAverage(
        samplesToTake: number,
    ): Promise<number> {
        let total = 0;
        let samplesAcquired = 0;

        const startTime = Date.now();

        while (true) {
            if (this.available()) {
                total += await this.getReading();
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
        if (this.options.debug) {
            console.log('NAU7802.getAverage :: total', total);
        }

        return total;
    }


    // Call when scale is setup, level, at running temperature, with nothing on it.
    public async calculateZeroOffset(
        averageAmount: number = 8,
    ): Promise<void> {
        const average = await this.getAverage(averageAmount);

        this.setZeroOffset(
            average,
        );
    }

    // Sets the internal variable. Useful for users who are loading values from NVM.
    public setZeroOffset(
        newZeroOffset: number,
    ): void {
        this.zeroOffset = newZeroOffset;
    }

    public getZeroOffset(): number {
        return this.zeroOffset;
    }


    // Call after zeroing. Provide the float weight sitting on scale. Units do not matter.
    public async calculateCalibrationFactor(
        weightOnScale: number,
        averageAmount: number = 8,
    ): Promise<void> {
        const onScale = await this.getAverage(averageAmount);
        const newCalFactor = (onScale - this.zeroOffset) / weightOnScale;

        this.setCalibrationFactor(newCalFactor);
    }

    // Pass a known calibration factor into library. Helpful if users is loading settings from NVM.
    // If you don't know your cal factor, call setZeroOffset(), then calculateCalibrationFactor() with a known weight.
    public setCalibrationFactor(
        calFactor: number,
    ): void {
        this.calibrationFactor = calFactor;
    }

    getCalibrationFactor(): number {
        return this.calibrationFactor;
    }


    // Returns the y of y = mx + b using the current weight on scale, the cal factor, and the offset.
    public async getWeight(
        allowNegativeWeights: boolean = false,
        samplesToTake: number = 8,
    ): Promise<number> {
        let onScale = await this.getAverage(samplesToTake);

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


    // Set the gain
    // x1, 2, 4, 8, 16, 32, 64, 128 are avaialable.
    public async setGain(
        gainValue: number,
    ): Promise<boolean> {
        if (gainValue > 0b111) {
            // Error check.
            gainValue = 0b111;
        }

        let value = await this.getRegister(Scale_Registers.NAU7802_CTRL1);
        value &= 0b11111000; // Clear gain bits
        value |= gainValue;  // Mask in new bits

        return this.setRegister(
            Scale_Registers.NAU7802_CTRL1,
            value,
        );
    }

    // Set the onboard Low-Drop-Out voltage regulator to a given value.
    // 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5V are available.
    public async setLDO(
        ldoValue: number,
    ): Promise<boolean> {
        if (ldoValue > 0b111) {
            // Error check.
            ldoValue = 0b111;
        }

        // Set the value of the LDO.
        let value = await this.getRegister(Scale_Registers.NAU7802_CTRL1);
        value &= 0b11000111;    // Clear LDO bits
        value |= ldoValue << 3; // Mask in new LDO bits

        this.setRegister(
            Scale_Registers.NAU7802_CTRL1,
            value,
        );

        // Enable the internal LDO.
        return this.setBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_AVDDS,
            Scale_Registers.NAU7802_PU_CTRL,
        );
    }

    // Set the readings per second.
    // 10, 20, 40, 80, and 320 samples per second is available.
    public async setSampleRate(
        rate: number,
    ): Promise<boolean> {
        if (rate > 0b111) {
            rate = 0b111; //Error check
        }

        let value = await this.getRegister(Scale_Registers.NAU7802_CTRL2);
        value &= 0b10001111; // Clear CRS bits
        value |= rate << 4;  // Mask in new CRS bits

        if (this.options.debug) {
            console.log('NAU7802.setSampleRate :: value', value);
        }

        return this.setRegister(
            Scale_Registers.NAU7802_CTRL2,
            value,
        );
    }

    // Select between 1 and 2
    public async setChannel(
        channelNumber: number,
    ): Promise<boolean> {
        if (channelNumber == NAU7802_Channels.NAU7802_CHANNEL_1) {
            // Channel 1 (default)
            return this.clearBit(
                CTRL2_Bits.NAU7802_CTRL2_CHS,
                Scale_Registers.NAU7802_CTRL2,
            );
        }

        // Channel 2
        return this.setBit(
            CTRL2_Bits.NAU7802_CTRL2_CHS,
            Scale_Registers.NAU7802_CTRL2,
        );
    }


    // Calibrate analog front end of system. Returns true if CAL_ERR bit is 0 (no error)
    // Takes approximately 344ms to calibrate; wait up to 1000ms.
    // It is recommended that the AFE be re-calibrated any time the gain, SPS, or channel number is changed.
    public async calibrateAFE(): Promise<boolean> {
        await this.beginCalibrateAFE();
        return this.waitForCalibrateAFE(1000);
    }

    // Begin asynchronous calibration of the analog front end.
    // Poll for completion with calAFEStatus() or wait with waitForCalibrateAFE().
    public async beginCalibrateAFE(): Promise<void> {
        await this.setBit(
            CTRL2_Bits.NAU7802_CTRL2_CALS,
            Scale_Registers.NAU7802_CTRL2,
        );
    }

    // Wait for asynchronous AFE calibration to complete with optional timeout.
    // If timeout is not specified (or set to 0), then wait indefinitely.
    // Returns true if calibration completes succsfully, otherwise returns false.
    public async waitForCalibrateAFE(
        timeout_ms: number = 0,
    ): Promise<boolean> {
        const begin = Date.now();

        let calReady = await this.calAFEStatus();

        while (
            calReady == NAU7802_Cal_Status.NAU7802_CAL_IN_PROGRESS
        ) {
            if (
                (timeout_ms > 0) && ((Date.now() - begin) > timeout_ms)
            ) {
                break;
            }

            await delay(1);

            calReady = await this.calAFEStatus();
        }

        return calReady === NAU7802_Cal_Status.NAU7802_CAL_SUCCESS;
    }

    // Check calibration status.
    public async calAFEStatus(): Promise<NAU7802_Cal_Status> {
        const inProgress = await this.getBit(
            CTRL2_Bits.NAU7802_CTRL2_CALS,
            Scale_Registers.NAU7802_CTRL2,
        );

        if (inProgress) {
            return NAU7802_Cal_Status.NAU7802_CAL_IN_PROGRESS;
        }

        const failure = await this.getBit(
            CTRL2_Bits.NAU7802_CTRL2_CAL_ERROR,
            Scale_Registers.NAU7802_CTRL2,
        );

        if (failure) {
            return NAU7802_Cal_Status.NAU7802_CAL_FAILURE;
        }

        // Calibration passed
        return NAU7802_Cal_Status.NAU7802_CAL_SUCCESS;
    }


    public async reset(): Promise<boolean> {
        // Set RR.
        if (this.options.debug) {
            console.log('NAU7802.reset :: setting PU_CTRL_Bits.NAU7802_PU_CTRL_RR.');
        }
        await this.setBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_RR,
            Scale_Registers.NAU7802_PU_CTRL,
        );

        delay(1);

        // Clear RR to leave reset state.
        if (this.options.debug) {
            console.log('NAU7802.reset :: clearing PU_CTRL_Bits.NAU7802_PU_CTRL_RR.');
        }
        return this.clearBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_RR,
            Scale_Registers.NAU7802_PU_CTRL,
        );
    }


    // Power up digital and analog sections of scale.
    public async powerUp(): Promise<boolean> {
        if (this.options.debug) {
            console.log('NAU7802.powerUp :: setting PU_CTRL_Bits.NAU7802_PU_CTRL_PUD.');
        }
        await this.setBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_PUD,
            Scale_Registers.NAU7802_PU_CTRL,
        );

        if (this.options.debug) {
            console.log('NAU7802.powerUp :: setting PU_CTRL_Bits.NAU7802_PU_CTRL_PUA.');
        }
        await this.setBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_PUA,
            Scale_Registers.NAU7802_PU_CTRL,
        );

        // Wait for Power Up bit to be set - takes approximately 200us
        let counter = 0;
        while (true) {
            const bit = await this.getBit(
                PU_CTRL_Bits.NAU7802_PU_CTRL_PUR,
                Scale_Registers.NAU7802_PU_CTRL,
            );
            if (this.options.debug) {
                console.log('NAU7802.powerUp :: bit PU_CTRL_Bits.NAU7802_PU_CTRL_PUR', bit);
            }

            if (bit === true) {
                // Good to go
                break;
            }

            await delay(1);

            counter += 1;

            if (counter > 100) {
                // Error.
                return false;
            }
        }

        return true;
    }

    // Puts scale into low-power mode.
    public async powerDown(): Promise<boolean> {
        await this.clearBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_PUD,
            Scale_Registers.NAU7802_PU_CTRL,
        );
        return this.clearBit(
            PU_CTRL_Bits.NAU7802_PU_CTRL_PUA,
            Scale_Registers.NAU7802_PU_CTRL,
        );
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


    public async getRevisionCode(): Promise<number> {
        const revisionCode = await this.getRegister(Scale_Registers.NAU7802_DEVICE_REV);
        return revisionCode & 0x0F;
    }


    // Mask & set a given bit within a register.
    public async setBit(
        bitNumber: number,
        registerAddress: number,
    ): Promise<boolean> {
        let value = await this.getRegister(registerAddress);
        // Set this bit.
        value |= (1 << bitNumber);

        if (this.options.debug) {
            console.log('NAU7802.setBit :: value', value);
        }

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
        let value = await this.getRegister(registerAddress);
        value &= ~(1 << bitNumber);

        if (this.options.debug) {
            console.log('NAU7802.clearBit :: value', value);
        }

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
        let value = await this.getRegister(registerAddress);
        // Clear all but this bit.
        value &= (1 << bitNumber);

        if (this.options.debug) {
            console.log('NAU7802.getBit :: value', value);
        }

        return !!value;
    }


    // Get contents of a register.
    async getRegister(
        registerAddress: number,
    ): Promise<number> {
        if (!this.instance) {
            if (this.options.debug) {
                console.log('NAU7802.getRegister :: no instance');
            }

            return 0;
        }

        const addressBuffer = Buffer.from([registerAddress]);
        await this.instance.i2cWrite(
            this.address,
            addressBuffer.length,
            addressBuffer,
        );

        const readBuffer = Buffer.alloc(1);
        const bytes = await this.instance.i2cRead(
            this.address,
            1,
            readBuffer,
        );

        if (this.options.debug) {
            // console.log('NAU7802.getRegister :: value', value);
            console.log('NAU7802.getRegister :: readBuffer', readBuffer);
            console.log('NAU7802.getRegister :: bytes', bytes);
            console.log('NAU7802.getRegister :: bytes.buffer', bytes.buffer);
            console.log('NAU7802.getRegister :: value', bytes.buffer.readUIntBE(0, 1));
        }

        return bytes.buffer.readUIntBE(0, 1);
        // return value;
    }


    public async setRegister(
        registerAddress: number,
        value: number,
    ): Promise<boolean> {
        if (!this.instance) {
            return false;
        }

        if (this.options.debug) {
            console.log('NAU7802.setRegister :: value', value);
        }

        const addressBuffer = Buffer.from([registerAddress]);
        await this.instance.i2cWrite(
            this.address,
            addressBuffer.length,
            addressBuffer,
        );

        const valueBuffer = Buffer.from([value]);
        await this.instance.i2cWrite(
            this.address,
            valueBuffer.length,
            valueBuffer,
        );

        return true;
    }
}
// #endregion module



// #region exports
export default NAU7802;
// #endregion exports
