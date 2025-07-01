---
title: "Segmented Controls"
platform: universal
category: selection-and-input
url: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
id: segmented-controls
lastUpdated: 2025-07-01T00:52:25.795Z
extractionMethod: enhanced-turndown
qualityScore: 0.800
confidence: 1.000
contentLength: 4692
structureScore: 0.500
cleaningScore: 0.114
hasCodeExamples: false
hasImages: false
keywords: ["segmented", "controls", "control", "linear", "set", "two", "more", "segments", "each", "which"]
---
## Overview

Segmented controls A segmented control is a linear set of two or more segments, each of which functions as a button. Within a segmented control, all segments are usually equal in width. Like buttons, segments can contain text or images. Segments can also have text labels beneath them (or beneath the control as a whole). Best practices A segmented control can offer a single choice or multiple choices. For example, in Keynote people can select only one segment in the alignment options control to align selected text. In contrast, people can choose multiple segments in the font attributes control to combine styles like bold, italics, and underline. The toolbar of a Keynote window also uses a segmented control to let people show and hide various editing panes within the main window area. Single choice Multiple choices Use a segmented control to provide closely related choices that affect an object, state, or view. For example, a segmented control can help people switch between views in a toolbar. Avoid using a segmented control to offer actions, such as adding, removing, or editing content. Avoid crowding the control with too many segments. Too many segments can be hard to parse and time-consuming to navigate. Aim for no more than about five to seven segments in a wide interface and no more than about five segments on iPhone. In general, keep segment size consistent. When all segments have equal width, a segmented control feels balanced. To the extent possible, it’s best to keep icon and title widths consistent too. Content Prefer using either text or images — not a mix of both — in a single segmented control. Although individual segments can contain text labels or images, mixing the two in a single control can lead to a disconnected and confusing interface. As much as possible, use content with a similar size in each segment. Because all segments typically have equal width, it doesn’t look good if content fills some segments but not others. Use nouns or noun phrases for segment labels. Write text that describes each segment and uses title-style capitalization. A segmented control that displays text labels doesn’t need introductory text. Platform considerations Not supported in watchOS. iOS, iPadOS Avoid using a segmented control in a toolbar. Toolbar items act on the current screen — they don’t let people switch contexts like segmented controls do. macOS Consider using introductory text to clarify the purpose of a segmented control. When the control uses symbols or interface icons, you could also add a label below each segment to clarify its meaning. If your app includes tooltips, provide one for each segment in a segmented control. Use a tab view in the main window area — instead of a segmented control — for view switching. A tab view supports efficient view switching and is similar in appearance to a box combined with a segmented control. Consider using a segmented control to help people switch views in a toolbar or inspector pane. Size custom interface icons appropriately based on the size of the control. Use the following values for guidance. Regular Small Mini Control size Icon size Regular 17x17 px @1x (34x34 px @2x) Small 14x13 px @1x (28x26 px @2x) Mini 12x11 px @1x (24x22 px @2x) Consider supporting spring loading. On a Mac equipped with a Magic Trackpad, spring loading lets people activate a segment by dragging selected items over it and force clicking without dropping the selected items. People can also continue dragging the items after a segment activates. tvOS Consider using a split view instead of a segmented control on screens that perform content filtering. People generally find it easy to navigate back and forth between content and filtering options using a split view. Depending on its placement, a segmented control may not be as easy to access. Avoid putting other focusable elements close to segmented controls. Segments become selected when focus moves to them, not when people click them. Carefully consider where you position a segmented control relative to other interface elements. If other focusable elements are too close, people might accidentally focus on them when attempting to switch between segments. visionOS When people look at a segmented control that uses icons, the system displays a tooltip that contains the descriptive text you supply. Resources Related Split views Developer documentation segmented — SwiftUI UISegmentedControl — UIKit NSSegmentedControl — AppKit Change log Date Changes June 21, 2023 Updated to include guidance for visionOS. Current page is Segmented controls Supported platforms Segmented controls Best practices Content Platform considerations Resources Change log

## Related Concepts

- button
- buttons
- toolbar

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/segmented-controls

This content was successfully extracted and structured from Apple's official documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
