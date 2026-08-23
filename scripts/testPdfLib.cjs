const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');

async function testPdfLib() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const outfitBoldBuf = fs.readFileSync('src/assets/fonts/Outfit-Bold.ttf');
  const outfitRegBuf = fs.readFileSync('src/assets/fonts/Outfit-Regular.ttf');
  const pjsBoldBuf = fs.readFileSync('src/assets/fonts/PlusJakartaSans-Bold.ttf');
  const pjsRegBuf = fs.readFileSync('src/assets/fonts/PlusJakartaSans-Regular.ttf');

  const outfitBold = await doc.embedFont(outfitBoldBuf, { subset: true });
  const pjsBold = await doc.embedFont(pjsBoldBuf, { subset: true });
  const pjsReg = await doc.embedFont(pjsRegBuf, { subset: true });

  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  // 1. Puzzle Title: Outfit Bold 700 32px
  page.drawText('PUZZLE 01 • SEVEN WONDERS', {
    x: 50,
    y: height - 60,
    size: 24,
    font: outfitBold,
    color: rgb(0.067, 0.094, 0.153),
  });

  // 2. Puzzle Grid: Outfit Bold 700 40px
  page.drawText('A B C D E', {
    x: 50,
    y: 500,
    size: 30,
    font: outfitBold,
    color: rgb(0.067, 0.094, 0.153),
  });

  // 3. Word List Heading: Plus Jakarta Sans Bold 700 28px
  page.drawText('WORD LIST (12)', {
    x: 50,
    y: 250,
    size: 21,
    font: pjsBold,
    color: rgb(0.215, 0.255, 0.318),
  });

  // 4. Word List: Plus Jakarta Sans 400 26px
  page.drawText('• COLOSSUS   • PYRAMID', {
    x: 50,
    y: 200,
    size: 19.5,
    font: pjsReg,
    color: rgb(0.067, 0.094, 0.153),
  });

  // 5. Page Number: Plus Jakarta Sans 400 16px
  page.drawText('1', {
    x: 300,
    y: 40,
    size: 12,
    font: pjsReg,
    color: rgb(0.067, 0.094, 0.153),
  });

  const pdfBytes = await doc.save({ useObjectStreams: false });
  fs.writeFileSync('test_pdflib_embedded.pdf', pdfBytes);

  const pdfStr = Buffer.from(pdfBytes).toString('latin1');
  console.log('PDF Generated Size:', pdfBytes.length, 'bytes');

  // Verify internal PDF font structures
  const fontDescriptors = (pdfStr.match(/\/Type\s*\/FontDescriptor/g) || []).length;
  const fontFileStreams = (pdfStr.match(/\/FontFile[23]?/g) || []).length;
  const type0Fonts = (pdfStr.match(/\/Subtype\s*\/Type0/g) || []).length;
  const toUnicodeMaps = (pdfStr.match(/\/ToUnicode/g) || []).length;

  console.log('\n--- PDF INTERNAL FONT RESOURCE INSPECTION ---');
  console.log('Font Descriptors Count:', fontDescriptors);
  console.log('Embedded FontFile2/FontFile3 Streams:', fontFileStreams);
  console.log('Type0 (Composite Unicode) Fonts:', type0Fonts);
  console.log('ToUnicode CMaps:', toUnicodeMaps);

  // Print all /BaseFont and /FontName in PDF
  const baseFonts = pdfStr.match(/\/BaseFont\s*\/([^\s/>]+)/g) || [];
  console.log('BaseFonts found in PDF dictionary:', baseFonts);

  if (fontDescriptors >= 3 && fontFileStreams >= 3 && type0Fonts >= 3) {
    console.log('\n✅ PASS: ALL TRUE TYPE FONTS ARE PROPERLY EMBEDDED IN THE PDF FILE!');
  } else {
    console.error('\n❌ FAIL: Font embedding failed');
    process.exit(1);
  }
}

testPdfLib().catch(err => {
  console.error(err);
  process.exit(1);
});
