#!/usr/bin/env node
/**
 * Script to convert HLD and PRD Markdown (with optional Mermaid diagrams) to PDF
 *
 * Requirements:
 * - npm install -g @mermaid-js/mermaid-cli (or use npx)
 * - npm install -g md-to-pdf OR pandoc (with LaTeX engine)
 *
 * Usage:
 *   node scripts/gen-pdf-mvp-docs.js
 *
 * Outputs:
 *   docs/mvp/hld.pdf
 *   docs/mvp/prd.pdf
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_MVP = path.join(__dirname, '../docs/mvp');

const DOCUMENTS = [
  {
    name: 'HLD',
    inputPath: path.join(DOCS_MVP, 'hld.md'),
    pdfOutputPath: path.join(DOCS_MVP, 'hld.pdf'),
    assetsDirName: 'hld-pdf-assets',
  },
  {
    name: 'PRD',
    inputPath: path.join(DOCS_MVP, 'prd.md'),
    pdfOutputPath: path.join(DOCS_MVP, 'prd.pdf'),
    assetsDirName: 'prd-pdf-assets',
  },
];

// Resolve PDF converter once (md-to-pdf or pandoc)
function getPdfConverter() {
  try {
    execSync('md-to-pdf --version', { stdio: 'ignore' });
    return 'md-to-pdf';
  } catch (_e1) {
    try {
      execSync('npx --yes md-to-pdf --version', { stdio: 'ignore' });
      return 'npx --yes md-to-pdf';
    } catch (_e2) {
      try {
        execSync('pandoc --version', { stdio: 'ignore' });
        return 'pandoc';
      } catch (_e3) {
        return null;
      }
    }
  }
}

// Resolve mmdc command for Mermaid
function getMmdcCommand() {
  try {
    execSync('mmdc --version', { stdio: 'ignore' });
    return 'mmdc';
  } catch (_e) {
    try {
      execSync('npx --yes @mermaid-js/mermaid-cli --version', { stdio: 'ignore' });
      return 'npx --yes @mermaid-js/mermaid-cli';
    } catch (_e2) {
      return 'npx --yes @mermaid-js/mermaid-cli';
    }
  }
}

/**
 * Process one Markdown document: extract Mermaid → render to images → temp MD → PDF
 */
