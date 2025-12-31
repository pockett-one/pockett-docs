#!/usr/bin/env python3
"""
Script to convert SVG folder icon to PNG and JPG logo files for Google Cloud App Branding verification.
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

def png_to_jpg(png_path, jpg_path, quality=95, max_size_mb=1.0):
    """Convert PNG to JPG with specified quality, optimizing to stay under max_size_mb"""
    try:
        # Open PNG image
        img = Image.open(png_path)
        
        # Convert RGBA to RGB if necessary (JPG doesn't support transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Try to save with initial quality
        img.save(str(jpg_path), 'JPEG', quality=quality, optimize=True)
        
        # Check file size and reduce quality if needed
        file_size_mb = os.path.getsize(jpg_path) / (1024 * 1024)
        current_quality = quality
        
        # Reduce quality if file is too large
        while file_size_mb > max_size_mb and current_quality > 50:
            current_quality -= 5
            img.save(str(jpg_path), 'JPEG', quality=current_quality, optimize=True)
            file_size_mb = os.path.getsize(jpg_path) / (1024 * 1024)
        
        return True
    except Exception as e:
        print(f"Error converting PNG to JPG: {e}")
        return False

def optimize_png(png_path, max_size_mb=1.0):
    """Optimize PNG file size if it exceeds max_size_mb"""
    try:
        file_size_mb = os.path.getsize(png_path) / (1024 * 1024)
        
        if file_size_mb > max_size_mb:
            # Open and re-save with optimization
            img = Image.open(png_path)
            # Save with optimization flags
            img.save(str(png_path), 'PNG', optimize=True, compress_level=9)
            new_size_mb = os.path.getsize(png_path) / (1024 * 1024)
            
            # If still too large, we might need to reduce quality further
            # For PNG, we can't easily reduce quality, so we'll just report it
            if new_size_mb > max_size_mb:
                print(f"    ⚠️  Warning: PNG file size ({new_size_mb:.2f} MB) exceeds {max_size_mb} MB limit")
        
        return True
    except Exception as e:
        print(f"Error optimizing PNG: {e}")
        return False

def get_file_size_mb(file_path):
    """Get file size in MB"""
    try:
        return os.path.getsize(file_path) / (1024 * 1024)
    except:
        return 0

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
    print("=" * 60)
    
    # Google Cloud Console requirements:
    # - Square logo: 120px by 120px for best results
    # - Not larger than 1 MB
    # - Formats: JPG, PNG, BMP
    primary_size = 120  # Google's recommended size
    max_file_size_mb = 1.0
    
    print(f"\nGenerating {primary_size}x{primary_size} logo files for Google Cloud Console...")
    print(f"Target: Files under {max_file_size_mb} MB")
    print("-" * 60)
    
    success_count = 0
    total_files = 2  # PNG and JPG
    
    # Generate PNG
    png_path = output_dir / f"logo-{primary_size}x{primary_size}.png"
    print(f"\nCreating PNG: {png_path.name}")
    
    if svg_to_png(svg_path, png_path, primary_size):
        # Optimize PNG file size
        optimize_png(png_path, max_file_size_mb)
        png_size_mb = get_file_size_mb(png_path)
        print(f"    ✓ Created {png_path.name} ({png_size_mb:.3f} MB)")
        if png_size_mb > max_file_size_mb:
            print(f"    ⚠️  Warning: File exceeds {max_file_size_mb} MB limit")
        success_count += 1
        
        # Generate JPG from PNG
        jpg_path = output_dir / f"logo-{primary_size}x{primary_size}.jpg"
        print(f"\nCreating JPG: {jpg_path.name}")
        
        if png_to_jpg(png_path, jpg_path, quality=90, max_size_mb=max_file_size_mb):
            jpg_size_mb = get_file_size_mb(jpg_path)
            print(f"    ✓ Created {jpg_path.name} ({jpg_size_mb:.3f} MB)")
            if jpg_size_mb > max_file_size_mb:
                print(f"    ⚠️  Warning: File exceeds {max_file_size_mb} MB limit")
            success_count += 1
        else:
            print(f"    ✗ Failed to create {jpg_path}")
    else:
        print(f"    ✗ Failed to create {png_path}")
    
    # Summary
    print("\n" + "=" * 60)
    if success_count == total_files:
        print(f"\n✅ Logo generation completed successfully!")
        print(f"\nGenerated files:")
        if png_path.exists():
            png_size = get_file_size_mb(png_path)
            print(f"  - {png_path.name} ({png_size:.3f} MB)")
        if jpg_path.exists():
            jpg_size = get_file_size_mb(jpg_path)
            print(f"  - {jpg_path.name} ({jpg_size:.3f} MB)")
        print(f"\nOutput directory: {output_dir}")
        print("\n✅ These files are ready for Google Cloud Console consent screen upload.")
        print("   Requirements met:")
        print("   ✓ Square logo: 120px by 120px")
        print("   ✓ Formats: PNG and JPG")
        print("   ✓ File size: Optimized to stay under 1 MB")
    else:
        print(f"\n⚠️  Logo generation completed with some errors.")
        print(f"Successfully generated {success_count} out of {total_files} file(s).")
        sys.exit(1)

if __name__ == "__main__":
    main()

