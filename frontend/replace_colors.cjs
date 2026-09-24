const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/workf/Music/CSE220-PhaseVocoderVoiceChanger/frontend/src';

// Map of hex values (or rgba equivalents) to semantic class parts.
// We'll replace bg-[#HEX] with bg-semantic, text-[#HEX] with text-semantic, etc.
const colorMap = {
  '#f4f3ee': 'cream',
  '#faf9f6': 'surface',
  '#f0eee8': 'surface-raised',
  '#ebe8e1': 'surface-muted',
  '#1f2328': 'ink-primary',
  '#26211c': 'ink-primary', // Treating this brown-black as primary ink
  '#ffffff': 'surface', // Often used for selected buttons/cards, let's look closer. Actually, sometimes we want explicitly white in light mode. Let's use `bg-surface` instead of `bg-[#ffffff]`.
  '#59636e': 'ink-secondary',
  '#57534e': 'ink-secondary', // Brownish secondary
  '#8c959f': 'ink-tertiary',
  '#79716b': 'ink-tertiary', // Brownish tertiary
  '#4b5563': 'slider-fill',
  '#e5e7eb': 'slider-track',
  '#e4def2': 'lavender',
  '#dcd4ee': 'lavender-hover',
  '#d0c4e7': 'lavender-active',
  '#f0ead8': 'pastel-cream',
  '#dce6f0': 'pastel-blue',
  '#e5e3e8': 'pastel-lavender',
  '#f0e3db': 'pastel-peach',
  '#e3e8e4': 'pastel-green',
  'rgba(38,33,28,0.2)': 'hairline',
  'rgba(38,33,28,0.15)': 'hairline',
  'rgba(38,33,28,0.12)': 'hairline',
  'rgba(38, 33, 28, 0.12)': 'hairline',
  'rgba(38,33,28,0.18)': 'hairline',
  'rgba(38,33,28,0.08)': 'hairline',
  'rgba(38,33,28,0.06)': 'hairline',
  'rgba(38,33,28,0.05)': 'hairline',
  'rgba(38, 33, 28, 0.05)': 'hairline',
  'rgba(38,33,28,0.3)': 'hairline',
  'rgba(38,33,28,0.4)': 'hairline',
  'rgba(38,33,28,0.5)': 'hairline',
  'rgba(38,33,28,0.35)': 'hairline',
  'rgba(31,35,40,0.08)': 'hairline',
  '#f7f4ec': 'surface-raised',
  '#1a1713': 'ink-primary',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Pattern for Tailwind classes like bg-[#1f2328], text-[rgba(38,33,28,0.2)], border-[#26211c]
  // We need to match the prefix (bg, text, border, ring, hover:bg, etc.) and the value
  
  // Sort keys by length descending to match longest RGBA strings first
  const keys = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  for (const hex of keys) {
    const semantic = colorMap[hex];
    
    // For classes like prefix-[hex]
    // Escape regex characters in hex string
    const escapedHex = hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex1 = new RegExp(`(bg|text|border|ring|stroke|fill|divide|shadow)-\\[${escapedHex}\\]`, 'g');
    content = content.replace(regex1, `$1-${semantic}`);

    // Also handle hover:/focus:/active: prefixes
    const regex2 = new RegExp(`(hover|focus|active|group-hover):([a-z]+)-\\[${escapedHex}\\]`, 'g');
    content = content.replace(regex2, `$1:$2-${semantic}`);
  }

  // Also replace explicit string checks (e.g. in Canvas or inline styles)
  // We will let the user or agent do manual fixes for Canvas if needed, 
  // but let's do a basic pass for Canvas variables where possible.
  // Wait, replacing strings in JS logic could break Canvas if it expects a valid CSS color.
  // Actually, CSS variables work in Canvas! ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink-primary')
  // But let's leave JS string literals alone for now, we'll fix Canvas manually.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(directory);
