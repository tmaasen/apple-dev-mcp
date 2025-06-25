---
title: "Images"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/images
id: universal-images
lastUpdated: 2025-06-25T18:28:51.876Z
extractionMethod: crawlee
qualityScore: 0.640
confidence: 0.840
contentLength: 9670
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "images", "animation", "color", "design", "icons", "interface", "layout", "motion"]
---
## Summary

Skip Navigation
Images
To make sure your artwork looks great on all devices you support, learn how the system displays content and how to deliver art at the appropriate scale factors.

Skip Navigation
Images
To make sure your artwork looks great on all devices you support, learn how the system displays content and how to deliver art at the appropriate scale factors.

Resolution

Different devices can display images at different resolutions. For example, a 2D device displays images according to the resolution of its screen.

A point is an abstract unit of measurement that helps visual content remain consistent regardless of how it's displayed. In 2D platforms, a point maps to a number of pixels that can vary according to the resolution of the display; in visionOS, a point is an angular value that allows visual content to scale according to its distance from the viewer.

When creating bitmap images, you specify a scale factor which determines the resolution of an image. You can visualize scale factor by considering the density of pixels per point in 2D displays of various resolutions. For example, a scale factor of 1 (also called @1x) describes a 1:1 pixel density, where one pixel is equal to one point. High-resolution 2D displays have higher pixel densities, such as 2:1 or 3:1. A 2:1 density (called @2x) has a scale factor of 2, and a 3:1 density (called @3x) has a scale factor of 3. Because of higher pixel densities, high-resolution displays demand images with more pixels.

1x (10x10 px)

2x (20x20 px)

3x (30x30 px)

Provide high-resolution assets for all bitmap images in your app, for every device you support. As you add each image to your project's asset catalog, identify its scale factor by appending "@1x," "@2x," or "@3x" to its filename. Use the following values for guidance; for additional scale factors, see Layout.

Platform

Scale factors

iPadOS, watchOS

@2x

iOS

@2x and @3x

visionOS

@2x or higher (see visionOS)

macOS, tvOS

@1x and @2x

In general, design images at the lowest resolution and scale them up to create high-resolution assets. When you use resizable vectorized shapes, you might want to position control points at whole values so that they're cleanly aligned at 1x. This positioning allows the points to remain cleanly aligned to the raster grid at higher resolutions, because 2x and 3x are multiples of 1x.

Formats

As you create different types of images, consider the following recommendations.

Image type

Format

Bitmap or raster work

De-interlaced PNG files

PNG graphics that don't require full 24-bit color

An 8-bit color palette

Photos

JPEG files, optimized as necessary, or HEIC files

Flat icons, interface icons, and other flat artwork that requires high-resolution scaling

PDF or SVG files

Best practices

Include a color profile with each image. Color profiles help ensure that your app's colors appear as intended on different displays. For guidance, see Color management.

Always test images on a range of actual devices. An image that looks great at design time may appear pixelated, stretched, or compressed when viewed on various devices.

Platform considerations

No additional considerations for iOS, iPadOS, or macOS.

tvOS

Layered images are at the heart of the Apple TV user experience. The system combines layered images, transparency, scaling, and motion to produce a sense of realism and vigor that evokes a personal connection as people interact with onscreen content.

Parallax effect

Parallax is a subtle visual effect the system uses to convey depth and dynamism when an element is in focus. As an element comes into focus, the system elevates it to the foreground, gently swaying it while applying illumination that makes the element's surface appear to shine. After a period of inactivity, out-of-focus content dims and the focused element expands.

Layered images are required to support the parallax effect.

Play
Layered images

A layered image consists of two to five distinct layers that come together to form a single image. The separation between layers, along with use of transparency, creates a feeling of depth. As someone interacts with an image, layers closer to the surface elevate and scale, overlapping lower layers farther back and producing a 3D effect.

Important

Your tvOS app icon must use a layered image. For other focusable images in your app, including Top Shelf images, layered images are strongly encouraged, but optional.

You can embed layered images in your app or retrieve them from a content server at runtime. For guidance on adding layered images to your app, see the Parallax Previewer User Guide.

Developer note

