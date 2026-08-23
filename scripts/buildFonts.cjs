const fs = require('fs');
const path = require('path');

const publicFontsDir = path.join(process.cwd(), 'public/fonts');
if (!fs.existsSync(publicFontsDir)) fs.mkdirSync(publicFontsDir, { recursive: true });

const fontNames = [
  'Outfit-Bold.ttf',
  'Outfit-Regular.ttf',
  'PlusJakartaSans-Bold.ttf',
  'PlusJakartaSans-Regular.ttf'
];

const fontMap = {};

for (const name of fontNames) {
  const src = path.join(process.cwd(), 'src/assets/fonts', name);
  const dest = path.join(publicFontsDir, name);
  fs.copyFileSync(src, dest);
  const buf = fs.readFileSync(src);
  fontMap[name] = buf.toString('base64');
  console.log('Encoded', name, buf.length, 'bytes -> base64 string length', fontMap[name].length);
}

const tsContent = `// Auto-generated embedded TrueType font binaries for 100% offline, guaranteed KDP PDF font embedding
export interface EmbeddedFontRecord {
  filename: string;
  fontFamily: string;
  fontStyle: string;
  weight: number;
  base64: string;
}

export const EMBEDDED_FONTS: Record<string, EmbeddedFontRecord> = {
  'Outfit-Bold': {
    filename: 'Outfit-Bold.ttf',
    fontFamily: 'Outfit',
    fontStyle: 'bold',
    weight: 700,
    base64: '${fontMap['Outfit-Bold.ttf']}',
  },
  'Outfit-Regular': {
    filename: 'Outfit-Regular.ttf',
    fontFamily: 'Outfit',
    fontStyle: 'normal',
    weight: 400,
    base64: '${fontMap['Outfit-Regular.ttf']}',
  },
  'PlusJakartaSans-Bold': {
    filename: 'PlusJakartaSans-Bold.ttf',
    fontFamily: 'PlusJakartaSans',
    fontStyle: 'bold',
    weight: 700,
    base64: '${fontMap['PlusJakartaSans-Bold.ttf']}',
  },
  'PlusJakartaSans-Regular': {
    filename: 'PlusJakartaSans-Regular.ttf',
    fontFamily: 'PlusJakartaSans',
    fontStyle: 'normal',
    weight: 400,
    base64: '${fontMap['PlusJakartaSans-Regular.ttf']}',
  },
};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/assets/fonts/embeddedFonts.ts'), tsContent);
console.log('src/assets/fonts/embeddedFonts.ts generated successfully!');
