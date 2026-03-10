/**
 * Generate minimal valid .docx, .xlsx, .pptx for sandbox-assets.
 * Run: node scripts/generate-sandbox-ooxml.mjs
 * Output: frontend/lib/services/sandbox-assets/sample.docx, sample.xlsx, sample.pptx
 */
import JSZip from 'jszip'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'lib', 'services', 'sandbox-assets')

mkdirSync(OUT_DIR, { recursive: true })

// --- Minimal DOCX (Word) ---
const docxContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const docxRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const docxDocument = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Sample document for Pockett sandbox.</w:t></w:r></w:p>
  </w:body>
</w:document>`

const docxDocumentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

async function makeDocx() {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', docxContentTypes)
  zip.file('_rels/.rels', docxRels)
  zip.file('word/document.xml', docxDocument)
  zip.file('word/_rels/document.xml.rels', docxDocumentRels)
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  writeFileSync(path.join(OUT_DIR, 'sample.docx'), buf)
  console.log('Wrote sample.docx')
}

// --- Minimal XLSX (Excel) ---
const xlsxContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`

const xlsxRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

const xlsxWorkbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

const xlsxWorkbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`

const xlsxSheet1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row></sheetData>
</worksheet>`

const xlsxSharedStrings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="1" uniqueCount="1">
  <si><t>Sample</t></si>
</sst>`

async function makeXlsx() {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', xlsxContentTypes)
  zip.file('_rels/.rels', xlsxRels)
  zip.file('xl/workbook.xml', xlsxWorkbook)
  zip.file('xl/_rels/workbook.xml.rels', xlsxWorkbookRels)
  zip.file('xl/worksheets/sheet1.xml', xlsxSheet1)
  zip.file('xl/sharedStrings.xml', xlsxSharedStrings)
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  writeFileSync(path.join(OUT_DIR, 'sample.xlsx'), buf)
  console.log('Wrote sample.xlsx')
}

// --- Minimal PPTX (PowerPoint) ---
const pptxContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/_rels/slide1.xml.rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
</Types>`

const pptxRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`

const pptxPresentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
</p:presentation>`

const pptxPresentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`

const pptxSlide1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr/><p:spPr/><p:txBody><a:p><a:r><a:t>Sample slide</a:t></a:r></a:p></p:txBody></p:spTree></p:cSld>
</p:sld>`

const pptxSlide1Rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

async function makePptx() {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', pptxContentTypes)
  zip.file('_rels/.rels', pptxRels)
  zip.file('ppt/presentation.xml', pptxPresentation)
  zip.file('ppt/_rels/presentation.xml.rels', pptxPresentationRels)
  zip.file('ppt/slides/slide1.xml', pptxSlide1)
  zip.file('ppt/slides/_rels/slide1.xml.rels', pptxSlide1Rels)
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  writeFileSync(path.join(OUT_DIR, 'sample.pptx'), buf)
  console.log('Wrote sample.pptx')
}

// --- Minimal ZIP (archive) ---
async function makeZip() {
  const zip = new JSZip()
  zip.file('readme.txt', 'Sample archive for Pockett sandbox.\nGenerated by scripts/generate-sandbox-ooxml.mjs')
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  writeFileSync(path.join(OUT_DIR, 'sample.zip'), buf)
  console.log('Wrote sample.zip')
}

// --- Minimal PDF ---
function makePdf() {
  const parts = []
  parts.push('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
  const o1 = parts.join('').length
  parts.push('1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n')
  const o2 = parts.join('').length
  parts.push('2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1/MediaBox[0 0 612 792]>>\nendobj\n')
  const o3 = parts.join('').length
  parts.push('3 0 obj\n<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/MediaBox[0 0 612 792]>>\nendobj\n')
  const xrefStart = parts.join('').length
  parts.push('xref\n0 4\n')
  parts.push('0000000000 65535 f \n')
  parts.push(String(o1).padStart(10, '0') + ' 00000 n \n')
  parts.push(String(o2).padStart(10, '0') + ' 00000 n \n')
  parts.push(String(o3).padStart(10, '0') + ' 00000 n \n')
  parts.push('trailer\n<</Size 4/Root 1 0 R>>\nstartxref\n' + xrefStart + '\n%%EOF\n')
  const pdf = Buffer.from(parts.join(''), 'utf8')
  writeFileSync(path.join(OUT_DIR, 'sample.pdf'), pdf)
  console.log('Wrote sample.pdf')
}

async function main() {
  await makeDocx()
  await makeXlsx()
  await makePptx()
  await makeZip()
  makePdf()
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
