---
title: "Tab views"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/tab-views
id: universal-tab-views
lastUpdated: 2025-06-25T18:35:21.101Z
extractionMethod: crawlee
qualityScore: 0.386
confidence: 0.586
contentLength: 3111
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "tab views", "controls", "interface", "layout", "navigation", "selection", "visual", "ios"]
---
Skip Navigation
Tab views
A tab view presents multiple mutually exclusive panes of content in the same area, which people can switch between using a tabbed control.

Best practices

Use a tab view to present closely related areas of content. The appearance of a tab view provides a strong visual indication of enclosure. People expect each tab to display content that is in some way similar or related to the content in the other tabs.

Make sure the controls within a pane affect content only in the same pane. Panes are mutually exclusive, so ensure they're fully self-contained.

Provide a label for each tab that describes the contents of its pane. A good label helps people predict the contents of a pane before clicking or tapping its tab. In general, use nouns or short noun phrases for tab labels. A verb or short verb phrase may make sense in some contexts. Use title-style capitalization for tab labels.

Avoid using a pop-up button to switch between tabs. A tabbed control is efficient because it requires a single click or tap to make a selection, whereas a pop-up button requires two. A tabbed control also presents all choices onscreen at the same time, whereas people must click a pop-up button to see its choices. Note that a pop-up button can be a reasonable alternative in cases where there are too many panes of content to reasonably display with tabs.

Avoid providing more than six tabs in a tab view. Having more than six tabs can be overwhelming and create layout issues. If you need to present six or more tabs, consider another way to implement the interface. For example, you could instead present each tab as a view option in a pop-up button menu.

For developer guidance, see NSTabView.

Anatomy

You can position the tabbed control on any side of the content area: top, bottom, left, or right. You can also hide the controls, which is appropriate when you switch the panes programmatically.

Top tabs

Bottom tabs

When you hide the tabbed control, the content area can be borderless, bezeled, or bordered with a line. A borderless view can be solid or transparent.

In general, inset a tab view by leaving a margin of window-body area on all sides of a tab view. This layout looks clean and leaves room for additional controls that aren't directly related to the contents of the tab view. For example, the lock button in Date & Time settings is outside of the tab view because it applies to all tabs. You can extend a tab view to meet the window edges, but this layout is unusual.

Platform considerations

Not supported in iOS, iPadOS, tvOS, or visionOS.

iOS, iPadOS

For similar functionality, consider using a segmented control instead.

watchOS

watchOS displays tab views using page controls. For developer guidance, see TabView and verticalPage.

Resources
Related

Tab bars

Segmented controls

Developer documentation

TabView -- SwiftUI

NSTabView -- AppKit

Change log

Date

Changes

June 5, 2023

Added guidance for using tab views in watchOS.

Current page is Tab views
Supported platforms
Tab views
Best practices
Anatomy
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/tab-views

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
