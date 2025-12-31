# Icon Generation Guide

This guide explains how to regenerate the favicon.ico file for the PocketT project using the custom outline-only logo design.

## Overview

The project uses a custom PocketT logo design that gets converted to a multi-size ICO file for use as a favicon. The logo features a **clean outline-only folder icon with a blue stroke**, creating a minimal, professional appearance that's perfect for a document management application.

## Files Involved

- **Source Icon**: `frontend/public/folder-icon.svg` - The original SVG outline logo
- **Generated Favicon**: `frontend/public/favicon.ico` - Multi-size ICO file for browsers
- **Generated Logos**: `frontend/public/logo-*.png` and `frontend/public/logo-*.jpg` - PNG and JPG logo files for app branding
- **ICO Generation Script**: `scripts/generate_ico.py` - Python script to convert SVG to ICO
- **Logo Generation Script**: `scripts/generate_logo.py` - Python script to convert SVG to PNG and JPG
- **Dependencies**: `scripts/requirements.txt` - Python package requirements

## Logo Design

The favicon features a clean, outline-only design:

- **Style**: Outline-only folder icon with no fill
- **Color**: Blue stroke (#2563EB) for professional appearance
- **Stroke Width**: 2px for clear visibility at all sizes
- **Design**: Minimal, modern aesthetic that scales beautifully

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Step-by-Step Instructions

### 1. Install Python Dependencies

**Recommended: Using Virtual Environment (for macOS Python 3.12+)**

```bash
# Navigate to project root
cd /path/to/pockett-docs

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install -r scripts/requirements.txt
```

**Alternative: Direct Installation (if system allows)**

```bash
# Navigate to project root
cd /path/to/pockett-docs

# Install required packages
pip3 install --user -r scripts/requirements.txt
```

**Required packages:**
- `cairosvg` - For SVG to PNG conversion
- `Pillow` - For image processing and ICO creation

**Note:** After creating the virtual environment, you'll need to activate it (`source venv/bin/activate`) each time before running the generation scripts.

### 2. Modify the Source Logo (Optional)

If you want to change the logo design, edit `frontend/public/folder-icon.svg`:

```bash
# Edit the SVG file
nano frontend/public/folder-icon.svg
# or use your preferred editor
code frontend/public/folder-icon.svg
```

**Current logo features:**
- Outline-only folder design with no fill
- Blue stroke color (#2563EB)
- 2px stroke width for clarity
- 32x32 viewBox for crisp rendering

### 3. Generate the ICO File

```bash
# Activate virtual environment (if using one)
source venv/bin/activate  # Skip if not using venv

# Run the generation script
python scripts/generate_ico.py
```

**What the script does:**
1. Converts SVG to PNG at multiple sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
2. Combines all PNGs into a single ICO file
3. Cleans up temporary PNG files
4. Outputs the final `favicon.ico` file

### 4. Generate Logo Files (PNG & JPG) for Google Cloud Console

For Google Cloud Console consent screen upload, you need logo files that meet these requirements:
- **Size**: 120px by 120px (square) for best results
- **File size**: Not larger than 1 MB
- **Formats**: JPG, PNG, or BMP

```bash
# Activate virtual environment (if using one)
source venv/bin/activate  # Skip if not using venv

# Run the logo generation script
python scripts/generate_logo.py
```

**What the script does:**
1. Converts SVG to PNG at 120x120 pixels (Google's recommended size)
2. Optimizes PNG file size to stay under 1 MB
3. Converts PNG to JPG format (with white background for transparency)
4. Optimizes JPG quality to ensure file stays under 1 MB
5. Reports file sizes for verification

**Generated files:**
- `logo-120x120.png` - PNG format at 120x120 pixels (optimized, < 1 MB)
- `logo-120x120.jpg` - JPG format at 120x120 pixels (optimized, < 1 MB)

**Google Cloud Console Requirements:**
- ✓ Square logo: 120px by 120px
- ✓ Formats: PNG and JPG (both generated)
- ✓ File size: Optimized to stay under 1 MB

### 5. Verify the Results

```bash
# Check that the ICO file was created
ls -la frontend/public/favicon.ico

# Check that logo files were created
ls -la frontend/public/logo-*.png frontend/public/logo-*.jpg

# Test the favicon in a browser
open frontend/public/test-favicon.html
```

## Troubleshooting

### Common Issues

**1. Missing Dependencies**
```bash
# If you get import errors, reinstall packages
pip install --upgrade cairosvg Pillow
```

**2. Permission Errors**
```bash
# Use user installation if system-wide fails
pip install --user -r scripts/requirements.txt
```

**3. Python Version Issues**
```bash
# Check your Python version
python --version

# Use specific Python version if needed
python3.9 scripts/generate_ico.py
```

**4. Virtual Environment (Recommended)**
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r scripts/requirements.txt
python scripts/generate_ico.py
deactivate
rm -rf venv  # Clean up
```

### Alternative Methods

If the Python script fails, you can use online tools:

1. **Convert SVG to PNG**: Use tools like Inkscape, GIMP, or online converters
2. **Convert PNG to ICO**: Use online ICO converters or tools like ImageMagick
3. **Manual Creation**: Use icon editors like IcoFX or similar applications

## Customization Options

### Changing Logo Colors

Edit the SVG file to modify the stroke color:

```xml
<!-- Change the stroke color -->
<g stroke="#YOUR_COLOR" stroke-width="2" fill="none">
  <!-- Your icon path here -->
</g>
```

### Modifying the Icon

You can change the folder icon to other outline symbols:

```xml
<!-- Replace the folder path with other outline icons -->
<path d="M2 6C2 4.89543 2.89543 4 4 4H12L14 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z"/>
```

### Adjusting Stroke Width

Modify the stroke width for different visual effects:

```xml
<!-- Change stroke width -->
<g stroke="#2563EB" stroke-width="1" fill="none">  <!-- Thinner lines -->
<g stroke="#2563EB" stroke-width="3" fill="none">  <!-- Thicker lines -->
```

### Adding Different Logo Styles

You can create multiple SVG files and modify the script to generate different favicons:

```bash
# Create different logo variants
cp frontend/public/folder-icon.svg frontend/public/logo-thin.svg
cp frontend/public/folder-icon.svg frontend/public/logo-thick.svg

# Modify the script to handle multiple logos
# Edit scripts/generate_ico.py
```

## Integration

### Adding to HTML

Include the favicon in your HTML head section:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
```

### Next.js Integration

For Next.js projects, you can also place the favicon in the `app` directory:

```bash
# Copy to Next.js app directory (if using app router)
cp frontend/public/favicon.ico frontend/app/favicon.ico
```

## Maintenance

### When to Regenerate

- **Design Changes**: After modifying the SVG logo
- **Size Updates**: If you need different favicon sizes
- **Format Changes**: If switching from ICO to other formats
- **Brand Updates**: When updating company/project branding
- **Style Changes**: When updating the outline design or colors

### Version Control

```bash
# Add generated files to git
git add frontend/public/favicon.ico
git add frontend/public/folder-icon.svg

# Don't commit temporary PNG files (they're auto-generated)
git add scripts/generate_ico.py
git add scripts/generate_logo.py
git add scripts/requirements.txt
```

## Performance Notes

- **File Size**: The current ICO is optimized for web performance
- **Loading Speed**: Small favicon size ensures fast page loading
- **Browser Caching**: ICO files are typically cached well by browsers
- **Design Benefits**: Outline-only design is clean and professional
- **Scalability**: Looks crisp at all sizes due to vector-based design

## Support

If you encounter issues:

1. Check the Python error messages for specific details
2. Verify all dependencies are installed correctly
3. Ensure the SVG file is valid and well-formed
4. Check file permissions in the output directory
5. Verify the outline design meets your requirements

---

**Last Updated**: August 2024  
**Generated Logo**: PocketT outline-only folder icon  
**File Size**: Optimized for web performance  
**Supported Sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 pixels  
**Design Style**: Clean, minimal outline-only aesthetic