function processMarkdownToPdf(doc, pdfConverter, mmdcCommand) {
  const { name, inputPath, pdfOutputPath, assetsDirName } = doc;
  const outputDir = path.join(DOCS_MVP, assetsDirName);
  const tempMdPath = path.join(
    path.dirname(inputPath),
    path.basename(inputPath, '.md') + '-temp.md'
  );

  console.log(`\n━━━ ${name} ━━━`);
  console.log(`📄 Reading ${name} document...`);
  let content = fs.readFileSync(inputPath, 'utf-8');

  // Extract Mermaid diagrams
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let diagramIndex = 0;
  const diagramMap = new Map();

  while ((match = mermaidRegex.exec(content)) !== null) {
    diagramIndex++;
    const diagramCode = match[1].trim();
    const diagramId = `diagram-${diagramIndex}`;
    const diagramPath = path.join(outputDir, `${diagramId}.mmd`);
    const imagePath = path.join(outputDir, `${diagramId}.png`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(diagramPath, diagramCode);
    diagramMap.set(match[0], {
      id: diagramId,
      mmdPath: diagramPath,
      imagePath,
      relativeImagePath: `${assetsDirName}/${diagramId}.png`,
    });
  }

  if (diagramMap.size > 0) {
    console.log(`🔍 Found ${diagramMap.size} Mermaid diagram(s). Rendering...`);
    for (const [originalBlock, diagram] of diagramMap.entries()) {
      try {
        execSync(
          `${mmdcCommand} -i "${diagram.mmdPath}" -o "${diagram.imagePath}" -t dark -b transparent -w 1200`,
          { stdio: 'inherit' }
        );
        const imageMarkdown = `![${diagram.id}](${diagram.relativeImagePath})`;
        content = content.replace(originalBlock, imageMarkdown);
      } catch (err) {
        console.error(`  ✗ Failed to render ${diagram.id}:`, err.message);
      }
    }
  }

  console.log('💾 Saving modified Markdown...');
  fs.writeFileSync(tempMdPath, content);

  console.log('📄 Converting to PDF...');
  let pdfGenerated = false;

  if (pdfConverter === 'md-to-pdf' || pdfConverter === 'npx --yes md-to-pdf') {
    try {
      execSync(
        `${pdfConverter} "${tempMdPath}" --pdf-options '{"format":"A4","margin":{"top":"20mm","right":"20mm","bottom":"20mm","left":"20mm"},"printBackground":true}'`,
        { stdio: 'inherit' }
      );
      const generatedPdf = tempMdPath.replace('.md', '.pdf');
      if (fs.existsSync(generatedPdf)) {
        if (path.resolve(generatedPdf) !== path.resolve(pdfOutputPath)) {
          fs.renameSync(generatedPdf, pdfOutputPath);
        }
        pdfGenerated = true;
      }
    } catch (err) {
      console.error('  md-to-pdf failed:', err.message);
    }
  }

  if (!pdfGenerated && pdfConverter === 'pandoc') {
    try {
      execSync(
        `pandoc "${tempMdPath}" -o "${pdfOutputPath}" --pdf-engine=xelatex -V geometry:margin=20mm --highlight-style=tango`,
        { stdio: 'inherit' }
      );
      pdfGenerated = true;
    } catch (err) {
      console.error('  pandoc failed:', err.message);
    }
  }

  // Cleanup temp markdown
  if (fs.existsSync(tempMdPath)) {
    fs.unlinkSync(tempMdPath);
  }

  // Cleanup intermediate diagram files in this doc's assets dir
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
      const filePath = path.join(outputDir, file);
      const ext = path.extname(file).toLowerCase();
      if ((ext === '.mmd' || ext === '.png') && fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  if (pdfGenerated) {
    console.log(`✅ ${name} PDF: ${pdfOutputPath}`);
  } else {
    console.error(`❌ Failed to generate ${name} PDF.`);
  }
  return pdfGenerated;
}

// Main
const pdfConverter = getPdfConverter();
if (!pdfConverter) {
  console.error('\n❌ No PDF converter available.');
  console.error('  Install one of: md-to-pdf (npm install -g md-to-pdf) or pandoc');
  process.exit(1);
}
console.log('  Using PDF converter:', pdfConverter === 'npx --yes md-to-pdf' ? 'md-to-pdf (npx)' : pdfConverter);

const mmdcCommand = getMmdcCommand();
const hasMermaid = DOCUMENTS.some((d) => {
  try {
    return fs.existsSync(d.inputPath) && fs.readFileSync(d.inputPath, 'utf-8').includes('```mermaid');
  } catch (_) {
    return false;
  }
});
if (hasMermaid) {
  console.log('  Mermaid: ', mmdcCommand === 'npx --yes @mermaid-js/mermaid-cli' ? 'npx @mermaid-js/mermaid-cli' : mmdcCommand);
}

let anyFailed = false;
for (const doc of DOCUMENTS) {
  if (!fs.existsSync(doc.inputPath)) {
    console.warn(`\n⚠️  Skipping ${doc.name}: file not found: ${doc.inputPath}`);
    anyFailed = true;
    continue;
  }
  const ok = processMarkdownToPdf(doc, pdfConverter, mmdcCommand);
  if (!ok) anyFailed = true;
}

console.log('\n✨ Done.');
DOCUMENTS.forEach((d) => {
  if (fs.existsSync(d.pdfOutputPath)) {
    console.log(`📄 ${d.name}: ${d.pdfOutputPath}`);
  }
});
if (anyFailed) {
  process.exit(1);
}
