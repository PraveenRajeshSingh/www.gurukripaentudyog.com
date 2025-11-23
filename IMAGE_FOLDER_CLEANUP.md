# Image Folder Cleanup & Organization

## 📁 Current Images in `assets/resources/img/`

### ✅ Images Currently Used
1. **logo-new.svg** - Main logo (used in navigation, loader)
2. **favicon.ico** - Site favicon
3. **gurukripaLogo.jpg** - Logo fallback
4. **jaunpurPul.jpg** - Jaunpur city image (used in cities section)
5. **Varanasi.png** - Varanasi city image (used in cities section)
6. **trilochan.jpg** - Trilochan city image (used in cities section)
7. **jalalpur.jpg** - Jalalpur city image (used in cities section)

### ⚠️ Potentially Unused Images
1. **brick.jpeg** - May be used in products (check)
2. **gurukripaEnt.jpg** - May be duplicate/unused
3. **gurukripaEnt1.png** - May be duplicate/unused
4. **gurukripaEnt2.png** - May be duplicate/unused
5. **gurukripaLogoNoBg.jpg** - Alternative logo (keep as backup)
6. **parasLogoNoBg.jpg** - May be old/unused logo
7. **newbricks_2.jpg** - May be used in products
8. **newparasbrick2.jpg** - May be used in products
9. **redbrick1.jpg** - May be used in products
10. **redbricks.jpg** - May be used in products
11. **Naveen_Singh.jpeg** - Team member photo (may be used in about)
12. **Vishal_Singh.jpeg** - Team member photo (may be used in about)

## 🎯 Recommendations

### Keep These (Essential)
- logo-new.svg
- favicon.ico
- gurukripaLogo.jpg (fallback)
- All city images (jaunpurPul.jpg, Varanasi.png, trilochan.jpg, jalalpur.jpg)

### Review & Potentially Remove
- gurukripaEnt.jpg (if duplicate)
- gurukripaEnt1.png (if duplicate)
- gurukripaEnt2.png (if duplicate)
- parasLogoNoBg.jpg (if not used)

### Convert to WebP
- All .jpg and .png images should be converted to WebP for better performance
- Keep originals as fallback

## 📝 Action Items

1. ✅ Check which product images are actually used
2. ✅ Convert images to WebP format
3. ✅ Create optimized versions (different sizes)
4. ✅ Remove truly unused images
5. ✅ Organize into subfolders (logos, cities, products, team)

## 🗂️ Suggested Folder Structure

```
assets/resources/img/
├── logos/
│   ├── logo-new.svg
│   ├── logo-light.svg
│   ├── logo-dark.svg
│   └── favicon.ico
├── cities/
│   ├── jaunpur.webp
│   ├── varanasi.webp
│   ├── trilochan.webp
│   └── jalalpur.webp
├── products/
│   ├── product-1.webp
│   └── product-2.webp
└── team/
    ├── naveen.webp
    └── vishal.webp
```

