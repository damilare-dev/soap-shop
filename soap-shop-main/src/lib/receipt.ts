import { jsPDF } from "jspdf";
import { fmt } from "./utils";
import { NAIRA_FONT_REGULAR_B64, NAIRA_FONT_BOLD_B64 } from "./receiptFont";

// Editable shop header fields shown on every printed receipt.
export const SHOP_NAME = "Unique Standard Baby Care";
export const SHOP_PHONE = "08035028475";
export const SHOP_ADDRESS_HEAD = "Head Office: 80, Asubiaro Street, Odiolowo, Jaleyemi Area, Osogbo, Osun State.";
export const SHOP_ADDRESS_BRANCH = "Branch Office: 1, Araromi Street, Owode Market, Owode-Ede, Osun State.";

export type ReceiptItem = {
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptInput = {
  items: ReceiptItem[];
  total: number;
  store?: string;
  voided?: boolean;
};

const formatQty = (n: number): string => (n % 1 === 0 ? String(n) : n.toFixed(1));

// jsPDF's standard fonts (helvetica/times/courier) use WinAnsiEncoding, which has no
// glyph for the Naira sign (₦, U+20A6) — it renders as a broken bar. This embeds a
// subsetted Liberation Sans (ASCII + the Naira glyph only, ~24KB) so ₦ renders correctly.
function registerFonts(doc: jsPDF): void {
  doc.addFileToVFS("NairaSans-Regular.ttf", NAIRA_FONT_REGULAR_B64);
  doc.addFont("NairaSans-Regular.ttf", "NairaSans", "normal");
  doc.addFileToVFS("NairaSans-Bold.ttf", NAIRA_FONT_BOLD_B64);
  doc.addFont("NairaSans-Bold.ttf", "NairaSans", "bold");
}

function buildReceiptPdf(input: ReceiptInput): jsPDF {
  const { items, total, store, voided } = input;
  const width = 80;
  // Extra 22mm over the base 58 accounts for the two address blocks (~4 lines at 8pt).
  const height = 80 + items.length * 10.5 + (store ? 5 : 0) + (voided ? 8 : 0);
  // jsPDF enforces pageHeight >= pageWidth under the default "portrait" orientation,
  // silently swapping the two when width > height (true for most 1-2 item receipts,
  // since height grows with item count but width is fixed at 80mm). Without an explicit
  // orientation, all the width/height-based layout math below would then be positioning
  // content against the wrong (swapped) page, clipping borders and right-aligned amounts.
  const doc = new jsPDF({ unit: "mm", format: [width, height], orientation: width > height ? "landscape" : "portrait" });
  registerFonts(doc);

  const marginX = 6;
  let y = 10;

  doc.setFont("NairaSans", "bold");
  doc.setFontSize(15);
  doc.text(SHOP_NAME, width / 2, y, { align: "center" });
  y += 6;

  doc.setFont("NairaSans", "normal");
  doc.setFontSize(10);
  doc.text(SHOP_PHONE, width / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(8);
  const addrWidth = width - 2 * marginX;
  const headLines = doc.splitTextToSize(SHOP_ADDRESS_HEAD, addrWidth);
  doc.text(headLines, width / 2, y, { align: "center" });
  y += headLines.length * 3.5 + 1.5;
  const branchLines = doc.splitTextToSize(SHOP_ADDRESS_BRANCH, addrWidth);
  doc.text(branchLines, width / 2, y, { align: "center" });
  y += branchLines.length * 3.5 + 2;

  doc.setFontSize(10);
  if (store) {
    doc.text(store, width / 2, y, { align: "center" });
    y += 5;
  }

  y += 1;
  doc.setLineWidth(0.2);
  doc.line(marginX, y, width - marginX, y);
  y += 5;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  doc.setFontSize(9);
  doc.text(`${dateStr}  ${timeStr}`, marginX, y);
  y += 6;

  if (voided) {
    doc.setFont("NairaSans", "bold");
    doc.setFontSize(13);
    doc.setTextColor(192, 57, 43);
    doc.text("VOID - NOT A VALID RECEIPT", width / 2, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  doc.line(marginX, y, width - marginX, y);
  y += 5;

  doc.setFont("NairaSans", "normal");
  doc.setFontSize(10);
  for (const item of items) {
    doc.text(item.productName, marginX, y);
    y += 4.5;
    doc.text(`${formatQty(item.qty)} x ${fmt(item.unitPrice)}`, marginX, y);
    doc.text(fmt(item.lineTotal), width - marginX, y, { align: "right" });
    y += 6;
  }

  doc.line(marginX, y, width - marginX, y);
  y += 6;

  doc.setFont("NairaSans", "bold");
  doc.setFontSize(12);
  doc.text("Total", marginX, y);
  doc.text(fmt(total), width - marginX, y, { align: "right" });
  y += 8;

  doc.setFont("NairaSans", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you!", width / 2, y, { align: "center" });

  return doc;
}

// Builds the receipt PDF and shares it (e.g. to WhatsApp) via the Web Share API when
// available, falling back to a direct download otherwise. Client-side only, works offline.
export async function generateReceipt(input: ReceiptInput): Promise<void> {
  const doc = buildReceiptPdf(input);
  const filename = `receipt-${Date.now()}.pdf`;

  if ("share" in navigator && "canShare" in navigator) {
    try {
      const file = new File([doc.output("blob")], filename, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // user cancelled share sheet
      // any other share failure falls through to download below
    }
  }

  doc.save(filename);
}
