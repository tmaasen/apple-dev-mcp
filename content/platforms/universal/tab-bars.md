---
title: "Tab bars"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/tab-bars
id: universal-tab-bars
lastUpdated: 2025-06-25T18:33:23.232Z
extractionMethod: crawlee
qualityScore: 0.640
confidence: 0.840
contentLength: 9221
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "tab bars", "buttons", "color", "controls", "design", "icons", "interface", "navigation"]
---
## Summary

Guidelines for Tab bars in universal design. Part of Apple's Human Interface Guidelines covering visual-design.

Skip Navigation
Tab bars
A tab bar lets people navigate between top-level sections of your app.

Tab bars help people understand the different types of information or functionality that an app provides. They also let people quickly switch between sections of the view while preserving the current navigation state within each section.

For guidance using a similar component in macOS, see tab views.

Best practices

Use a tab bar to support navigation, not to provide actions. A tab bar lets people navigate among different sections of an app, like the Alarm, Stopwatch, and Timer tabs in the Clock app. If you need to provide controls that act on elements in the current view, use a toolbar instead.

Make sure the tab bar is visible when people navigate to different sections of your app. If you hide the tab bar, people can forget which area of the app they're in. The exception is when a modal view covers the tab bar, because a modal is temporary and self-contained.

Use the appropriate number of tabs required to help people navigate your app. As a representation of your app's hierarchy, it's important to weigh the complexity of additional tabs against the need for people to frequently access each section; keep in mind that it's generally easier to navigate among fewer tabs. Where available, consider a sidebar or a tab bar that adapts to a sidebar as an alternative for an app with a complex information structure.

Avoid overflow tabs whenever possible. Depending on device size and orientation, the number of visible tabs can be smaller than the total number of tabs. If horizontal space limits the number of visible tabs, the trailing tab becomes a More tab in iOS and iPadOS, revealing the remaining items in a separate list. The More tab makes it harder for people to reach and notice content on tabs that are hidden, so try to limit scenarios in your app where this can happen.

Don't disable or hide tab bar buttons, even when their content is unavailable. Having tab bar buttons available in some cases but not others makes your app's interface appear unstable and unpredictable. If a section is empty, explain why its content is unavailable.

Use a succinct term for each tab title. A useful tab title aids navigation by clearly describing the type of content or functionality the tab contains. Use single words whenever possible.

Use a badge to unobtrusively communicate that information is available. You can display a badge -- a red oval containing white text and either a number or an exclamation point -- on a tab to indicate that there's new or updated information in the section that may warrant a person's attention. For guidance, see Notifications.

Platform considerations

No additional considerations for macOS. Not supported in watchOS.

iOS

By default, a tab bar is translucent: It uses a background material only when content appears behind it, removing the material when the view scrolls to the bottom. A keyboard covers the tab bar when it's onscreen.

Consider using SF Symbols to provide scalable, visually consistent tab bar icons. When you use SF Symbols, tab bar icons automatically adapt to different contexts. For example, the tab bar can be regular or compact, depending on the current device and orientation. Also, tab bar icons can appear above tab titles in portrait orientation, whereas in landscape, the icons and titles can appear side by side. Prefer filled symbols or icons for consistency with the platform.

If you need to create custom tab bar icons using bitmaps, create each icon in two sizes so that the tab bar looks good in both regular and compact environments. Use the following metrics when creating tab bar icons in different shapes. For guidance, see Icons.

Target dimensions

Icon Shape

Regular tab bars

Compact tab bars

Circle

25x25 pt

18x18 pt

50x50 px @2x

36x36 px @2x

75x75 px @3x

54x54 px @3x

Square

23x23 pt

17x17 pt

46x46 px @2x

34x34 px @2x

69x69 px @3x

51x51 px @3x

Wide

31 pt

23 pt

62 px @2x

46 px @2x

93 px @3x

69 px @3x

Tall

28 pt

20 pt

56 px @2x

40 px @2x

84 px @3x

60 px @3x

iPadOS

Starting with iPadOS 18, the system displays a tab bar near the top of the screen. You can choose to have the tab bar appear as a fixed element, or include a button that converts it to a sidebar. For developer guidance, see tabBarOnly and sidebarAdaptable.

