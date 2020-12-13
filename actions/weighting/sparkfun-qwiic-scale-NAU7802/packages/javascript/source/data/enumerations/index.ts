// #region module
/**
 * Register Map.
 */
export enum Scale_Registers {
    NAU7802_PU_CTRL = 0x00,
    NAU7802_CTRL1,
    NAU7802_CTRL2,
    NAU7802_OCAL1_B2,
    NAU7802_OCAL1_B1,
    NAU7802_OCAL1_B0,
    NAU7802_GCAL1_B3,
    NAU7802_GCAL1_B2,
    NAU7802_GCAL1_B1,
    NAU7802_GCAL1_B0,
    NAU7802_OCAL2_B2,
    NAU7802_OCAL2_B1,
    NAU7802_OCAL2_B0,
    NAU7802_GCAL2_B3,
    NAU7802_GCAL2_B2,
    NAU7802_GCAL2_B1,
    NAU7802_GCAL2_B0,
    NAU7802_I2C_CONTROL,
    NAU7802_ADCO_B2,
    NAU7802_ADCO_B1,
    NAU7802_ADCO_B0,
    NAU7802_ADC = 0x15, //Shared ADC and OTP 32:24
    NAU7802_OTP_B1,     //OTP 23:16 or 7:0?
    NAU7802_OTP_B0,     //OTP 15:8
    NAU7802_PGA = 0x1B,
    NAU7802_PGA_PWR = 0x1C,
    NAU7802_DEVICE_REV = 0x1F,
}


/**
 * Bits within the PU_CTRL register.
 */
export enum PU_CTRL_Bits {
    NAU7802_PU_CTRL_RR = 0,
    NAU7802_PU_CTRL_PUD,
    NAU7802_PU_CTRL_PUA,
    NAU7802_PU_CTRL_PUR,
    NAU7802_PU_CTRL_CS,
    NAU7802_PU_CTRL_CR,
    NAU7802_PU_CTRL_OSCS,
    NAU7802_PU_CTRL_AVDDS,
}


/**
 * Bits within the CTRL1 register.
 */
export enum CTRL1_Bits {
    NAU7802_CTRL1_GAIN = 2,
    NAU7802_CTRL1_VLDO = 5,
    NAU7802_CTRL1_DRDY_SEL = 6,
    NAU7802_CTRL1_CRP = 7,
}


/**
 * Bits within the CTRL2 register.
 */
export enum CTRL2_Bits {
    NAU7802_CTRL2_CALMOD = 0,
    NAU7802_CTRL2_CALS = 2,
    NAU7802_CTRL2_CAL_ERROR = 3,
    NAU7802_CTRL2_CRS = 4,
    NAU7802_CTRL2_CHS = 7,
}


/**
 * Bits within the PGA register.
 */
export enum PGA_Bits {
    NAU7802_PGA_CHP_DIS = 0,
    NAU7802_PGA_INV = 3,
    NAU7802_PGA_BYPASS_EN,
    NAU7802_PGA_OUT_EN,
    NAU7802_PGA_LDOMODE,
    NAU7802_PGA_RD_OTP_SEL,
}


/**
 * Bits within the PGA PWR register.
 */
export enum PGA_PWR_Bits {
    NAU7802_PGA_PWR_PGA_CURR = 0,
    NAU7802_PGA_PWR_ADC_CURR = 2,
    NAU7802_PGA_PWR_MSTR_BIAS_CURR = 4,
    NAU7802_PGA_PWR_PGA_CAP_EN = 7,
}


/**
 * Allowed Low drop out regulator voltages.
 */
export enum NAU7802_LDO_Values {
    NAU7802_LDO_2V4 = 0b111,
    NAU7802_LDO_2V7 = 0b110,
    NAU7802_LDO_3V0 = 0b101,
    NAU7802_LDO_3V3 = 0b100,
    NAU7802_LDO_3V6 = 0b011,
    NAU7802_LDO_3V9 = 0b010,
    NAU7802_LDO_4V2 = 0b001,
    NAU7802_LDO_4V5 = 0b000,
}


/**
 * Allowed gains.
 */
export enum NAU7802_Gain_Values {
    NAU7802_GAIN_128 = 0b111,
    NAU7802_GAIN_64 = 0b110,
    NAU7802_GAIN_32 = 0b101,
    NAU7802_GAIN_16 = 0b100,
    NAU7802_GAIN_8 = 0b011,
    NAU7802_GAIN_4 = 0b010,
    NAU7802_GAIN_2 = 0b001,
    NAU7802_GAIN_1 = 0b000,
}


/**
 * Allowed samples per second.
 */
export enum NAU7802_SPS_Values {
    NAU7802_SPS_320 = 0b111,
    NAU7802_SPS_80 = 0b011,
    NAU7802_SPS_40 = 0b010,
    NAU7802_SPS_20 = 0b001,
    NAU7802_SPS_10 = 0b000,
}


/**
 * Select between channel values.
 */
export enum NAU7802_Channels {
    NAU7802_CHANNEL_1 = 0,
    NAU7802_CHANNEL_2 = 1,
}


/**
 * Calibration state.
 */
export enum NAU7802_Cal_Status {
    NAU7802_CAL_SUCCESS = 0,
    NAU7802_CAL_IN_PROGRESS = 1,
    NAU7802_CAL_FAILURE = 2,
}
// #endregion module
