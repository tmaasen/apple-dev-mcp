---
title: "Home Screen Quick Actions"
platform: iOS
category: foundations
url: https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions
id: home-screen-quick-actions-ios
lastUpdated: 2025-06-26T23:26:48.908Z
extractionMethod: enhanced-turndown
qualityScore: 0.800
confidence: 1.000
contentLength: 3324
structureScore: 0.500
cleaningScore: 0.114
hasCodeExamples: false
hasImages: false
keywords: ["home", "screen", "quick", "actions", "give", "people", "way", "perform", "app", "specific"]
---
## Overview

Home Screen quick actions Home Screen quick actions give people a way to perform app-specific actions from the Home Screen. People can get a menu of available quick actions when they touch and hold an app icon (on a 3D Touch device, people can press on the icon with increased pressure to see the menu). For example, Mail includes quick actions that open the Inbox or the VIP mailbox, initiate a search, and create a new message. In addition to app-specific actions, a Home Screen quick action menu also lists items for removing the app and editing the Home Screen. Each Home Screen quick action includes a title, an interface icon on the left or right (depending on your app’s position on the Home Screen), and an optional subtitle. The title and subtitle are always left-aligned in left-to-right languages. Your app can even dynamically update its quick actions when new information is available. For example, Messages provides quick actions for opening your most recent conversations. Best practices Create quick actions for compelling, high-value tasks. For example, Maps lets people search near their current location or get directions home without first opening the Maps app. People tend to expect every app to provide at least one useful quick action; you can provide a total of four. Avoid making unpredictable changes to quick actions. Dynamic quick actions are a great way to keep actions relevant. For example, it may make sense to update quick actions based on the current location or recent activities in your app, time of day, or changes in settings. Make sure that actions change in ways that people can predict. For each quick action, provide a succinct title that instantly communicates the results of the action. For example, titles like “Directions Home,” “Create New Contact,” and “New Message” can help people understand what happens when they choose the action. If you need to give more context, provide a subtitle too. Mail uses subtitles to indicate whether there are unread messages in the Inbox and VIP folder. Don’t include your app name or any extraneous information in the title or subtitle, keep the text short to avoid truncation, and take localization into account as you write the text. Provide a recognizable interface icon for each quick action. Consider using SF Symbols to represent actions. If you design your own interface icon, use the Quick Action Icon Template that’s included with Apple Design Resources for iOS and iPadOS and use the following sizes for guidance. Maximum width and height 34.67x34.67 pt (104x104 px @3x) 35x35 pt (70x70 px @2x) Target width and height 26.67x26.67 pt (80x80 px @3x) 27x27 pt (54x54 px @2x) Target width (wide glyphs) 29.33pt (88px @3x) 30pt (60px @2x) Target height (tall glyphs) 29.33pt (88px @3x) 30pt (60px @2x) Don’t use an emoji in place of a symbol or interface icon. Emojis are full color, whereas quick action symbols are monochromatic and change appearance in Dark Mode to maintain contrast. Platform considerations No additional considerations for iOS or iPadOS. Not supported in macOS, tvOS, visionOS, or watchOS. Resources Related Menus Developer documentation Add Home Screen quick actions — UIKit Current page is Home Screen quick actions Supported platforms Home Screen quick actions Best practices Platform considerations Resources

## Related Concepts

- color

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions

This content was successfully extracted and structured from Apple's official documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
