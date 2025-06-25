---
title: "Collaboration and sharing"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/collaboration-and-sharing
id: universal-collaboration-and-sharing
lastUpdated: 2025-06-25T18:29:47.942Z
extractionMethod: crawlee
qualityScore: 0.520
confidence: 0.720
contentLength: 6421
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "collaboration and sharing", "buttons", "design", "interface", "navigation", "presentation", "system", "ios"]
---
## Summary

Skip Navigation
Collaboration and sharing
Great collaboration and sharing experiences are simple and responsive, letting people engage with the content while communicating effectively with others.

Skip Navigation
Collaboration and sharing
Great collaboration and sharing experiences are simple and responsive, letting people engage with the content while communicating effectively with others.

System interfaces and the Messages app can help you provide consistent and convenient ways for people to collaborate and share. For example, people can share content or begin a collaboration by dropping a document into a Messages conversation or selecting a destination in the familiar share sheet.

After a collaboration begins, people can use the Collaboration button in your app to communicate with others, perform custom actions, and manage details. In addition, people can receive Messages notifications when collaborators mention them, make changes, join, or leave.

You can take advantage of Messages integration and the system-provided sharing interfaces whether you implement collaboration and sharing through CloudKit, iCloud Drive, or a custom solution. To offer these features when you use a custom collaboration infrastructure, make sure your app also supports universal links (for developer guidance, see Supporting universal links in your app).

In addition to helping people share and collaborate on documents, visionOS supports immersive sharing experiences through SharePlay. For guidance, see SharePlay.

Best practices

Place the Share button in a convenient location, like a toolbar, to make it easy for people to start sharing or collaborating. In iOS 16, the system-provided share sheet includes ways to choose a file-sharing method and set permissions for a new collaboration; iPadOS 16 and macOS 13 introduce similar appearance and functionality in the sharing popover. In your SwiftUI app, you can also enable sharing by presenting a share link that opens the system-provided share sheet when people choose it; for developer guidance, see ShareLink.

If necessary, customize the share sheet or sharing popover to offer the types of file sharing your app supports. If you use CloudKit, you can add support for sending a copy of a file by passing both the file and your collaboration object to the share sheet. Because the share sheet has built-in support for multiple items, it automatically detects the file and makes the "send copy" functionality available. With iCloud Drive, your collaboration object supports "send copy" functionality by default. For custom collaboration, you can support "send copy" functionality in the share sheet by including a file -- or a plain text representation of it -- in your collaboration object.

Write succinct phrases that summarize the sharing permissions you support. For example, you might write phrases like "Only invited people can edit" or "Everyone can make changes." The system uses your permission summary in a button that reveals a set of sharing options that people use to define the collaboration.

Provide a set of simple sharing options that streamline collaboration setup. You can customize the view that appears when people choose the permission summary button to provide choices that reflect your collaboration functionality. For example, you might offer options that let people specify who can access the content and whether they can edit it or just read it, and whether collaborators can add new participants. Keep the number of custom choices to a minimum and group them in ways that help people understand them at a glance.

Prominently display the Collaboration button as soon as collaboration starts. The system-provided Collaboration button reminds people that the content is shared and identifies who's sharing it. Because the Collaboration button typically appears after people interact with the share sheet or sharing popover, it works well to place it next to the Share button.

Provide custom actions in the collaboration popover only if needed. Choosing the Collaboration button in your app reveals a popover that consists of three sections. The top section lists collaborators and provides communication buttons that can open Messages or FaceTime, the middle section contains your custom items, and the bottom section displays a button people use to manage the shared file. You don't want to overwhelm people with too much information, so it's crucial to offer only the most essential items that people need while they use your app to collaborate. For example, Notes summarizes the most recent updates and provides buttons that let people get more information about the updates or view more activities.

If it makes sense in your app, customize the title of the modal view's collaboration-management button. People choose this button -- titled "Manage Shared File" by default -- to reveal the collaboration-management view where they can change settings and add or remove collaborators. If you use CloudKit sharing, the system provides a management view for you; otherwise, you create your own.

Consider posting collaboration event notifications in Messages. Choose the type of event that occurred -- such as a change in the content or the collaboration membership, or the mention of a participant -- and include a universal link people can use to open the relevant view in your app. For developer guidance, see SWHighlightEvent.

Platform considerations

No additional considerations for iOS, iPadOS, or macOS. Not available in tvOS.

visionOS

By default, the system supports screen sharing for an app running in the Shared Space by streaming the current window to other collaborators. If one person transitions the app to a Full Space while sharing is in progress, the system pauses the stream for other people until the app returns to the Shared Space. For guidance, see Immersive experiences.

watchOS

In your SwiftUI app running in watchOS, use ShareLink to present the system-provided share sheet.

Resources
Related

Activity views

Developer documentation

Shared With You

ShareLink -- SwiftUI

Videos
Design for Collaboration with Messages
Enhance collaboration experiences with Messages
Integrate your custom collaboration app with Messages
Change log

Date

Changes

December 5, 2023

Added artwork illustrating button placement and various types of collaboration permissions.

June 21, 2023

Updated to include guidance for visionOS.

September 14, 2022

New page.

Current page is Collaboration and sharing
Supported platforms
Collaboration and sharing
Best practices
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/collaboration-and-sharing

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
