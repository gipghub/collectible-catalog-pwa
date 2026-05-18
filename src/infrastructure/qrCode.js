const QR_VERSION = 6;
const MODULE_COUNT = 21 + (QR_VERSION - 1) * 4;
const ERROR_CORRECTION_CODEWORDS_PER_BLOCK = 18;
const ERROR_CORRECTION_BLOCKS = 2;
const MASK_PATTERN = 0;
const QUIET_ZONE_MODULES = 4;
const FORMAT_ERROR_CORRECTION_LOW = 1;

const { EXP_TABLE, LOG_TABLE } = createGaloisTables();

export function createQrCodeSvg(value, options = {}) {
  const { size = 96, ariaLabel = "QR code" } = options;
  const modules = createQrCodeModules(String(value || ""));
  const viewBoxSize = MODULE_COUNT + QUIET_ZONE_MODULES * 2;
  const rects = [];

  for (let row = 0; row < MODULE_COUNT; row += 1) {
    for (let column = 0; column < MODULE_COUNT; column += 1) {
      if (modules[row][column]) {
        rects.push(`<rect x="${column + QUIET_ZONE_MODULES}" y="${row + QUIET_ZONE_MODULES}" width="1" height="1"></rect>`);
      }
    }
  }

  return [
    `<svg class="qr-code" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" role="img" aria-label="${escapeAttribute(ariaLabel)}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">`,
    `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#fff"></rect>`,
    `<g fill="#111">${rects.join("")}</g>`,
    "</svg>"
  ].join("");
}

function createQrCodeModules(value) {
  const bytes = [...new TextEncoder().encode(value)];
  const { dataCodewords, totalCodewords } = getVersionCapacity();
  const maxByteLength = Math.floor((dataCodewords * 8 - 12) / 8);

  if (bytes.length > maxByteLength) {
    throw new RangeError(`QR value is ${bytes.length} bytes, but the label QR code supports ${maxByteLength} bytes.`);
  }

  const dataCodewordBytes = createDataCodewords(bytes, dataCodewords);
  const finalCodewords = addErrorCorrection(dataCodewordBytes, totalCodewords);
  const { modules, functionModules } = createFunctionPattern();
  drawCodewords(modules, functionModules, finalCodewords);
  drawFormatBits(modules, functionModules);

  return modules;
}

function getVersionCapacity() {
  const { functionModules } = createFunctionPattern();
  const dataModuleCount = functionModules.flat().filter((isFunctionModule) => !isFunctionModule).length;
  const totalCodewords = Math.floor(dataModuleCount / 8);
  const errorCorrectionCodewords = ERROR_CORRECTION_CODEWORDS_PER_BLOCK * ERROR_CORRECTION_BLOCKS;

  return {
    totalCodewords,
    dataCodewords: totalCodewords - errorCorrectionCodewords
  };
}

function createDataCodewords(bytes, dataCodewordCount) {
  const bits = [];
  const capacityBits = dataCodewordCount * 8;

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  appendBits(bits, 0, Math.min(4, capacityBits - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = [];

  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }

  for (let index = 0; codewords.length < dataCodewordCount; index += 1) {
    codewords.push(index % 2 === 0 ? 0xec : 0x11);
  }

  return codewords;
}

function addErrorCorrection(dataCodewords, totalCodewords) {
  const blockDataLength = dataCodewords.length / ERROR_CORRECTION_BLOCKS;
  const blocks = [];

  for (let blockIndex = 0; blockIndex < ERROR_CORRECTION_BLOCKS; blockIndex += 1) {
    const start = blockIndex * blockDataLength;
    const block = dataCodewords.slice(start, start + blockDataLength);
    blocks.push({
      data: block,
      errorCorrection: createErrorCorrectionCodewords(block, ERROR_CORRECTION_CODEWORDS_PER_BLOCK)
    });
  }

  const result = [];

  for (let byteIndex = 0; byteIndex < blockDataLength; byteIndex += 1) {
    for (const block of blocks) {
      result.push(block.data[byteIndex]);
    }
  }

  for (let byteIndex = 0; byteIndex < ERROR_CORRECTION_CODEWORDS_PER_BLOCK; byteIndex += 1) {
    for (const block of blocks) {
      result.push(block.errorCorrection[byteIndex]);
    }
  }

  return result.slice(0, totalCodewords);
}

function createFunctionPattern() {
  const modules = createModuleGrid(false);
  const functionModules = createModuleGrid(false);

  drawFinderPattern(modules, functionModules, 0, 0);
  drawFinderPattern(modules, functionModules, MODULE_COUNT - 7, 0);
  drawFinderPattern(modules, functionModules, 0, MODULE_COUNT - 7);
  drawTimingPatterns(modules, functionModules);
  drawAlignmentPatterns(modules, functionModules);
  drawDarkModule(modules, functionModules);
  reserveFormatAreas(functionModules);

  return { modules, functionModules };
}

function drawFinderPattern(modules, functionModules, startX, startY) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const moduleX = startX + x;
      const moduleY = startY + y;

      if (!isInside(moduleX, moduleY)) {
        continue;
      }

      const isFinder = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const dark = isFinder && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setFunctionModule(modules, functionModules, moduleX, moduleY, dark);
    }
  }
}

function drawTimingPatterns(modules, functionModules) {
  for (let index = 8; index < MODULE_COUNT - 8; index += 1) {
    const dark = index % 2 === 0;
    setFunctionModule(modules, functionModules, index, 6, dark);
    setFunctionModule(modules, functionModules, 6, index, dark);
  }
}

