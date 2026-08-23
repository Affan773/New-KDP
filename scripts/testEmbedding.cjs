const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Read the base64 fonts
const fontFile = fs.readFileSync(path.join(__dirname, '../src/assets/fonts/embeddedFonts.ts'), 'utf8');

function extractBase64(fontKey) {
  const regex = new RegExp(`'${fontKey}':\\s*{[\\s\\S]*?base64:\\s*'([A-Za-z0-9+/=]+)'`);
  const match = fontFile.match(regex);
  if (!match) throw new Error('Could not find font ' + fontKey);
  return match[1];
}

const outfitBoldB64 = extractBase64('Outfit-Bold');
const outfitRegB64 = extractBase64('Outfit-Regular');
const pjsBoldB64 = extractBase64('PlusJakartaSans-Bold');
const pjsRegB64 = extractBase64('PlusJakartaSans-Regular');

console.log('Outfit-Bold base64 length:', outfitBoldB64.length);
console.log('PlusJakartaSans-Bold base64 length:', pjsBoldB64.length);
console.log('PlusJakartaSans-Regular base64 length:', pjsRegB64.length);

const doc = new jsPDF({ unit: 'pt', format: [612, 792] });

// Add font files to VFS
doc.addFileToVFS('Outfit-Bold.ttf', outfitBoldB64);
doc.addFont('Outfit-Bold.ttf', 'Outfit', 'bold');

doc.addFileToVFS('Outfit-Regular.ttf', outfitRegB64);
doc.addFont('Outfit-Regular.ttf', 'Outfit', 'normal');

doc.addFileToVFS('PlusJakartaSans-Bold.ttf', 'PlusJakartaSans', 'bold');
doc.addFont('PlusJakartaSans-Bold.ttf', 'PlusJakartaSans', 'bold');

doc.addFileToVFS('PlusJakartaSans-Regular.ttf', 'PlusJakartaSans', 'normal');
doc.addFont('PlusJakartaSans-Regular.ttf', 'PlusJakartaSans', 'normal');

// 1. Puzzle Title: Outfit Bold 700 32px (24pt)
doc.setFont('Outfit', 'bold');
doc.setFontSize(24);
doc.text('PUZZLE 01 • SEVEN WONDERS', 306, 60, { align: 'center' });

// 2. Puzzle Grid: Outfit Bold 700 40px (30pt)
doc.setFont('Outfit', 'bold');
doc.setFontSize(30);
doc.text('A B C D E', 306, 200, { align: 'center' });

// 3. Word List Heading: Plus Jakarta Sans Bold 700 28px (21pt)
doc.setFont('PlusJakartaSans', 'bold');
doc.setFontSize(21);
doc.text('WORD LIST (12)', 306, 500, { align: 'center' });

// 4. Word List: Plus Jakarta Sans 400 26px (19.5pt)
doc.setFont('PlusJakartaSans', 'normal');
doc.setFontSize(19.5);
doc.text('• COLOSSUS   • PYRAMID', 306, 550, { align: 'center' });

// 5. Page Number: Plus Jakarta Sans 400 16px (12pt)
doc.setFont('PlusJakartaSans', 'normal');
doc.setFontSize(12);
doc.text('1', 306, 750, { align: 'center' });

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('test_embedded.pdf', pdfBuffer);

const pdfText = pdfBuffer.toString('latin1');
console.log('PDF Generated Size:', pdfBuffer.length, 'bytes');

// Check FontDescriptor, FontFile2, and Font dictionaries
const hasFontDescriptor = pdfText.includes('/FontDescriptor');
const hasFontFile2 = pdfText.includes('/FontFile2');
const hasOutfit = pdfText.includes('Outfit');
const hasPlusJakartaSans = pdfText.includes('PlusJakartaSans');
const hasToUnicode = pdfText.includes('/ToUnicode');

console.log('Embedded Font Inspection:');
console.log('- Has /FontDescriptor:', hasFontDescriptor);
console.log('- Has /FontFile2 (TrueType stream embedded):', hasFontFile2);
console.log('- Has /ToUnicode (CMap embedded):', hasToUnicode);
console.log('- Contains Outfit font definition:', hasOutfit);
console.log('- Contains PlusJakartaSans font definition:', hasPlusJakartaSans);

if (hasFontDescriptor && hasFontFile2 && hasOutfit && hasPlusJakartaSans) {
  console.log('\nSUCCESS: ALL FONTS PROPERLY EMBEDDED IN PDF STREAM!');
} else {
  console.error('\nFAILURE: Font embedding missing!');
  process.exit(1);
}
