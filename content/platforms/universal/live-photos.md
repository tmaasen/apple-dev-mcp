---
title: "Live Photos"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/live-photos
id: universal-live-photos
lastUpdated: 2025-06-25T18:32:16.288Z
extractionMethod: crawlee
qualityScore: 0.424
confidence: 0.524
contentLength: 2885
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "live photos", "color", "design", "motion", "navigation", "presentation", "system", "visual"]
---
Skip Navigation
Live Photos
Live Photos lets people capture favorite memories in a sound- and motion-rich interactive experience that adds vitality to traditional still photos.

When Live Photos is available, the Camera app captures additional content -- including audio and extra frames -- before and after people take a photo. People press a Live Photo to see it spring to life.

Play
Best practices

Apply adjustments to all frames. If your app lets people apply effects or adjustments to a Live Photo, make sure those changes are applied to the entire photo. If you don't support this, give people the option of converting it to a still photo.

Keep Live Photo content intact. It's important for people to experience Live Photos in a consistent way that uses the same visual treatment and interaction model across all apps. Don't disassemble a Live Photo and present its frames or audio separately.

Implement a great photo sharing experience. If your app supports photo sharing, let people preview the entire contents of Live Photos before deciding to share. Always offer the option to share Live Photos as traditional photos.

Clearly indicate when a Live Photo is downloading and when the photo is playable. Show a progress indicator during the download process and provide some indication when the download is complete.

Display Live Photos as traditional photos in environments that don't support Live Photos. Don't attempt to replicate the Live Photos experience provided in a supported environment. Instead, show a traditional, still representation of the photo.

Make Live Photos easily distinguishable from still photos. The best way to identify a Live Photo is through a hint of movement. Note that there are no built-in Live Photo motion effects, like the one that occurs as you swipe through photos in the full-screen browser of Photos app. Any motion effects like this must be custom designed and implemented. In cases where movement isn't possible, show a system-provided badge above the photo. This badge can be displayed as an overlay with a shadow or as a solid color without a shadow. A badge variant is also available for situations where a Live Photo appears as a traditional photo. Never include a playback button that could be interpreted as a video playback button.

Keep badge placement consistent. If you show a badge, put it in the same location on every photo. Typically, a badge looks best in a corner of a photo.

Platform considerations

No additional considerations for iOS, iPadOS, macOS, or tvOS. Not supported in watchOS.

visionOS

In visionOS, people can view a Live Photo, but they can't capture one.

Resources
Developer documentation

PHLivePhoto -- PhotoKit

LivePhotosKit JS -- LivePhotosKit JS

Videos
What's new in camera capture
Current page is Live Photos
Supported platforms
Live Photos
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/live-photos

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