function drawAlignmentPatterns(modules, functionModules) {
  const centers = [6, 34];

  for (const y of centers) {
    for (const x of centers) {
      if (functionModules[y][x]) {
        continue;
      }

      for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
        for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
          const dark = Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== 1;
          setFunctionModule(modules, functionModules, x + offsetX, y + offsetY, dark);
        }
      }
    }
  }
}

function drawDarkModule(modules, functionModules) {
  setFunctionModule(modules, functionModules, 8, QR_VERSION * 4 + 9, true);
}

function reserveFormatAreas(functionModules) {
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      functionModules[8][index] = true;
      functionModules[index][8] = true;
    }
  }

  for (let index = MODULE_COUNT - 8; index < MODULE_COUNT; index += 1) {
    functionModules[8][index] = true;
    functionModules[index][8] = true;
  }
}

function drawCodewords(modules, functionModules, codewords) {
  const bits = [];

  for (const codeword of codewords) {
    appendBits(bits, codeword, 8);
  }

  let bitIndex = 0;
  let movingUp = true;

  for (let rightColumn = MODULE_COUNT - 1; rightColumn >= 1; rightColumn -= 2) {
    if (rightColumn === 6) {
      rightColumn -= 1;
    }

    for (let verticalIndex = 0; verticalIndex < MODULE_COUNT; verticalIndex += 1) {
      const y = movingUp ? MODULE_COUNT - 1 - verticalIndex : verticalIndex;

      for (let x = rightColumn; x >= rightColumn - 1; x -= 1) {
        if (functionModules[y][x]) {
          continue;
        }

        const masked = (bits[bitIndex] || 0) ^ Number(shouldMask(x, y));
        modules[y][x] = Boolean(masked);
        bitIndex += 1;
      }
    }

    movingUp = !movingUp;
  }
}

function drawFormatBits(modules, functionModules) {
  const formatBits = createFormatBits(FORMAT_ERROR_CORRECTION_LOW, MASK_PATTERN);

  for (let index = 0; index <= 5; index += 1) {
    setFunctionModule(modules, functionModules, 8, index, getBit(formatBits, index));
  }

  setFunctionModule(modules, functionModules, 8, 7, getBit(formatBits, 6));
  setFunctionModule(modules, functionModules, 8, 8, getBit(formatBits, 7));
  setFunctionModule(modules, functionModules, 7, 8, getBit(formatBits, 8));

  for (let index = 9; index < 15; index += 1) {
    setFunctionModule(modules, functionModules, 14 - index, 8, getBit(formatBits, index));
  }

  for (let index = 0; index < 8; index += 1) {
    setFunctionModule(modules, functionModules, MODULE_COUNT - 1 - index, 8, getBit(formatBits, index));
  }

  for (let index = 8; index < 15; index += 1) {
    setFunctionModule(modules, functionModules, 8, MODULE_COUNT - 15 + index, getBit(formatBits, index));
  }
}

function createFormatBits(errorCorrectionLevel, maskPattern) {
  const data = (errorCorrectionLevel << 3) | maskPattern;
  let remainder = data;

  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) ? 0x537 : 0);
  }

  return ((data << 10) | remainder) ^ 0x5412;
}

function createErrorCorrectionCodewords(dataCodewords, degree) {
  const generator = createGeneratorPolynomial(degree);
  const result = Array.from({ length: degree }, () => 0);

  for (const dataCodeword of dataCodewords) {
    const factor = dataCodeword ^ result.shift();
    result.push(0);

    for (let index = 0; index < degree; index += 1) {
      result[index] ^= multiplyGalois(generator[index + 1], factor);
    }
  }

  return result;
}

function createGeneratorPolynomial(degree) {
  let result = [1];

  for (let exponent = 0; exponent < degree; exponent += 1) {
    const next = Array.from({ length: result.length + 1 }, () => 0);

    for (let index = 0; index < result.length; index += 1) {
      next[index] ^= result[index];
      next[index + 1] ^= multiplyGalois(result[index], EXP_TABLE[exponent]);
    }

    result = next;
  }

  return result;
}

function createGaloisTables() {
  const expTable = [];
  const logTable = [];
  let value = 1;

  for (let index = 0; index < 255; index += 1) {
    expTable[index] = value;
    logTable[value] = index;
    value <<= 1;

    if (value & 0x100) {
      value ^= 0x11d;
    }
  }

  for (let index = 255; index < 512; index += 1) {
    expTable[index] = expTable[index - 255];
  }

  return {
    EXP_TABLE: expTable,
    LOG_TABLE: logTable
  };
}

function multiplyGalois(left, right) {
  if (left === 0 || right === 0) {
    return 0;
  }

  return EXP_TABLE[LOG_TABLE[left] + LOG_TABLE[right]];
}

function appendBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function shouldMask(x, y) {
  return MASK_PATTERN === 0 && (x + y) % 2 === 0;
}

function setFunctionModule(modules, functionModules, x, y, dark) {
  if (!isInside(x, y)) {
    return;
  }

  modules[y][x] = dark;
  functionModules[y][x] = true;
}

function createModuleGrid(value) {
  return Array.from({ length: MODULE_COUNT }, () => Array.from({ length: MODULE_COUNT }, () => value));
}

function isInside(x, y) {
  return x >= 0 && x < MODULE_COUNT && y >= 0 && y < MODULE_COUNT;
}

function getBit(value, index) {
  return Boolean((value >>> index) & 1);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
