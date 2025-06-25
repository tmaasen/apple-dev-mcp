---
title: "Loading"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/loading
id: universal-loading
lastUpdated: 2025-06-25T18:30:14.133Z
extractionMethod: crawlee
qualityScore: 0.375
confidence: 0.475
contentLength: 3495
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "loading", "animation", "design", "navigation", "system", "user experience", "ios", "ipad"]
---
Skip Navigation

June 9, 2025

Revised guidance for storing downloads to reflect downloading large assets in the background.
Loading
The best content-loading experience finishes before people become aware of it.

If your app or game loads assets, levels, or other content, design the behavior so it doesn't disrupt or negatively impact the user experience.

Best practices

Show something as soon as possible. If you make people wait for loading to complete before displaying anything, they can interpret the lack of content as a problem with your app or game. Instead, consider showing placeholder text, graphics, or animations as content loads, replacing these elements as content becomes available.

Let people do other things in your app or game while they wait for content to load. Loading content in the background helps give people access to other actions. For example, a game could load content in the background while players learn about the next level or view an in-game menu. For developer guidance, see Improving the player experience for games with large downloads.

If loading takes an unavoidably long time, give people something interesting to view while they wait. For example, you might provide gameplay hints, display tips, or introduce people to new features. Gauge the remaining loading time as accurately as possible to help you avoid giving people too little time to enjoy your placeholder content or having so much time that you need to repeat it.

Improve installation and launch time by downloading large assets in the background. Consider using the Background Assets framework to schedule asset downloads -- like game level packs, 3D character models, and textures -- to occur immediately after installation, during updates, or at other nondisruptive times.

Showing progress

Clearly communicate that content is loading and how long it might take to complete. Ideally, content displays instantly, but for situations where loading takes more than a moment or two, you can use system-provided components -- called progress indicators -- to show that loading is ongoing. In general, you use a determinate progress indicator when you know how long loading will take, and you use an indeterminate progress indicator when you don't. For guidance, see Progress indicators.

For games, consider creating a custom loading view. Standard progress indicators work well in most apps, but can sometimes feel out of place in a game. Consider designing a more engaging experience by using custom animations and elements that match the style of your game.

Platform considerations

No additional considerations for iOS, iPadOS, macOS, tvOS, or visionOS.

watchOS

As much as possible, avoid showing a loading indicator in your watchOS experience. People expect quick interactions with their Apple Watch, so aim to display content immediately. In situations where content needs a second or two to load, it's better to display a loading indicator than a blank screen.

Resources
Related

Launching

Progress indicators

Developer documentation

Background Assets

Videos
Discover Apple-Hosted Background Assets
Change log

Date

Changes

June 9, 2025

Revised guidance for storing downloads to reflect downloading large assets in the background.

June 10, 2024

Added guidelines for showing progress and storing downloads, and enhanced guidance for games.

Current page is Loading
Supported platforms
Loading
Best practices
Showing progress
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/loading

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
