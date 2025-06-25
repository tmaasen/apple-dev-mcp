---
title: "Disclosure controls"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
id: universal-disclosure-controls
lastUpdated: 2025-06-25T18:33:14.540Z
extractionMethod: crawlee
qualityScore: 0.320
confidence: 0.520
contentLength: 2992
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "disclosure controls", "buttons", "controls", "navigation", "presentation", "ios", "ipad", "macos"]
---
Skip Navigation
Disclosure controls
Disclosure controls reveal and hide information and functionality related to specific controls or views.

Best practices

Use a disclosure control to hide details until they're relevant. Place controls that people are most likely to use at the top of the disclosure hierarchy so they're always visible, with more advanced functionality hidden by default. This organization helps people quickly find the most essential information without overwhelming them with too many detailed options.

Disclosure triangles

A disclosure triangle shows and hides information and functionality associated with a view or a list of items. For example, Keynote uses a disclosure triangle to show advanced options when exporting a presentation, and the Finder uses disclosure triangles to progressively reveal hierarchy when navigating a folder structure in list view.

A disclosure triangle points inward from the leading edge when its content is hidden and down when its content is visible. Clicking or tapping the disclosure triangle switches between these two states, and the view expands or collapses accordingly to accommodate the content.

Provide a descriptive label when using a disclosure triangle. Make sure your labels indicate what is disclosed or hidden, like "Advanced Options."

For developer guidance, see NSButton.BezelStyle.disclosure.

Disclosure buttons

A disclosure button shows and hides functionality associated with a specific control. For example, the macOS Save sheet shows a disclosure button next to the Save As text field. When people click or tap this button, the Save dialog expands to give advanced navigation options for selecting an output location for their document.

A disclosure button points down when its content is hidden and up when its content is visible. Clicking or tapping the disclosure button switches between these two states, and the view expands or collapses accordingly to accommodate the content.

Place a disclosure button near the content that it shows and hides. Establish a clear relationship between the control and the expanded choices that appear when a person clicks or taps a button.

Use no more than one disclosure button in a single view. Multiple disclosure buttons add complexity and can be confusing.

For developer guidance, see NSButton.BezelStyle.pushDisclosure.

Platform considerations

No additional considerations for macOS. Not supported in tvOS or watchOS.

iOS, iPadOS, visionOS

Disclosure controls are available in iOS, iPadOS, and visionOS with the SwiftUI DisclosureGroup view.

Resources
Related

Outline views

Lists and tables

Buttons

Developer documentation

DisclosureGroup -- SwiftUI

NSButton.BezelStyle.disclosure -- AppKit

NSButton.BezelStyle.pushDisclosure -- AppKit

Videos
Stacks, Grids, and Outlines in SwiftUI
Current page is Disclosure controls
Supported platforms
Disclosure controls
Best practices
Disclosure triangles
Disclosure buttons
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
