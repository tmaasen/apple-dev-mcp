---
title: "Always On"
platform: watchOS
category: foundations
url: https://developer.apple.com/design/human-interface-guidelines/always-on
id: always-on-watchos
lastUpdated: 2025-06-26T23:28:08.069Z
extractionMethod: enhanced-turndown
qualityScore: 0.800
confidence: 1.000
contentLength: 3636
structureScore: 0.500
cleaningScore: 0.110
hasCodeExamples: false
hasImages: false
keywords: ["always", "devices", "that", "include", "display", "system", "continue", "app", "interface", "when"]
---
## Overview

Always On On devices that include the Always On display, the system can continue to display an app’s interface when people suspend their interactions with the device. In the Always On state, a device can continue to give people useful, glanceable information in a low-power, privacy-preserving way by dimming the display and minimizing onscreen motion. The system can display different items depending on the device. On iPhone 14 Pro and iPhone 14 Pro Max, the system displays Lock Screen items like Widgets and Live Activities when people set aside their device face up and stop interacting with it. When people drop their wrist while wearing Apple Watch, the system dims the watch face, continuing to display the interface of the app as long as it’s either frontmost or running a background session. On both devices, the system displays notifications while in Always On, and people can tap the display to exit Always On and resume interactions. Best practices Hide sensitive information. It’s crucial to redact personal information that people wouldn’t want casual observers to view, like bank balances or health data. You also need to hide personal information that might be visible in a notification; for guidance, see Notifications. Keep other types of personal information glanceable when it makes sense. On Apple Watch, for example, people typically appreciate getting pace and heart rate updates while they’re working out; on iPhone, people appreciate getting a glanceable update on a flight arrival or a notification when a ride-sharing service arrives. If people don’t want any information to be visible, they can turn off Always On. Keep important content legible and dim nonessential content. You can increase dimming on secondary text, images, and color fills to give more prominence to the information that’s important to people. For example, a to-do list app might remove row backgrounds and dim each item’s additional details to highlight its title. Also, if you display rich images or large areas of color, consider removing the images and using dimmed colors. Maintain a consistent layout. Avoid making distracting interface changes when Always On begins or ends and throughout the Always On experience. For example, when Always On begins, prefer transitioning an interactive component to an unavailable appearance — don’t just remove it. Within the Always On context, aim to make infrequent, subtle updates to the interface. For example, a sports app might pause granular play-by-play updates while in Always On, only updating the score when it changes. Note that unnecessary changes during Always On can be especially distracting on iPhone, because people often put their device face up on a surface, making motion on the screen visible even when they’re not looking directly at it. Gracefully transition motion to a resting state; don’t stop it instantly. Smoothly finishing the current motion helps communicate the transition and avoids making people think that something went wrong. Platform considerations No additional considerations for iOS or watchOS. Not supported in iPadOS, macOS, tvOS, or visionOS. Resources Related Designing for watchOS Developer documentation Designing your app for the Always On state — watchOS apps Videos What's new in watchOS 8 Build a workout app for Apple Watch What's new in SwiftUI Change log Date Changes September 12, 2023 Updated intro image artwork. September 23, 2022 Expanded guidance to cover the Always On display on iPhone 14 Pro and iPhone 14 Pro Max. Current page is Always On Supported platforms Always On Best practices Platform considerations Resources Change log

## Related Concepts

- color
- layout

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/always-on

This content was successfully extracted and structured from Apple's official documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