Note

To present a sidebar without the option to convert it to a tab bar, use a navigation split view instead of a tab view. For guidance, see Sidebars.

Prefer a tab bar for navigation. A tab bar provides access to the sections of your app that people use most. If your app is more complex, you can provide the option to convert the tab bar to a sidebar so people can access a wider set of navigation options.

Let people customize the tab bar. In apps with a lot of sections that people might want to access, it can be useful to let people select items that they use frequently and add them to the tab bar, or remove items that they use less frequently. For example, in the Music app, a person can choose a favorite playlist to display in the tab bar. For developer guidance, see TabViewCustomization and UITab.Placement.

tvOS

A tab bar is highly customizable. For example, you can:

Specify a tint, color, or image for the tab bar background

Choose a font for tab items, including a different font for the selected item

Specify tints for selected and unselected items

Add button icons, like settings and search

By default, a tab bar is translucent, and only the selected tab is opaque. When people use the remote to focus on the tab bar, the selected tab includes a drop shadow that emphasizes its selected state. The height of a tab bar is 68 points, and its top edge is 46 points from the top of the screen; you can't change either of these values.

If there are more items than can fit in the tab bar, the system truncates the rightmost item by applying a fade effect that begins at the right side of the tab bar. If there are enough items to cause scrolling, the system also applies a truncating fade effect that starts from the left side.

If you use an icon for a tab title, make sure it's familiar. You can use icons as tab titles to help save space, but only for universally recognized symbols like search or settings. Using an unfamiliar symbol without a descriptive title can confuse people. For guidance, see SF Symbols.

Be aware of tab bar scrolling behaviors. By default, people can scroll the tab bar offscreen when the current tab contains a single main view. You can see examples of this behavior in the Watch Now, Movies, TV Show, Sports, and Kids tabs in the TV app. The exception is when a screen contains a split view, such as the TV app's Library tab or an app's Settings screen. In this case, the tab bar remains pinned at the top of the view while people scroll the content within the primary and secondary panes of the split view. Regardless of a tab's contents, focus always returns to the tab bar at the top of the page when people press Menu on the remote.

In a live-viewing app, organize tabs in a consistent way. For the best experience, organize content in live-streaming apps with tabs in the following order:

Live content

Cloud DVR or other recorded content

Other content

For additional guidance, see Live-viewing apps.

Create a branded logo image to display next to the leading or trailing end of the tab bar, if it makes sense in your app. To ensure enough room between the branded logo image and the edge of the tab bar, place the image within the safe margin. Use the following image size values for guidance:

Maximum width

Maximum height

200 pt

68 pt

visionOS

In visionOS, a tab bar is always vertical, floating in a position that's fixed relative to the window's leading side. When people look at a tab bar, it automatically expands; to open a specific tab, people look at the tab and tap. While a tab bar is expanded, it can temporarily obscure the content behind it.

Play

Supply a symbol and a text title for each tab. A tab's symbol is always visible in the tab bar. When people look at the tab bar, the system reveals tab titles, too. Even though the tab bar expands, you need to keep tab titles short so people can read them at a glance.

Collapsed

Expanded

If it makes sense in your app, consider using a sidebar within a tab. If your app's hierarchy is deep, you might want to use a sidebar to support secondary navigation within a tab. If you do this, be sure to prevent selections in the sidebar from changing which tab is currently open.

Resources
Related

Tab views

Toolbars

Sidebars

Developer documentation

TabView -- SwiftUI

Enhancing your app's content with tab navigation -- SwiftUI

UITabBar -- UIKit

Elevating your iPad app with a tab bar and sidebar -- UIKit

Videos
Get to know the new design system
Elevate the design of your iPad app
Change log

Date

Changes

September 9, 2024

Added art representing the tab bar in iPadOS 18.

August 6, 2024

Updated with guidance for the tab bar in iPadOS 18.

June 21, 2023

Updated to include guidance for visionOS.

Current page is Tab bars
Supported platforms
Tab bars
Best practices
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/tab-bars

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
