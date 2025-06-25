---
title: "Status bars"
platform: universal
category: status
url: https://developer.apple.com/design/human-interface-guidelines/status-bars
id: universal-status-bars
lastUpdated: 2025-06-25T18:33:49.174Z
extractionMethod: crawlee
qualityScore: 0.297
confidence: 0.497
contentLength: 1941
hasCodeExamples: false
hasImages: false
keywords: ["universal", "status", "status bars", "color", "controls", "interface", "navigation", "ios", "ipad", "macos"]
---
Skip Navigation
Status bars
A status bar appears along the upper edge of the screen and displays information about the device's current state, like the time, cellular carrier, and battery level.

Best practices

Obscure content under the status bar. By default, the background of the status bar is transparent, allowing content beneath to show through. This can make it difficult to see the information presented in the status bar. If controls are visible behind the status bar, people may attempt to interact with them and be unable to do so. Be sure to keep the status bar readable and don't imply that content behind it is interactive. There are several common techniques for doing this:

Use a top toolbar that automatically displays a status bar background.

Display a custom image, like a gradient or solid color, behind the status bar.

Place a blurred view behind the status bar. For developer guidance, see UIBlurEffect.

Consider temporarily hiding the status bar when displaying full-screen media. A status bar can be distracting when people are paying attention to media. Temporarily hide these elements to provide a more immersive experience. The Photos app, for example, hides the status bar and other interface elements when people browse full-screen photos.

Avoid permanently hiding the status bar. Without a status bar, people have to leave your app to check the time or see if they have a Wi-Fi connection. Let people redisplay a hidden status bar with a simple, discoverable gesture. For example, when browsing full-screen photos in the Photos app, a single tap shows the status bar again.

Platform considerations

No additional considerations for iOS or iPadOS. Not supported in macOS, tvOS, visionOS, or watchOS.

Resources
Developer documentation

UIStatusBarStyle -- UIKit

preferredStatusBarStyle -- UIKit

Current page is Status bars
Supported platforms
Status bars
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/status-bars

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
