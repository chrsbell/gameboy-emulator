import type {byte, word} from '../../../../helpers/Primitives';
import Cartridge from '../index';

import {ROMSizeCodeMap, RAMSizeCodeMap} from '../const';

class MBC1 extends Cartridge {
  private RAMEnabled = false;
  private ROMRAMMixed = 0;
  private bankingMode = 0;

  /**
   * Adds extra ROM and RAM banks according to the MBC type.
   */
  public initializeBanks(): void {
    // skip first bank, which is already mapped in ROM
    const numROMBanks = ROMSizeCodeMap[this.romSizeCode].numBanks - 1;
    this.romBanks = new Array(numROMBanks);
    for (let i = 0; i < numROMBanks; i += 0x4000) {
      this.romBanks[i] = new Uint8Array(
        this.rom.slice((i + 1) * 0x4000, (i + 2) * 0x4000)
      );
    }
    const numRAMBanks = RAMSizeCodeMap[this.ramSizeCode].numBanks;
    const ramSize = RAMSizeCodeMap[this.ramSizeCode].size;
    this.ramBanks = new Array(numRAMBanks);
    for (let i = 0; i < numROMBanks; i++) {
      this.ramBanks[i] = new Uint8Array(ramSize);
    }
  }
  public handleRegisterChanges(address: word, data: byte): void {
    if (address <= 0x1fff) {
      // RAM enable/disable
      this.RAMEnabled = (data & 0b1111) === 0xa;
    } else if (address <= 0x3fff) {
      // ROM bank change, map new rom bank to bit mask defining number of banks
      this.currROMBank = data & 0b11111;
      // data & (ROMSizeCodeMap[ROMSizeCode].numBanks - 1);
      if (!this.currROMBank) this.currROMBank = 1;
    } else if (address <= 0x5fff) {
      // used to select RAM bank in 32kb RAM carts
      this.ROMRAMMixed = data & 0b11;
      if (this.bankingMode === 1 && this.ramSizeCode === 3) {
        this.currRAMBank = this.ROMRAMMixed;
      } else {
        // select bits 5-6 of ROM bank
        this.currROMBank &= 0b11111;
        this.currROMBank |= data << 5;
      }
    } else if (address <= 0x7fff) {
      // banking mode select
      this.bankingMode = data & 1;
      // if (this.bankingMode === 1 && this.RAMEnabled) {
      //   // immediately set new RAM bank if RAM banking enabled
      //   this.currRAMBank = this.ROMRAMMixed;
      // }
    } else {
      // write to RAM bank of cartridge
      if (this.RAMEnabled) {
        if (this.bankingMode === 1) {
          this.currRAMBank = this.ROMRAMMixed;
        } else {
          this.currRAMBank = 0;
        }
        this.ramBanks[this.currRAMBank - 1][address - 0xa000] = data;
      }
    }
  }
}

export default MBC1;
