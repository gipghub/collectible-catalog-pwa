const CODE_128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export function createCode128BarcodeSvg(value, options = {}) {
  const { height = 54, moduleWidth = 2 } = options;
  const text = sanitizeCode128Value(value);
  const codes = createCode128Codes(text);
  const quietZone = 10;
  const totalModules = codes
    .map((code) => CODE_128_PATTERNS[code])
    .join("")
    .split("")
    .reduce((sum, width) => sum + Number(width), quietZone * 2);

  let x = quietZone;
  const bars = [];

  for (const code of codes) {
    const pattern = CODE_128_PATTERNS[code];

    for (let index = 0; index < pattern.length; index += 1) {
      const width = Number(pattern[index]) * moduleWidth;

      if (index % 2 === 0) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}"></rect>`);
      }

      x += width;
    }
  }

  const width = totalModules * moduleWidth;

  return [
    `<svg class="barcode" viewBox="0 0 ${width} ${height}" role="img" aria-label="Barcode ${escapeAttribute(text)}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${width}" height="${height}" fill="#fff"></rect>`,
    `<g fill="#111">${bars.join("")}</g>`,
    "</svg>"
  ].join("");
}

function createCode128Codes(value) {
  const dataCodes = [...value].map((character) => character.charCodeAt(0) - 32);
  const checksum = dataCodes.reduce(
    (sum, code, index) => sum + code * (index + 1),
    START_CODE_B
  ) % 103;

  return [START_CODE_B, ...dataCodes, checksum, STOP_CODE];
}

function sanitizeCode128Value(value) {
  return String(value)
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("")
    .slice(0, 48);
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
