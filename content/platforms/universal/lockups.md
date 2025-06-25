---
title: "Lockups"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/lockups
id: universal-lockups
lastUpdated: 2025-06-25T18:35:07.098Z
extractionMethod: crawlee
qualityScore: 0.389
confidence: 0.589
contentLength: 2578
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "lockups", "buttons", "design", "images", "layout", "motion", "navigation", "visual"]
---
Skip Navigation
Lockups
Lockups combine multiple separate views into a single, interactive unit.

Each lockup consists of a content view, a header, and a footer. Headers appear above the main content for a lockup, and footers appear below the main content. All three views expand and contract together as the lockup gets focus.

According to the needs of your app, you can combine four types of lockup: cards, caption buttons, monograms, and posters.

Best practices

Allow adequate space between lockups. A focused lockup expands in size, so leave enough room between lockups to avoid overlapping or displacing other lockups. For guidance, see Layout.

Use consistent lockup sizes within a row or group. A group of buttons or a row of content images is more visually appealing when the widths and heights of all elements match.

For developer guidance, see TVLockupView and TVLockupHeaderFooterView.

Cards

A card combines a header, footer, and content view to present ratings and reviews for media items.

For developer guidance, see TVCardView

Caption buttons

A caption button can include a title and a subtitle beneath the button. A caption button can contain either an image or text.

Make sure that when people focus on them, caption buttons tilt with the motion that they swipe. When aligned vertically, caption buttons tilt up and down. When aligned horizontally, caption buttons tilt left and right. When displayed in a grid, caption buttons tilt both vertically and horizontally.

For developer guidance, see TVCaptionButtonView.

Monograms

Monograms identify people, usually the cast and crew for a media item. Each monogram consists of a circular picture of the person and their name. If an image isn't available, the person's initials appear in place of an image.

Prefer images over initials. An image of a person creates a more intimate connection than text.

For developer guidance, see TVMonogramContentView.

Posters

Posters consist of an image and an optional title and subtitle, which are hidden until the poster comes into focus. Posters can be any size, but the size needs to be appropriate for their content. For related guidance, see Image views.

For developer guidance, see TVPosterView

Platform considerations

Not supported in iOS, iPadOS, macOS, visionOS, or watchOS.

Resources
Related

Designing for tvOS

Layout

Developer documentation

TVLockupView -- TVUIKit

TVLockupHeaderFooterView -- TVUIKit

Current page is Lockups
Supported platforms
Lockups
Best practices
Cards
Caption buttons
Monograms
Posters
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/lockups

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
