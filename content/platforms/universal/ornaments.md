---
title: "Ornaments"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/ornaments
id: universal-ornaments
lastUpdated: 2025-06-25T18:33:23.518Z
extractionMethod: crawlee
qualityScore: 0.482
confidence: 0.682
contentLength: 3249
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "ornaments", "buttons", "controls", "design", "interface", "layout", "navigation", "system"]
---
Skip Navigation
Ornaments
In visionOS, an ornament presents controls and information related to a window, without crowding or obscuring the window's contents.

An ornament floats in a plane that's parallel to its associated window and slightly in front of it along the z-axis. If the associated window moves, the ornament moves with it, maintaining its relative position; if the window's contents scroll, the controls or information in the ornament remain unchanged.

Ornaments can appear on any edge of a window and can contain UI components like buttons, segmented controls, and other views. The system uses ornaments to create and manage components like toolbars, tab bars, and video playback controls; you can use an ornament to create a custom component.

Best practices

Consider using an ornament to present frequently needed controls or information in a consistent location that doesn't clutter the window. Because an ornament stays close to its window, people always know where to find it. For example, Music uses an ornament to offer Now Playing controls, ensuring that these controls remain in a predictable location that's easy to find.

In general, keep an ornament visible. It can make sense to hide an ornament when people dive into a window's content -- for example, when they watch a video or view a photo -- but in most cases, people appreciate having consistent access to an ornament's controls.

If you need to display multiple ornaments, prioritize the overall visual balance of the window. Ornaments help elevate important actions, but they can sometimes distract from your content. When necessary, consider constraining the total number of ornaments to avoid increasing a window's visual weight and making your app feel more complicated. If you decide to remove an ornament, you can relocate its elements into the main window.

Aim to keep an ornament's width the same or narrower than the width of the associated window. If an ornament is wider than its window, it can interfere with a tab bar or other vertical content on the window's side.

Consider using borderless buttons in an ornament. By default, an ornament's background is glass, so if you place a button directly on the background, it may not need a visible border. When people look at a borderless button in an ornament, the system automatically applies the hover affect to it (for guidance, see Eyes).

Use system-provided toolbars and tab bars unless you need to create custom components. In visionOS, toolbars and tab bars automatically appear as ornaments, so you don't need to use an ornament to create these components. For developer guidance, see Toolbars and TabView.

Platform considerations

Not supported in iOS, iPadOS, macOS, tvOS, or watchOS.

Resources
Related

Layout

Toolbars

Developer documentation

ornament(visibility:attachmentAnchor:contentAlignment:ornament:) -- SwiftUI

Videos
Design for spatial user interfaces
Change log

Date

Changes

February 2, 2024

Added guidance on using multiple ornaments.

December 5, 2023

Removed a statement about using ornaments to present supplementary items.

June 21, 2023

New page.

Current page is Ornaments
Supported platforms
Ornaments
Best practices
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/ornaments

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
