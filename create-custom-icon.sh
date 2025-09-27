#!/bin/bash

# YouTube Music Downloader Pro - Custom Icon Creator
# This script converts your custom icon to all required formats

echo "🎵 YouTube Music Downloader Pro - Icon Creator"
echo "=============================================="

# Check if source icon exists
if [ ! -f "source-icon-1024.png" ]; then
    echo "❌ Error: source-icon-1024.png not found!"
    echo ""
    echo "📋 Instructions:"
    echo "1. Save your custom icon design as 'source-icon-1024.png'"
    echo "2. Make sure it's exactly 1024x1024 pixels"
    echo "3. Place it in the project root directory"
    echo "4. Run this script again"
    echo ""
    echo "💡 Your icon should have:"
    echo "   - Size: 1024x1024 pixels"
    echo "   - Format: PNG with transparency (if needed)"
    echo "   - Square aspect ratio"
    exit 1
fi

echo "✅ Found source icon: source-icon-1024.png"

# Create backup of existing icons
echo "📦 Creating backup of existing icons..."
cp -r assets backup-assets-$(date +%Y%m%d-%H%M%S)

# Create new iconset directory
echo "🔧 Creating new iconset..."
rm -rf assets/icon.iconset
mkdir -p assets/icon.iconset

# Generate all required sizes using sips
echo "🎨 Generating icon sizes..."

# Standard sizes
sips -z 16 16 source-icon-1024.png --out assets/icon.iconset/icon_16x16.png
sips -z 32 32 source-icon-1024.png --out assets/icon.iconset/icon_16x16@2x.png
sips -z 32 32 source-icon-1024.png --out assets/icon.iconset/icon_32x32.png
sips -z 64 64 source-icon-1024.png --out assets/icon.iconset/icon_32x32@2x.png
sips -z 128 128 source-icon-1024.png --out assets/icon.iconset/icon_128x128.png
sips -z 256 256 source-icon-1024.png --out assets/icon.iconset/icon_128x128@2x.png
sips -z 256 256 source-icon-1024.png --out assets/icon.iconset/icon_256x256.png
sips -z 512 512 source-icon-1024.png --out assets/icon.iconset/icon_256x256@2x.png
sips -z 512 512 source-icon-1024.png --out assets/icon.iconset/icon_512x512.png
cp source-icon-1024.png assets/icon.iconset/icon_512x512@2x.png

# Create ICNS file
echo "🍎 Creating ICNS file for macOS..."
iconutil -c icns assets/icon.iconset -o assets/icon.icns

# Create ICO file for Windows (using sips to create a 256x256 version)
echo "🪟 Creating ICO file for Windows..."
sips -z 256 256 source-icon-1024.png --out temp-icon-256.png
sips -s format ico temp-icon-256.png --out assets/icon.ico
rm temp-icon-256.png

# Create PNG for Linux
echo "🐧 Creating PNG file for Linux..."
sips -z 512 512 source-icon-1024.png --out assets/icon.png

# Update SVG if needed (placeholder)
echo "📝 Updating SVG..."
cp source-icon-1024.png assets/icon-source.png

echo ""
echo "✅ Icon conversion complete!"
echo ""
echo "📋 Files created:"
echo "   - assets/icon.icns (macOS)"
echo "   - assets/icon.ico (Windows)"
echo "   - assets/icon.png (Linux)"
echo "   - assets/icon.iconset/ (all sizes)"
echo ""
echo "🎯 Next steps:"
echo "1. Build your app: npm run build:mac-universal"
echo "2. Test the new icon in the built application"
echo "3. Check DMG appearance with new icon"
echo ""
echo "🎵 Your custom YouTube Music Downloader Pro icon is ready!"