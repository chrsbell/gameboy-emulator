import Memory from '../../Memory';
import { Byte, Word } from '../../Types';
import CPU from '../';

/**
 * To double-check:
 * RLCA
 * RRCA
 * RLA
 * RRA
 *
 * Implement:
 * Template functions for recurring opcodes
 * STOP
 */

/**
 * Converts the value to its signed format using two's complement
 */
const toSigned = (value: number) => {
  if (value >= 128) {
    return -((~value + 1) & 255);
  }
  return value;
};

// const LDii = (r1: Word, r1Upper: boolean, writeVal: Byte) => {
//   let writeVal: Byte;
//   if (r2Upper) {
//     writeVal = r2.upper();
//   }
//   if (r1Upper) {
//     r1.setUpper(writeVal);
//   }
// }
// const LDmi = () =>

export default {
  map: {
    0x00: function (this: CPU) {},
    0x01: function (this: CPU) {
      this.R.BC.set(Memory.readWord(this.PC.value()));
    },
    0x02: function (this: CPU) {
      Memory.writeByte(this.R.BC.value(), this.R.AF.upper());
    },
    0x03: function (this: CPU) {
      this.R.BC.add(1);
    },
    0x04: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.BC.upper(), operand);
      // perform addition
      operand.add(this.R.BC.upper().value());
      this.R.BC.setUpper(operand);

      this.checkZFlag(this.R.BC.upper());
      this.R.F.N.flag(0);
    },
    0x05: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      this.checkHalfCarry(this.R.BC.upper(), operand);
      operand.add(this.R.BC.upper().value());
      this.R.BC.setUpper(operand);

      this.checkZFlag(this.R.BC.upper());
      this.R.F.N.flag(1);
    },
    0x06: function (this: CPU) {
      // load into B from PC (immediate)
      this.R.BC.setUpper(new Byte(Memory.readByte(this.PC.value())));
    },
    0x07: function (this: CPU) {
      // check carry flag
      this.R.F.CY.flag(this.R.AF.upper().value() >> 7);
      // left shift
      const shifted = this.R.AF.upper().value() << 1;
      this.R.AF.setUpper(new Byte(shifted | (shifted >> 8)));
      // flag resets
      this.R.F.N.flag(0);
      this.R.F.H.flag(0);
      this.R.F.Z.flag(0);
    },
    0x08: function (this: CPU) {
      Memory.writeWord(Memory.readWord(this.PC.value()), this.SP);
    },
    0x09: function (this: CPU) {
      this.checkFullCarry(this.R.HL, this.R.BC);
      this.checkHalfCarry(this.R.HL.upper(), this.R.BC.upper());
      this.R.HL.add(this.R.BC.value());
      this.R.F.N.flag(0);
    },
    0x0a: function (this: CPU) {
      this.R.AF.setUpper(new Byte(Memory.readByte(this.R.BC.value())));
    },
    0x0b: function (this: CPU) {
      this.R.BC.add(-1);
    },
    0x0c: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.BC.lower(), operand);
      // perform addition
      operand.add(this.R.BC.lower().value());
      this.R.BC.setLower(operand);

      this.checkZFlag(this.R.BC.lower());
      this.R.F.N.flag(0);
    },
    0x0d: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.BC.lower(), operand);
      // perform addition
      operand.add(this.R.BC.lower().value());
      this.R.BC.setLower(operand);

      this.checkZFlag(this.R.BC.lower());
      this.R.F.N.flag(1);
    },
    0x0e: function (this: CPU) {
      // load into C from PC (immediate)
      this.R.BC.setLower(new Byte(Memory.readByte(this.PC.value())));
    },
    0x0f: function (this: CPU) {
      // check carry flag
      const bitZero = this.R.AF.upper().value() & 1;
      this.R.F.CY.flag(bitZero);
      // right shift
      const shifted = this.R.AF.upper().value() >> 1;
      this.R.AF.setUpper(new Byte(shifted | (bitZero << 7)));
      // flag resets
      this.R.F.N.flag(0);
      this.R.F.H.flag(0);
      this.R.F.Z.flag(0);
    },
    0x10: function (this: CPU) {
      console.log('Instruction halted.');
      throw new Error();
    },
    0x11: function (this: CPU) {
      this.R.DE.set(Memory.readWord(this.PC.value()));
    },
    0x12: function (this: CPU) {
      Memory.writeByte(this.R.DE.value(), this.R.AF.upper());
    },
    0x13: function (this: CPU) {
      this.R.DE.add(1);
    },
    0x14: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.DE.upper(), operand);
      // perform addition
      operand.add(this.R.DE.upper().value());
      this.R.DE.setUpper(operand);

      this.checkZFlag(this.R.DE.upper());
      this.R.F.N.flag(0);
    },
    0x15: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.DE.upper(), operand);
      // perform addition
      operand.add(this.R.DE.upper().value());
      this.R.DE.setUpper(operand);

      this.checkZFlag(this.R.DE.upper());
      this.R.F.N.flag(1);
    },
    0x16: function (this: CPU) {
      this.R.DE.setUpper(new Byte(Memory.readByte(this.PC.value())));
    },
    0x17: function (this: CPU) {
      // need to rotate left through the carry flag
      // get the old carry value
      const oldCY = this.R.F.CY.value();
      // set the carry flag to the 7th bit of A
      this.R.F.CY.flag(this.R.AF.upper().value() >> 7);
      // rotate left
      let shifted = this.R.AF.upper().value() << 1;
      // combine old flag and shifted, set to A
      this.R.AF.setUpper(new Byte(shifted | oldCY));
    },
    0x18: function (this: CPU) {
      this.PC.add(toSigned(Memory.readByte(this.PC.value())));
    },
    0x19: function (this: CPU) {
      this.checkFullCarry(this.R.HL, this.R.DE);
      this.checkHalfCarry(this.R.HL.upper(), this.R.DE.upper());
      this.R.HL.add(this.R.DE.value());
      this.R.F.N.flag(0);
    },
    0x1a: function (this: CPU) {
      this.R.AF.setUpper(new Byte(Memory.readByte(this.R.DE.value())));
    },
    0x1b: function (this: CPU) {
      this.R.DE.add(-1);
    },
    0x1c: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.DE.lower(), operand);
      // perform addition
      operand.add(this.R.DE.lower().value());
      this.R.DE.setLower(operand);

      this.checkZFlag(this.R.DE.lower());
      this.R.F.N.flag(0);
    },
    0x1d: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.DE.lower(), operand);
      // perform addition
      operand.add(this.R.DE.lower().value());
      this.R.DE.setLower(operand);

      this.checkZFlag(this.R.DE.lower());
      this.R.F.N.flag(1);
    },
    0x1e: function (this: CPU) {
      this.R.DE.setLower(new Byte(Memory.readByte(this.PC.value())));
    },
    0x1f: function (this: CPU) {
      // rotate right through the carry flag
      // get the old carry value
      const oldCY = this.R.F.CY.value();
      // set the carry flag to the 0th bit of A
      this.R.F.CY.flag(this.R.AF.upper().value() & 1);
      // rotate right
      let shifted = this.R.AF.upper().value() >> 1;
      // combine old flag and shifted, set to A
      this.R.AF.setUpper(new Byte(shifted | (oldCY << 7)));
    },
    0x20: function (this: CPU): boolean {
      const incr = toSigned(Memory.readByte(this.PC.value()));
      // increment PC if zero flag was reset
      if (!this.R.F.Z.value()) {
        this.PC.add(incr);
        return true;
      }
      return false;
    },
    0x21: function (this: CPU) {
      this.R.HL.set(Memory.readWord(this.PC.value()));
    },
    0x22: function (this: CPU) {
      Memory.writeByte(this.R.HL.value(), this.R.AF.upper());
      this.R.HL.add(1);
    },
    0x23: function (this: CPU) {
      this.R.HL.add(1);
    },
    0x24: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.HL.upper(), operand);
      // perform addition
      operand.add(this.R.HL.upper().value());
      this.R.HL.setUpper(operand);

      this.checkZFlag(operand);
      this.R.F.N.flag(0);
    },
    0x25: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      // check for half carry on affected byte only
      this.checkHalfCarry(this.R.HL.upper(), operand);
      // perform addition
      operand.add(this.R.HL.upper().value());
      this.R.HL.setUpper(operand);

      this.checkZFlag(operand);
      this.R.F.N.flag(1);
    },
    0x26: function (this: CPU) {
      this.R.HL.setUpper(new Byte(Memory.readByte(this.PC.value())));
    },
    /**
     * DAA instruction taken from - https://forums.nesdev.com/viewtopic.php?t=15944#p196282
     */
    0x27: function (this: CPU) {
      // note: assumes a is a uint8_t and wraps from 0xff to 0
      if (!this.R.F.N.value()) {
        // after an addition, adjust if (half-)carry occurred or if result is out of bounds
        if (this.R.F.CY.value() || this.R.AF.upper().value() > 0x99) {
          this.R.AF.addUpper(0x60);
          this.R.F.CY.flag(1);
        }
        if (this.R.F.H.value() || (this.R.AF.upper().value() & 0x0f) > 0x09) {
          this.R.AF.addUpper(0x6);
        }
      } else {
        // after a subtraction, only adjust if (half-)carry occurred
        if (this.R.F.CY.value()) {
          this.R.AF.addUpper(-0x60);
        }
        if (this.R.F.H.value()) {
          this.R.AF.addUpper(-0x6);
        }
      }
      // these flags are always updated
      const AZero = this.R.AF.upper().value() === 0 ? 1 : 0;
      this.R.F.Z.flag(AZero); // the usual z flag
      this.R.F.H.flag(0); // h flag is always cleared
    },
    0x28: function (this: CPU) {
      const incr = toSigned(Memory.readByte(this.PC.value()));
      // increment PC if zero flag was set
      if (this.R.F.Z.value()) {
        this.PC.add(incr);
        return true;
      }
      return false;
    },
    0x29: function (this: CPU) {
      this.checkFullCarry(this.R.HL, this.R.HL);
      this.checkHalfCarry(this.R.HL.upper(), this.R.HL.upper());
      this.R.HL.add(this.R.HL.value());
      this.R.F.N.flag(0);
    },
    0x2a: function (this: CPU) {
      this.R.AF.setUpper(new Byte(Memory.readByte(this.R.HL.value())));
      this.R.HL.add(1);
    },
    0x2b: function (this: CPU) {
      this.R.HL.add(-1);
    },
    0x2c: function (this: CPU) {
      const operand = new Byte(1);
      this.checkHalfCarry(this.R.HL.lower(), operand);
      operand.add(this.R.HL.lower().value());
      this.R.HL.setLower(operand);
      this.checkZFlag(operand);
      this.R.F.N.flag(0);
    },
    0x2d: function (this: CPU) {
      const operand = new Byte(-1);
      this.checkHalfCarry(this.R.HL.lower(), operand);
      operand.add(this.R.HL.lower().value());
      this.R.HL.setLower(operand);
      this.checkZFlag(operand);
      this.R.F.N.flag(1);
    },
    0x2e: function (this: CPU) {
      this.R.HL.setLower(new Byte(Memory.readByte(this.PC.value())));
    },
    0x2f: function (this: CPU) {
      this.R.AF.setUpper(new Byte(~this.R.AF.upper()));
      this.R.F.N.flag(1);
      this.R.F.H.flag(1);
    },
    0x30: function (this: CPU) {
      const incr = toSigned(Memory.readByte(this.PC.value()));
      if (!this.R.F.CY.value()) {
        this.PC.add(incr);
        return true;
      }
      return false;
    },
    0x31: function (this: CPU) {
      this.SP.set(Memory.readWord(this.PC.value()));
    },
    0x32: function (this: CPU) {
      Memory.writeByte(this.R.HL.value(), this.R.AF.upper());
      this.R.HL.add(-1);
    },
    0x33: function (this: CPU) {
      this.SP.add(1);
    },
    0x34: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(1);
      const newVal: Byte = new Byte(Memory.readByte(this.R.HL.value()));
      // check for half carry on affected byte only
      this.checkHalfCarry(newVal, operand);
      operand.add(this.R.HL.value());
      Memory.writeByte(this.R.HL.value(), operand);

      this.checkZFlag(operand);
      this.R.F.N.flag(0);
    },
    0x35: function (this: CPU) {
      // convert operand to unsigned
      const operand = new Byte(-1);
      const newVal: Byte = new Byte(Memory.readByte(this.R.HL.value()));
      // check for half carry on affected byte only
      this.checkHalfCarry(newVal, operand);
      operand.add(this.R.HL.value());
      Memory.writeByte(this.R.HL.value(), operand);

      this.checkZFlag(operand);
      this.R.F.N.flag(1);
    },
    0x36: function (this: CPU) {
      Memory.writeByte(this.R.HL.value(), new Byte(Memory.readByte(this.PC.value())));
    },
    0x37: function (this: CPU) {
      this.R.F.CY.flag(1);
      this.R.F.N.flag(0);
      this.R.F.H.flag(0);
    },
    0x38: function (this: CPU) {
      const incr = toSigned(Memory.readByte(this.PC.value()));
      if (this.R.F.CY.value()) {
        this.PC.add(incr);
        return true;
      }
      return false;
    },
    0x39: function (this: CPU) {
      this.checkFullCarry(this.R.HL, this.SP);
      this.checkHalfCarry(this.R.HL.upper(), this.SP.upper());
      this.R.HL.add(this.SP.value());
      this.R.F.N.flag(0);
    },
    0x3a: function (this: CPU) {
      this.R.AF.setUpper(new Byte(Memory.readByte(this.R.HL.value())));
      this.R.HL.add(-1);
    },
    0x3b: function (this: CPU) {
      this.SP.add(-1);
    },
    0x3c: function (this: CPU) {
      const operand = new Byte(1);
      this.checkHalfCarry(this.R.AF.upper(), operand);
      operand.add(this.R.AF.upper().value());
      this.R.AF.setUpper(operand);
      this.checkZFlag(operand);
      this.R.F.N.flag(0);
    },
    0x3d: function (this: CPU) {
      const operand = new Byte(-1);
      this.checkHalfCarry(this.R.AF.upper(), operand);
      operand.add(this.R.AF.upper().value());
      this.R.AF.setUpper(operand);
      this.checkZFlag(operand);
      this.R.F.N.flag(1);
    },
    0x3e: function (this: CPU) {
      this.R.AF.setUpper(new Byte(Memory.readByte(this.PC.value())));
    },
    0x3f: function (this: CPU) {
      const { value } = this.R.F.CY;
      if (value) {
        this.R.F.CY.flag(0);
      } else {
        this.R.F.CY.flag(1);
      }
      this.R.F.N.flag(0);
      this.R.F.H.flag(0);
    },
    64: function (this: CPU) {},
    65: function (this: CPU) {},
    66: function (this: CPU) {},
    67: function (this: CPU) {},
    68: function (this: CPU) {},
    69: function (this: CPU) {},
    70: function (this: CPU) {},
    71: function (this: CPU) {},
    72: function (this: CPU) {},
    73: function (this: CPU) {},
    74: function (this: CPU) {},
    75: function (this: CPU) {},
    76: function (this: CPU) {},
    77: function (this: CPU) {},
    78: function (this: CPU) {},
    79: function (this: CPU) {},
    80: function (this: CPU) {},
    81: function (this: CPU) {},
    82: function (this: CPU) {},
    83: function (this: CPU) {},
    84: function (this: CPU) {},
    85: function (this: CPU) {},
    86: function (this: CPU) {},
    87: function (this: CPU) {},
    88: function (this: CPU) {},
    89: function (this: CPU) {},
    90: function (this: CPU) {},
    91: function (this: CPU) {},
    92: function (this: CPU) {},
    93: function (this: CPU) {},
    94: function (this: CPU) {},
    95: function (this: CPU) {},
    96: function (this: CPU) {},
    97: function (this: CPU) {},
    98: function (this: CPU) {},
    99: function (this: CPU) {},
    100: function (this: CPU) {},
    101: function (this: CPU) {},
    102: function (this: CPU) {},
    103: function (this: CPU) {},
    104: function (this: CPU) {},
    105: function (this: CPU) {},
    106: function (this: CPU) {},
    107: function (this: CPU) {},
    108: function (this: CPU) {},
    109: function (this: CPU) {},
    110: function (this: CPU) {},
    111: function (this: CPU) {},
    112: function (this: CPU) {},
    113: function (this: CPU) {},
    114: function (this: CPU) {},
    115: function (this: CPU) {},
    116: function (this: CPU) {},
    117: function (this: CPU) {},
    118: function (this: CPU) {},
    119: function (this: CPU) {},
    120: function (this: CPU) {},
    121: function (this: CPU) {},
    122: function (this: CPU) {},
    123: function (this: CPU) {},
    124: function (this: CPU) {},
    125: function (this: CPU) {},
    126: function (this: CPU) {},
    127: function (this: CPU) {},
    128: function (this: CPU) {},
    129: function (this: CPU) {},
    130: function (this: CPU) {},
    131: function (this: CPU) {},
    132: function (this: CPU) {},
    133: function (this: CPU) {},
    134: function (this: CPU) {},
    135: function (this: CPU) {},
    136: function (this: CPU) {},
    137: function (this: CPU) {},
    138: function (this: CPU) {},
    139: function (this: CPU) {},
    140: function (this: CPU) {},
    141: function (this: CPU) {},
    142: function (this: CPU) {},
    143: function (this: CPU) {},
    144: function (this: CPU) {},
    145: function (this: CPU) {},
    146: function (this: CPU) {},
    147: function (this: CPU) {},
    148: function (this: CPU) {},
    149: function (this: CPU) {},
    150: function (this: CPU) {},
    151: function (this: CPU) {},
    152: function (this: CPU) {},
    153: function (this: CPU) {},
    154: function (this: CPU) {},
    155: function (this: CPU) {},
    156: function (this: CPU) {},
    157: function (this: CPU) {},
    158: function (this: CPU) {},
    159: function (this: CPU) {},
    160: function (this: CPU) {},
    161: function (this: CPU) {},
    162: function (this: CPU) {},
    163: function (this: CPU) {},
    164: function (this: CPU) {},
    165: function (this: CPU) {},
    166: function (this: CPU) {},
    167: function (this: CPU) {},
    168: function (this: CPU) {},
    169: function (this: CPU) {},
    170: function (this: CPU) {},
    171: function (this: CPU) {},
    172: function (this: CPU) {},
    173: function (this: CPU) {},
    174: function (this: CPU) {},
    175: function (this: CPU) {},
    176: function (this: CPU) {},
    177: function (this: CPU) {},
    178: function (this: CPU) {},
    179: function (this: CPU) {},
    180: function (this: CPU) {},
    181: function (this: CPU) {},
    182: function (this: CPU) {},
    183: function (this: CPU) {},
    184: function (this: CPU) {},
    185: function (this: CPU) {},
    186: function (this: CPU) {},
    187: function (this: CPU) {},
    188: function (this: CPU) {},
    189: function (this: CPU) {},
    190: function (this: CPU) {},
    191: function (this: CPU) {},
    192: function (this: CPU) {},
    193: function (this: CPU) {},
    194: function (this: CPU) {},
    195: function (this: CPU) {},
    196: function (this: CPU) {},
    197: function (this: CPU) {},
    198: function (this: CPU) {},
    199: function (this: CPU) {},
    200: function (this: CPU) {},
    201: function (this: CPU) {},
    202: function (this: CPU) {},
    203: function (this: CPU) {},
    204: function (this: CPU) {},
    205: function (this: CPU) {},
    206: function (this: CPU) {},
    207: function (this: CPU) {},
    208: function (this: CPU) {},
    209: function (this: CPU) {},
    210: function (this: CPU) {},
    211: function (this: CPU) {},
    212: function (this: CPU) {},
    213: function (this: CPU) {},
    214: function (this: CPU) {},
    215: function (this: CPU) {},
    216: function (this: CPU) {},
    217: function (this: CPU) {},
    218: function (this: CPU) {},
    219: function (this: CPU) {},
    220: function (this: CPU) {},
    221: function (this: CPU) {},
    222: function (this: CPU) {},
    223: function (this: CPU) {},
    224: function (this: CPU) {},
    225: function (this: CPU) {},
    226: function (this: CPU) {},
    227: function (this: CPU) {},
    228: function (this: CPU) {},
    229: function (this: CPU) {},
    230: function (this: CPU) {},
    231: function (this: CPU) {},
    232: function (this: CPU) {},
    233: function (this: CPU) {},
    234: function (this: CPU) {},
    235: function (this: CPU) {},
    236: function (this: CPU) {},
    237: function (this: CPU) {},
    238: function (this: CPU) {},
    239: function (this: CPU) {},
    240: function (this: CPU) {},
    241: function (this: CPU) {},
    242: function (this: CPU) {},
    243: function (this: CPU) {},
    244: function (this: CPU) {},
    245: function (this: CPU) {},
    246: function (this: CPU) {},
    247: function (this: CPU) {},
    248: function (this: CPU) {},
    249: function (this: CPU) {},
    250: function (this: CPU) {},
    251: function (this: CPU) {},
    252: function (this: CPU) {},
    253: function (this: CPU) {},
    254: function (this: CPU) {},
    255: function (this: CPU) {},
  },
  cbmap: {},
};
