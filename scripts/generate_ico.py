#!/usr/bin/env python3
"""
Script to convert SVG folder icon to ICO file with multiple sizes.
Requires: cairosvg, Pillow
"""

import os
import sys
from pathlib import Path

try:
    from cairosvg import svg2png
    from PIL import Image
except ImportError as e:
    print(f"Missing required library: {e}")
    print("Please install required packages:")
    print("pip install cairosvg Pillow")
    sys.exit(1)

def svg_to_png(svg_path, png_path, size):
    """Convert SVG to PNG at specified size"""
    try:
        with open(str(svg_path), 'rb') as svg_file:
            svg2png(file_obj=svg_file, write_to=str(png_path), output_width=size, output_height=size)
        return True
    except Exception as e:
        print(f"Error converting SVG to PNG at size {size}: {e}")
        return False

def create_ico_from_pngs(png_files, ico_path):
    """Create ICO file from multiple PNG files"""
    try:
        images = []
        for png_file in png_files:
            if os.path.exists(png_file):
                img = Image.open(png_file)
                images.append(img)
        
        if images:
            images[0].save(str(ico_path), format='ICO', sizes=[(img.width, img.height) for img in images])
            print(f"ICO file created successfully: {ico_path}")
            return True
        else:
            print("No PNG files found to create ICO")
            return False
    except Exception as e:
        print(f"Error creating ICO file: {e}")
        return False

def main():
    # Get project root directory
    project_root = Path(__file__).parent.parent
    svg_path = project_root / "frontend" / "public" / "folder-icon.svg"
    output_dir = project_root / "frontend" / "public"
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if SVG exists
    if not svg_path.exists():
        print(f"SVG file not found: {svg_path}")
        sys.exit(1)
    
    print(f"Converting SVG: {svg_path}")
    
    # Define sizes for ICO file (standard favicon sizes)
    sizes = [16, 32, 48, 64, 128, 256]
    png_files = []
    
    # Convert SVG to PNG at each size
    for size in sizes:
        png_path = output_dir / f"folder-icon-{size}.png"
        print(f"Creating {size}x{size} PNG...")
        
        if svg_to_png(svg_path, png_path, size):
            png_files.append(str(png_path))
            print(f"  ✓ Created {png_path}")
        else:
            print(f"  ✗ Failed to create {png_path}")
    
    # Create ICO file
    if png_files:
        ico_path = output_dir / "favicon.ico"
        print(f"\nCreating ICO file: {ico_path}")
        
        if create_ico_from_pngs(png_files, ico_path):
            print("\n✅ ICO file generation completed successfully!")
            print(f"ICO file: {ico_path}")
            
            # Clean up temporary PNG files
            print("\nCleaning up temporary PNG files...")
            for png_file in png_files:
                try:
                    os.remove(png_file)
                    print(f"  ✓ Removed {png_file}")
                except Exception as e:
                    print(f"  ✗ Failed to remove {png_file}: {e}")
        else:
            print("\n❌ Failed to create ICO file")
            sys.exit(1)
    else:
        print("\n❌ No PNG files were created successfully")
        sys.exit(1)

if __name__ == "__main__":
    main()
