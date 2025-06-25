---
title: "Collections"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/collections
id: universal-collections
lastUpdated: 2025-06-25T18:34:56.562Z
extractionMethod: crawlee
qualityScore: 0.362
confidence: 0.562
contentLength: 2045
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "collections", "animation", "feedback", "gestures", "images", "layout", "navigation", "visual"]
---
Skip Navigation
Collections
A collection manages an ordered set of content and presents it in a customizable and highly visual layout.

Generally speaking, collections are ideal for showing image-based content.

Best practices

Use the standard row or grid layout whenever possible. Collections display content by default in a horizontal row or a grid, which are simple, effective appearances that people expect. Avoid creating a custom layout that might confuse people or draw undue attention to itself.

Consider using a table instead of a collection for text. It's generally simpler and more efficient to view and digest textual information when it's displayed in a scrollable list.

Make it easy to choose an item. If it's too difficult to get to an item in your collection, people will get frustrated and lose interest before reaching the content they want. Use adequate padding around images to keep focus or hover effects easy to see and prevent content from overlapping.

Add custom interactions when necessary. By default, people can tap to select, touch and hold to edit, and swipe to scroll. If your app requires it, you can add more gestures for performing custom actions.

Consider using animations to provide feedback when people insert, delete, or reorder items. Collections support standard animations for these actions, and you can also use custom animations.

Platform considerations

No additional considerations for macOS, tvOS, or visionOS. Not supported in watchOS.

iOS, iPadOS

Use caution when making dynamic layout changes. The layout of a collection can change dynamically. Be sure any changes make sense and are easy to track. If possible, try to avoid changing the layout while people are viewing and interacting with it, unless it's in response to an explicit action.

Resources
Related

Lists and tables

Image views

Layout

Developer documentation

UICollectionView -- UIKit

NSCollectionView -- AppKit

Current page is Collections
Supported platforms
Collections
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/collections

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