If your app retrieves layered images from a content server at runtime, you must provide runtime layered images (.lcr). You can generate them from LSR files or Photoshop files using the layerutil command-line tool that Xcode provides. Runtime layered images are intended to be downloaded -- don't embed them in your app.

Use standard interface elements to display layered images. If you use standard views and system-provided focus APIs -- such as FocusState -- layered images automatically get the parallax treatment when people bring them into focus.

Identify logical foreground, middle, and background elements. In foreground layers, display prominent elements like a character in a game, or text on an album cover or movie poster. Middle layers are perfect for secondary content and effects like shadows. Background layers are opaque backdrops that showcase the foreground and middle layers without upstaging them.

Generally, keep text in the foreground. Unless you want to obscure text, bring it to the foreground layer for clarity.

Keep the background layer opaque. Using varying levels of opacity to let content shine through higher layers is fine, but your background layer must be opaque -- you'll get an error if it's not. An opaque background layer ensures your artwork looks great with parallax, drop shadows, and system backgrounds.

Keep layering simple and subtle. Parallax is designed to be almost unnoticeable. Excessive 3D effects can appear unrealistic and jarring. Keep depth simple to bring your content to life and add delight.

Leave a safe zone around the foreground layers of your image. When focused, content on some layers may be cropped as the layered image scales and moves. To ensure that essential content is always visible, keep it within a safe zone. For guidance, see App icons.

Always preview layered images. To ensure your layered images look great on Apple TV, preview them throughout your design process using Xcode, the Parallax Previewer app for macOS, or the Parallax Exporter plug-in for Adobe Photoshop. Pay special attention as scaling and clipping occur, and readjust your images as needed to keep important content safe. After your layered images are final, preview them on an actual TV for the most accurate representation of what people will see. To download Parallax Previewer and Parallax Exporter, see Resources.

visionOS

In visionOS, the area an image occupies typically varies when the system dynamically scales it according to the distance and angle at which people view it. This means that an image doesn't line up 1:1 with screen pixels as it can in other platforms.

Create a layered app icon. App icons in visionOS are composed of two to three layers that provide the appearance of depth by moving at subtly different rates when the icon is in focus. For guidance, see visionOS app icons.

Prefer vector-based art. Avoid bitmap content because it might not look good when the system scales it up. If you use Core Animation layers, see Drawing sharp layer-based content in visionOS for developer guidance.

If you need to use rasterized images, balance quality with performance as you choose a resolution. Although a @2x image looks fine at common viewing distances, its fixed resolution means that the system doesn't dynamically scale it and it might not look sharp from close up. To help a rasterized image look sharp when people view it from a wide range of distances, you can use a higher resolution, but each increase in resolution results in a larger file size and may impact your app's runtime performance, especially for resolutions over @6x. If you use images that have resolutions higher than @2x, be sure to also apply high-quality image filtering to help balance quality and performance (for developer guidance, see filters).

watchOS

In general, avoid transparency to keep image files small. If you always composite an image on the same solid background color, it's more efficient to include the background in the image. However, transparency is necessary in complication images, menu icons, and other interface icons that serve as template images, because the system uses it to determine where to apply color.

Use autoscaling PDFs to let you provide a single asset for all screen sizes. Design your image for the 40mm and 42mm screens at 2x. When you load the PDF, WatchKit automatically scales the image based on the device's screen size, using the values shown below:

Screen size

Image scale

38mm

90%

40mm

100%

41mm

106%

42mm

100%

44mm

110%

45mm

119%

49mm

119%

Resources
Related

Apple Design Resources

Developer documentation

Drawing sharp layer-based content in visionOS -- visionOS

Images -- SwiftUI

UIImageView -- UIKit

NSImageView -- AppKit

Videos
Support HDR images in your app
Get Started with Display P3
Change log

Date

Changes

December 5, 2023

Clarified guidance on choosing a resolution for a rasterized image in a visionOS app.

June 21, 2023

Updated to include guidance for visionOS.

September 14, 2022

Added specifications for Apple Watch Ultra.

Current page is Images
Supported platforms
Images
Resolution
Formats
Best practices
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/images

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
