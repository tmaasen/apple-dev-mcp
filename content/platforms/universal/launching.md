---
title: "Launching"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/launching
id: universal-launching
lastUpdated: 2025-06-25T18:30:05.556Z
extractionMethod: crawlee
qualityScore: 0.553
confidence: 0.753
contentLength: 4854
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "launching", "branding", "color", "design", "images", "interface", "layout", "navigation"]
---
## Summary

Skip Navigation
Launching
A streamlined launch experience helps people start using your app or game immediately.

Skip Navigation
Launching
A streamlined launch experience helps people start using your app or game immediately.

Launching begins when someone opens your app or game, includes an initial download, and ends when the first screen is ready. After launching completes, you might offer an onboarding experience, which can give people a high-level view of your app or game.

Best practices

Launch instantly. People want to start interacting with your app or game right away, and sometimes they don't want to wait more than a couple of seconds.

If the platform requires it, provide a launch screen. In iOS, iPadOS, and tvOS, the system displays your launch screen the moment your app or game starts and quickly replaces it with your first screen, giving people the impression that your experience is fast and responsive. For guidance, see Launch screens. macOS, visionOS, and watchOS don't require launch screens.

If you need a splash screen, consider displaying it at the beginning of your onboarding flow. A splash screen is a beautiful graphic that succinctly communicates branding and other information you need to provide. If you don't provide an onboarding experience, you might display your splash screen as soon as launching completes.

Restore the previous state when your app restarts so people can continue where they left off. Avoid making people retrace steps to reach their previous location in your app or game. Restore granular details of the previous state as much as possible. For example, scroll the view to people's most recent position, and display windows in the same state and location in which people left them.

Launch screens

Not applicable for macOS, visionOS, or watchOS.

Downplay the launch experience. A launch screen isn't part of an onboarding experience or a splash screen, and it isn't an opportunity for artistic expression. A launch screen's sole function is to enhance the perception of your experience as quick to launch and immediately ready to use.

Design a launch screen that's nearly identical to the first screen of your app or game. If you include elements that look different when launching completes, people may experience an unpleasant flash between the launch screen and your first screen. If your app or game displays a solid color before transitioning to the first screen, create a launch screen that displays only that solid color. Also make sure that your launch screen matches the device's current orientation and appearance mode.

Launch screen

First screen

Avoid including text on your launch screen, even if your first screen displays text. Because the content in a launch screen doesn't change, any text you display won't be localized.

Don't advertise. The launch screen isn't a branding opportunity. Avoid creating a screen that looks like a splash screen or an "About" window, and don't include logos or other branding elements unless they're a fixed part of your app's first screen.

Platform considerations

No additional considerations for macOS or watchOS.

iOS, iPadOS

Launch in the appropriate orientation. If your app or game supports both portrait and landscape modes, launch using the device's current orientation. If your interface only runs in one orientation, launch in that orientation and let people rotate the device if necessary. Ensure a landscape-only interface responds correctly, regardless of whether people enter landscape orientation by rotating the device left or right. For guidance, see Layout.

tvOS

Note

Unlike the layered images throughout much of a tvOS app, the launch screen is static.

In a live-viewing app, consider automatically starting playback soon after people start the app. People come to your app to watch TV, so you might want to start playing new or recently viewed live content after a few seconds of inactivity. For guidance, see Live-viewing apps.

visionOS

Consider launching in the Shared Space even if your app is fully immersive. Opening a window in the Shared Space lets you provide more context about your app or game while giving it time to load, and it also lets you present a control that people can use to open your fully immersive experience. In general, people appreciate being able to choose when to transition to a Full Space, especially if they're currently running other apps in the Shared Space. For guidance, see Immersive experiences.

Resources
Related

Onboarding

Loading

Developer documentation

Specifying your app's launch screen -- Xcode

Responding to the launch of your app -- UIKit

Videos
Optimizing App Launch
Love at First Launch
Change log

Date

Changes

June 10, 2024

Added guidance on displaying a splash screen.

June 21, 2023

Updated to include guidance for visionOS.

Current page is Launching
Supported platforms
Launching
Best practices
Launch screens
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/launching

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
