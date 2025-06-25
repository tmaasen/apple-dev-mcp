---
title: "Photo editing"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/photo-editing
id: universal-photo-editing
lastUpdated: 2025-06-25T18:32:36.402Z
extractionMethod: crawlee
qualityScore: 0.224
confidence: 0.324
contentLength: 1871
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "photo editing", "interface", "navigation", "ios", "ipad", "macos", "mac", "watchos"]
---
Skip Navigation
Photo editing
Photo-editing extensions let people modify photos and videos within the Photos app by applying filters or making other changes.

Edits are always saved in the Photos app as new files, safely preserving the original versions.

To access a photo editing extension, a photo must be in edit mode. While in edit mode, tapping the extension icon in the toolbar displays an action menu of available editing extensions. Selecting one displays the extension's interface in a modal view containing a top toolbar. Dismissing this view confirms and saves the edit, or cancels it and returns to the Photos app.

Best practices

Confirm cancellation of edits. Editing a photo or video can be time consuming. If someone taps the Cancel button, don't immediately discard their changes. Ask them to confirm that they really want to cancel, and inform them that any edits will be lost after cancellation. There's no need to show this confirmation if no edits have been made yet.

Don't provide a custom top toolbar. Your extension loads within a modal view that already includes a toolbar. Providing a second toolbar is confusing and takes space away from the content being edited.

Let people preview edits. It's hard to approve an edit if you can't see what it looks like. Let people see the result of their work before closing your extension and returning to the Photos app.

Use your app icon for your photo editing extension icon. This instills confidence that the extension is in fact provided by your app.

Platform considerations

No additional considerations for iOS, iPadOS, or macOS. Not supported in tvOS, visionOS, or watchOS.

Resources
Developer documentation

App extensions

PhotoKit

Videos
Introducing Photo Segmentation Mattes
Current page is Photo editing
Supported platforms
Photo editing
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/photo-editing

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
