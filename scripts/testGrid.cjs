const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');

async function testGrid() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const outfitBoldBuf = fs.readFileSync('src/assets/fonts/Outfit-Bold.ttf');
  const outfitBold = await doc.embedFont(outfitBoldBuf, { subset: true });

  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  // Grid: 15x15
  const cols = 15;
  const rows = 15;
  const cellSize = 26; // 390 pt total width
  const gridW = cols * cellSize;
  const gridH = rows * cellSize;
  const gridX = (width - gridW) / 2;
  const gridTopY = 150; // in canvas coords from top

  // Draw outer border
  const gridPdfBottom = height - (gridTopY + gridH);
  page.drawRectangle({
    x: gridX,
    y: gridPdfBottom,
    width: gridW,
    height: gridH,
    borderColor: rgb(0.067, 0.094, 0.153),
    borderWidth: 1.5,
  });

  // Draw inner grid lines
  for (let r = 1; r < rows; r++) {
    const y = height - (gridTopY + r * cellSize);
    page.drawLine({
      start: { x: gridX, y },
      end: { x: gridX + gridW, y },
      color: rgb(0.796, 0.835, 0.882),
      thickness: 0.6,
    });
  }
  for (let c = 1; c < cols; c++) {
    const x = gridX + c * cellSize;
    page.drawLine({
      start: { x, y: gridPdfBottom },
      end: { x, y: gridPdfBottom + gridH },
      color: rgb(0.796, 0.835, 0.882),
      thickness: 0.6,
    });
  }

  // Draw Letters: Outfit Bold 40px -> 30pt (or scaled to fit comfortably with margin)
  // For cellSize 26pt, a 16pt font (21px) fits cleanly inside cell.
  // When grid has fewer cols/larger cells (e.g. 10x10, cellSize 40pt), 30pt (40px) fits perfectly!
  const fontSize = Math.min(30, cellSize * 0.65);
  const capHeight = fontSize * 0.72;

  const letter = 'W';
  const letterW = outfitBold.widthOfTextAtSize(letter, fontSize);
  const cellCenterPdfY = height - (gridTopY + cellSize / 2);
  const textPdfY = cellCenterPdfY - capHeight / 2;

  page.drawText(letter, {
    x: gridX + (cellSize - letterW) / 2,
    y: textPdfY,
    size: fontSize,
    font: outfitBold,
    color: rgb(0.067, 0.094, 0.153),
  });

  const bytes = await doc.save({ useObjectStreams: false });
  fs.writeFileSync('test_grid.pdf', bytes);
  console.log('Saved test_grid.pdf, size:', bytes.length);
}

testGrid().catch(console.error);
