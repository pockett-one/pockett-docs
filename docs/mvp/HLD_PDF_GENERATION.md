# How to Generate HLD PDF with Mermaid Diagrams

This guide provides multiple methods to convert `hld.md` to PDF with properly rendered Mermaid diagrams.

## Method 1: Automated Script (Recommended)

### Prerequisites

Install the required tools:

```bash
# Install Mermaid CLI globally
npm install -g @mermaid-js/mermaid-cli

# Install PDF converter (choose one)
npm install -g md-to-pdf
# OR
# Install pandoc (via Homebrew on macOS)
brew install pandoc
```

### Run the Script

```bash
node scripts/generate-hld-pdf.js
```

The script will:
1. Extract all Mermaid diagrams from `hld.md`
2. Render each diagram as a PNG image
3. Replace Mermaid code blocks with image references
4. Convert the modified Markdown to PDF

**Output:**
- `docs/mvp/hld.pdf` - Final PDF document
- `docs/mvp/hld-pdf-assets/` - Rendered diagram images

---

## Method 2: VS Code Extension (Easiest)

### Steps

1. **Install VS Code Extension:**
   - Open VS Code
   - Install "Markdown PDF" extension by yzane
   - Or install "Markdown Preview Enhanced" by Yiyi Wang

2. **Render Mermaid Diagrams First:**
   - Open `docs/mvp/hld.md` in VS Code
   - Use VS Code's built-in Markdown preview (Cmd+Shift+V)
   - The preview should render Mermaid diagrams automatically
   - If not, install "Markdown Preview Mermaid Support" extension

3. **Export to PDF:**
   - Right-click in the preview pane
   - Select "Export" → "PDF"
   - Or use Command Palette: "Markdown PDF: Export (pdf)"

**Note:** VS Code's built-in preview may not render all Mermaid diagrams perfectly. For best results, use Method 1.

---

## Method 3: Manual Process with Mermaid Live Editor

### Steps

1. **Render Diagrams:**
   - Go to [mermaid.live](https://mermaid.live)
   - Copy each Mermaid code block from `hld.md`
   - Paste into the editor
   - Export as PNG (use "Actions" → "Download PNG")
   - Save with descriptive names (e.g., `diagram-1-system-context.png`)

2. **Update Markdown:**
   - Replace each `\`\`\`mermaid ... \`\`\`` block with:
     ```markdown
     ![Diagram Description](path/to/diagram-1-system-context.png)
     ```

3. **Convert to PDF:**
   - Use any Markdown-to-PDF converter:
     - Online: [Markdown to PDF](https://www.markdowntopdf.com/)
     - VS Code: "Markdown PDF" extension
     - Command line: `pandoc hld.md -o hld.pdf`

---

## Method 4: Using Pandoc with Mermaid Filter

### Prerequisites

```bash
# Install pandoc
brew install pandoc  # macOS
# or
sudo apt-get install pandoc  # Linux

# Install mermaid-filter for pandoc
npm install -g mermaid-filter
```

### Convert

```bash
cd docs/mvp
pandoc hld.md -o hld.pdf \
  --filter mermaid-filter \
  --pdf-engine=xelatex \
  -V geometry:margin=20mm \
  --highlight-style=tango
```

---

## Method 5: GitHub/GitLab (Online)

1. **Push to Repository:**
   - Commit `hld.md` to your Git repository
   - Push to GitHub or GitLab

2. **View Online:**
   - GitHub automatically renders Mermaid diagrams in Markdown files
   - Open the file on GitHub/GitLab

3. **Print to PDF:**
   - Use browser's Print function (Cmd/Ctrl+P)
   - Select "Save as PDF" as destination
   - Adjust print settings for best layout

**Note:** This method preserves diagrams but may not format as nicely as dedicated PDF tools.

---

## Troubleshooting

### Diagrams Not Rendering

- **Issue:** Mermaid CLI fails with "Command not found"
  - **Solution:** Ensure `@mermaid-js/mermaid-cli` is installed globally or use `npx mmdc`

- **Issue:** Diagrams render but look blurry
  - **Solution:** Increase width in script: `-w 2400` instead of `-w 1200`

- **Issue:** PDF converter fails
  - **Solution:** Try alternative converter (md-to-pdf vs pandoc)

### PDF Formatting Issues

- **Issue:** Page breaks in wrong places
  - **Solution:** Add `\pagebreak` in Markdown before major sections

- **Issue:** Images too small/large
  - **Solution:** Adjust image size in Markdown: `![alt](image.png =800x)`

### Performance

- **Issue:** Script takes too long
  - **Solution:** Diagrams are rendered sequentially. For faster processing, consider parallel rendering (advanced).

---

## Recommended Settings for Best Results

### For md-to-pdf:

```javascript
{
  "format": "A4",
  "margin": {
    "top": "20mm",
    "right": "20mm",
    "bottom": "20mm",
    "left": "20mm"
  },
  "printBackground": true,
  "scale": 0.8
}
```

### For Pandoc:

```bash
pandoc hld.md -o hld.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=20mm \
  -V fontsize=11pt \
  -V documentclass=article \
  --highlight-style=tango \
  --toc \
  --toc-depth=2
```

---

## Quick Reference

| Method | Difficulty | Quality | Speed |
|--------|-----------|---------|-------|
| Automated Script | Medium | ⭐⭐⭐⭐⭐ | Fast |
| VS Code Extension | Easy | ⭐⭐⭐⭐ | Medium |
| Manual (Mermaid Live) | Hard | ⭐⭐⭐⭐⭐ | Slow |
| Pandoc with Filter | Medium | ⭐⭐⭐⭐ | Fast |
| GitHub Print | Easy | ⭐⭐⭐ | Fast |

---

## Next Steps

After generating the PDF:
1. Review the PDF for formatting issues
2. Adjust diagram sizes if needed
3. Re-run the script/conversion
4. Share the PDF with your team

For questions or issues, refer to:
- [Mermaid Documentation](https://mermaid.js.org/)
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html)
- [md-to-pdf GitHub](https://github.com/simonhaenisch/md-to-pdf)
