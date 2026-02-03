#!/usr/bin/env node
/**
 * Script to convert HLD Markdown with Mermaid diagrams to PDF
 * 
 * Requirements:
 * - npm install -g @mermaid-js/mermaid-cli
 * - npm install -g md-to-pdf
 * OR
 * - npm install -g pandoc (with LaTeX engine)
 * 
 * Usage:
 *   node scripts/generate-hld-pdf.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HLD_PATH = path.join(__dirname, '../docs/mvp/hld.md');
const OUTPUT_DIR = path.join(__dirname, '../docs/mvp/hld-pdf-assets');
const TEMP_MD_PATH = path.join(__dirname, '../docs/mvp/hld-temp.md');
const PDF_OUTPUT_PATH = path.join(__dirname, '../docs/mvp/hld.pdf');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📄 Reading HLD document...');
const hldContent = fs.readFileSync(HLD_PATH, 'utf-8');

// Extract all Mermaid diagrams
const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
let match;
let diagramIndex = 0;
const diagramMap = new Map();
let modifiedContent = hldContent;

console.log('🔍 Extracting Mermaid diagrams...');

while ((match = mermaidRegex.exec(hldContent)) !== null) {
  diagramIndex++;
  const diagramCode = match[1].trim();
  const diagramId = `diagram-${diagramIndex}`;
  const diagramPath = path.join(OUTPUT_DIR, `${diagramId}.mmd`);
  const imagePath = path.join(OUTPUT_DIR, `${diagramId}.png`);
  
  // Save Mermaid diagram to file
  fs.writeFileSync(diagramPath, diagramCode);
  
  // Store mapping
  diagramMap.set(match[0], {
    id: diagramId,
    mmdPath: diagramPath,
    imagePath: imagePath,
    relativeImagePath: `hld-pdf-assets/${diagramId}.png`
  });
  
  console.log(`  ✓ Found diagram ${diagramIndex}`);
}

console.log(`\n📊 Rendering ${diagramMap.size} Mermaid diagrams...`);

// Check if mermaid-cli is available (try npx first, then global)
let mmdcCommand = 'mmdc';
try {
  execSync('mmdc --version', { stdio: 'ignore' });
} catch (error) {
  // Try npx (no installation needed)
  try {
    execSync('npx --yes @mermaid-js/mermaid-cli --version', { stdio: 'ignore' });
    mmdcCommand = 'npx --yes @mermaid-js/mermaid-cli';
    console.log('  Using npx to run mermaid-cli (no installation needed)');
  } catch (npxError) {
    console.error('\n❌ Error: @mermaid-js/mermaid-cli is not available.');
    console.error('   It will be installed automatically via npx on first run.');
    console.error('   Or install globally: npm install -g @mermaid-js/mermaid-cli');
    mmdcCommand = 'npx --yes @mermaid-js/mermaid-cli';
  }
}

// Render each diagram
for (const [originalBlock, diagram] of diagramMap.entries()) {
  try {
    console.log(`  Rendering ${diagram.id}...`);
    
    // Use mmdc to render diagram
    execSync(
      `${mmdcCommand} -i "${diagram.mmdPath}" -o "${diagram.imagePath}" -t dark -b transparent -w 1200`,
      { stdio: 'inherit' }
    );
    
    // Replace Mermaid block with image reference
    const imageMarkdown = `![${diagram.id}](${diagram.relativeImagePath})`;
    modifiedContent = modifiedContent.replace(originalBlock, imageMarkdown);
    
    console.log(`    ✓ Rendered ${diagram.id}`);
  } catch (error) {
    console.error(`    ✗ Failed to render ${diagram.id}:`, error.message);
  }
}

// Save modified Markdown
console.log('\n💾 Saving modified Markdown...');
fs.writeFileSync(TEMP_MD_PATH, modifiedContent);

// Convert to PDF
console.log('\n📄 Converting to PDF...');

// Try md-to-pdf first (simpler, better for Markdown)
let pdfConverter = null;
let pdfGenerated = false;
try {
  execSync('md-to-pdf --version', { stdio: 'ignore' });
  pdfConverter = 'md-to-pdf';
} catch (error1) {
  // Try npx
  try {
    execSync('npx --yes md-to-pdf --version', { stdio: 'ignore' });
    pdfConverter = 'npx --yes md-to-pdf';
  } catch (error2) {
    // Try pandoc
    try {
      execSync('pandoc --version', { stdio: 'ignore' });
      pdfConverter = 'pandoc';
    } catch (error3) {
      // Try npx pandoc (won't work, but try anyway)
      pdfConverter = null;
    }
  }
}

if (pdfConverter === 'md-to-pdf' || pdfConverter === 'npx --yes md-to-pdf') {
  console.log('  Using md-to-pdf...');
  try {
    // md-to-pdf syntax: md-to-pdf input.md [output.pdf] [options]
    // Output file is optional - if not specified, creates input.pdf
    // PDF options are passed via --pdf-options flag
    execSync(
      `${pdfConverter} "${TEMP_MD_PATH}" --pdf-options '{"format":"A4","margin":{"top":"20mm","right":"20mm","bottom":"20mm","left":"20mm"},"printBackground":true}'`,
      { stdio: 'inherit' }
    );
    
    // md-to-pdf creates output in same directory as input with .pdf extension
    const generatedPdf = TEMP_MD_PATH.replace('.md', '.pdf');
    if (fs.existsSync(generatedPdf)) {
      // Move to desired location if different
      if (generatedPdf !== PDF_OUTPUT_PATH) {
        fs.renameSync(generatedPdf, PDF_OUTPUT_PATH);
      }
    } else {
      throw new Error('PDF file was not generated');
    }
    console.log(`\n✅ PDF generated successfully: ${PDF_OUTPUT_PATH}`);
    pdfGenerated = true;
  } catch (error) {
    console.error('  md-to-pdf failed:', error.message);
    console.error('  Trying alternative...');
    pdfConverter = null;
    pdfGenerated = false;
  }
}

if (!pdfConverter || pdfConverter === 'pandoc') {
  // Fallback to pandoc
  try {
    console.log('  Using pandoc...');
    execSync(
      `pandoc "${TEMP_MD_PATH}" -o "${PDF_OUTPUT_PATH}" --pdf-engine=xelatex -V geometry:margin=20mm --highlight-style=tango`,
      { stdio: 'inherit' }
    );
    console.log(`\n✅ PDF generated successfully: ${PDF_OUTPUT_PATH}`);
    pdfGenerated = true;
  } catch (error2) {
    console.error('\n❌ Error: PDF converter not available.');
    console.error('\nOptions:');
    console.error('  1. Install md-to-pdf: npm install -g md-to-pdf');
    console.error('  2. Install pandoc: brew install pandoc (macOS)');
    console.error('  3. Use VS Code: Install "Markdown PDF" extension');
    console.error('\nThe modified Markdown with image references has been saved to:');
    console.error(`  ${TEMP_MD_PATH}`);
    console.error('\nYou can manually convert it to PDF using:');
    console.error('  - VS Code: Right-click in preview → Export → PDF');
    console.error('  - Online: Upload to a Markdown-to-PDF converter');
    console.error('  - Browser: Open on GitHub and Print to PDF');
    process.exit(1);
  }
}

// Cleanup temporary and intermediate files after successful PDF generation
if (pdfGenerated && fs.existsSync(PDF_OUTPUT_PATH)) {
  console.log('\n🧹 Cleaning up temporary files...');
  
  // Clean up temp markdown file
  if (fs.existsSync(TEMP_MD_PATH)) {
    fs.unlinkSync(TEMP_MD_PATH);
    console.log('  ✓ Removed temp markdown file');
  }
  
  // Clean up MMD and PNG files from assets folder
  // These are regenerated each run, so no need to keep them
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(OUTPUT_DIR, file);
      const ext = path.extname(file).toLowerCase();
      
      // Delete .mmd and .png files (keep PDFs and other files)
      if ((ext === '.mmd' || ext === '.png') && fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`  ✓ Removed ${cleanedCount} intermediate diagram file(s)`);
    }
  }
}

console.log('\n✨ Done!');
console.log(`📄 PDF: ${PDF_OUTPUT_PATH}`);
