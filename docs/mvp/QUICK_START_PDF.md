# Quick Start: Generate HLD PDF

## Easiest Method (VS Code - No Installation)

1. **Open `docs/mvp/hld.md` in VS Code**

2. **Open Preview:**
   - Press `Cmd+Shift+V` (Mac) or `Ctrl+Shift+V` (Windows/Linux)
   - Or right-click → "Open Preview"

3. **Install Extension (if Mermaid doesn't render):**
   - Open Extensions (`Cmd+Shift+X`)
   - Search for "Markdown Preview Mermaid Support"
   - Install it

4. **Export to PDF:**
   - Right-click in the preview pane
   - Select "Export" → "PDF"
   - Or install "Markdown PDF" extension and use Command Palette

**Done!** ✅

---

## Automated Method (Command Line)

### One-time Setup:

```bash
# Install tools (choose one)
npm install -g @mermaid-js/mermaid-cli md-to-pdf
# OR
brew install pandoc  # macOS only
```

### Generate PDF:

```bash
node scripts/generate-hld-pdf.js
```

**Output:** `docs/mvp/hld.pdf`

---

## No Installation Method (Browser)

1. **Push to GitHub:**
   ```bash
   git add docs/mvp/hld.md
   git commit -m "Add HLD document"
   git push
   ```

2. **View on GitHub:**
   - Open the file on GitHub
   - GitHub automatically renders Mermaid diagrams

3. **Print to PDF:**
   - Press `Cmd/Ctrl+P`
   - Select "Save as PDF"
   - Adjust print settings

**Done!** ✅

---

## Troubleshooting

**Diagrams not showing?**
- VS Code: Install "Markdown Preview Mermaid Support" extension
- Browser: GitHub renders Mermaid automatically

**PDF quality issues?**
- Use the automated script for best results
- Adjust print settings in browser (scale, margins)

**Need help?**
- See `HLD_PDF_GENERATION.md` for detailed instructions
- Check [Mermaid Documentation](https://mermaid.js.org/)
