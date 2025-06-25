---
title: "iMessage apps and stickers"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/imessage-apps-and-stickers
id: universal-imessage-apps-and-stickers
lastUpdated: 2025-06-25T18:32:09.606Z
extractionMethod: crawlee
qualityScore: 0.510
confidence: 0.610
contentLength: 4606
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "imessage apps and stickers", "animation", "color", "images", "navigation", "system", "visual", "voiceover"]
---
## Summary

Skip Navigation
iMessage apps and stickers
An iMessage app can help people share content, collaborate, and even play games with others in a conversation; stickers are images that people can use to decorate a conversation.

Skip Navigation
iMessage apps and stickers
An iMessage app can help people share content, collaborate, and even play games with others in a conversation; stickers are images that people can use to decorate a conversation.

An iMessage app or sticker pack is available within the context of a Messages conversation and also in effects in both Messages and FaceTime. You can create an iMessage app or sticker pack as a standalone app or as an app extension within your iOS or iPadOS app. For developer guidance, see Messages and Adding Sticker packs and iMessage apps to the system Stickers app, Messages camera, and FaceTime.

Best practices

Prefer providing one primary experience in your iMessage app. People are in a conversational flow when they choose your app, so your functionality or content needs to be easy to understand and immediately available. If you want to provide multiple types of functionality or different collections of content, consider creating a separate iMessage app for each one.

Consider surfacing content from your iOS or iPadOS app. For example, your iMessage app could offer app-specific information that people might want to share -- such as a shopping list or a trip itinerary -- or support a simple, collaborative task, like deciding where to go for a meal or which movie to watch.

Present essential features in the compact view. People can experience your iMessage app in a compact view that appears below the message transcript, or they can expand the view to occupy most of the window. Make sure the most frequently used items are available in the compact view, reserving additional content and features for the expanded view.

In general, let people edit text only in the expanded view. The compact view occupies roughly the same space as the keyboard. To ensure that the iMessage app's content remains visible while people edit, display the keyboard in the expanded view.

Create stickers that are expressive, inclusive, and versatile. Whether your stickers are rich, static images or short animations, make sure that each one remains legible against a wide range of backgrounds and when rotated or scaled. You can also use transparency to help people visually integrate a sticker with text, photos, and other stickers.

For each sticker, provide a localized alternative description. VoiceOver can help people use your sticker pack by speaking a sticker's alternative description.

Specifications
Icon sizes

The icon for an iMessage app or sticker pack can appear in Messages, the App Store, notifications, and Settings. After people install your iMessage app or sticker pack, its icon also appears in the app drawer in the Messages app.

You supply a square-cornered icon for each extension you offer, and the system automatically applies a mask that rounds the corners.

To ensure that your icon looks great in any context and on various devices, create a square-cornered icon in the following sizes:

Usage

@2x (pixels)

@3x (pixels)

Messages, notifications

148x110

-

143x100

-

120x90

180x135

64x48

96x72

54x40

81x60

Settings

58x58

87x87

App Store

1024x1024

1024x1024

Sticker sizes

Messages supports small, regular, and large stickers. Pick the size that works best for your content and prepare all of your stickers at that size; don't mix sizes within a single sticker pack. Messages displays stickers in a grid, organized differently for different sizes.

Small

Regular

Large

Create your sticker images using the following @3x dimensions for the sticker size you chose. If necessary, the system generates @2x and @1x versions by downscaling the images at runtime. For developer guidance, see MSStickerSize.

Sticker size

@3x dimensions (pixels)

Small

300x300

Regular

408x408

Large

618x618

A sticker file must be 500 KB or smaller in size. For each supported format, the table below provides guidance for using transparency and animation.

Format

Transparency

Animation

PNG

8-bit

No

APNG

8-bit

Yes

GIF

Single-color

Yes

JPEG

No

No

Platform considerations

No additional considerations for iOS or iPadOS. Not supported in macOS, tvOS, visionOS, or watchOS.

Resources
Related

iMessage Apps and Stickers

Developer documentation

Messages

Adding Sticker packs and iMessage apps to the system Stickers app, Messages camera, and FaceTime -- Messages

Videos
Express Yourself!
Change log

Date

Changes

May 2, 2023

Consolidated guidance into one page.

Current page is iMessage apps and stickers
Supported platforms
iMessage apps and stickers
Best practices
Specifications
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/imessage-apps-and-stickers

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
