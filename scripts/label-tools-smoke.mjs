import { createLabelViewModel } from "../src/domain/label.js";
import { createQrCodeSvg } from "../src/infrastructure/qrCode.js";

const item = {
  id: "item-123",
  title: "Sterling serving spoon",
  category: "Silver",
  condition: "Good",
  catalogCode: "CAT-000123"
};
const label = createLabelViewModel(item, "https://example.test/catalog/");
const svg = createQrCodeSvg(label.itemUrl);
const alternateSvg = createQrCodeSvg("https://example.test/catalog/#item=item-456");

assert(label.itemUrl === "https://example.test/catalog/#item=item-123", "Label URL should point to the catalog item hash.");
assert(svg.includes('class="qr-code"'), "QR SVG should include the QR class.");
assert(svg.includes('viewBox="0 0 49 49"'), "QR SVG should include quiet-zone modules.");
assert((svg.match(/<rect/g) || []).length > 700, "QR SVG should render a full module pattern.");
assert(svg !== alternateSvg, "Different item URLs should produce different QR codes.");

try {
  createQrCodeSvg("x".repeat(160));
  throw new Error("Long QR values should fail before creating an unreadable label.");
} catch (error) {
  assert(error instanceof RangeError, "Long QR values should throw RangeError.");
}

console.log("Label QR and view-model smoke tests passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
