---
title: "Image views"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/image-views
id: universal-image-views
lastUpdated: 2025-06-25T18:34:47.820Z
extractionMethod: crawlee
qualityScore: 0.491
confidence: 0.691
contentLength: 3429
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "image views", "animation", "buttons", "color", "icons", "images", "interface", "navigation"]
---
Skip Navigation
Image views
An image view displays a single image -- or in some cases, an animated sequence of images -- on a transparent or opaque background.

Within an image view, you can stretch, scale, size to fit, or pin the image to a specific location. Image views are typically not interactive.

Best practices

Use an image view when the primary purpose of the view is simply to display an image. In rare cases where you might want an image to be interactive, configure a system-provided button to display the image instead of adding button behaviors to an image view.

If you want to display an icon in your interface, consider using a symbol or interface icon instead of an image view. SF Symbols provides a large library of streamlined, vector-based images that you can render with various colors and opacities. An icon (also called a glyph or template image) is typically a bitmap image in which the nontransparent pixels can receive color. Both symbols and interface icons can use the accent colors people choose.

Content

An image view can contain rich image data in various formats, like PNG, JPEG, and PDF. For more guidance, see Images.

Take care when overlaying text on images. Compositing text on top of images can decrease both the clarity of the image and the legibility of the text. To help improve the results, ensure the text contrasts well with the image, and consider ways to make the text object stand out, like adding a text shadow or background layer.

Aim to use a consistent size for all images in an animated sequence. When you prescale images to fit the view, the system doesn't have to perform any scaling. In cases where the system must do the scaling, performance is generally better when all images are the same size and shape.

Platform considerations

No additional considerations for iOS or iPadOS.

macOS

If your app needs an editable image view, use an image well. An image well is an image view that supports copying, pasting, dragging, and using the Delete key to clear its content.

Use an image button instead of an image view to make a clickable image. An image button contains an image or icon, appears in a view, and initiates an instantaneous app-specific action.

tvOS

Many tvOS images combine multiple layers with transparency to create a feeling of depth. For guidance, see Layered images.

visionOS

You can add the appearance of depth to image views in a standard window to give your content more visual substance and improve the experience when people view it from an angle. If you display 3D content in a standard window, the system clips it when it extends too far from the window's surface; for guidance, see Windows.

If you want to display true 3D content, use a volume; for guidance, see visionOS volumes.

watchOS

Use SwiftUI to create animations when possible. Alternatively, you can use WatchKit to animate a sequence of images within an image element if necessary. For developer guidance, see WKImageAnimatable.

Resources
Related

Images

Image wells

Image buttons

SF Symbols

Developer documentation

Image -- SwiftUI

UIImageView -- UIKit

NSImageView -- AppKit

Videos
Support HDR images in your app
Add rich graphics to your SwiftUI app
Change log

Date

Changes

June 21, 2023

Updated to include guidance for visionOS.

Current page is Image views
Supported platforms
Image views
Best practices
Content
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/image-views

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
