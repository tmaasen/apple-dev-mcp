---
title: "Gyroscope and accelerometer"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer
id: universal-gyroscope-and-accelerometer
lastUpdated: 2025-06-25T18:31:22.412Z
extractionMethod: crawlee
qualityScore: 0.312
confidence: 0.412
contentLength: 1637
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "gyroscope and accelerometer", "feedback", "gestures", "interface", "motion", "navigation", "system", "ios"]
---
Skip Navigation
Gyroscope and accelerometer
On-device gyroscopes and accelerometers can supply data about a device's movement in the physical world.

You can use accelerometer and gyroscope data to provide experiences based on real-time, motion-based information in apps and games that run in iOS, iPadOS, and watchOS. tvOS apps can use gyroscope data from the Siri Remote. For developer guidance, see Core Motion.

Best practices

Use motion data only to offer a tangible benefit to people. For example, a fitness app might use the data to provide feedback about people's activity and general health, and a game might use the data to enhance gameplay. Avoid gathering data simply to have the data.

Important

If your experience needs to access motion data from a device, you must provide copy that explains why. The first time your app or game tries to access this type of data, the system includes your copy in a permission request, where people can grant or deny access.

Outside of active gameplay, avoid using accelerometers or gyroscopes for the direct manipulation of your interface. Some motion-based gestures may be difficult to replicate precisely, may be physically challenging for some people to perform, and may affect battery usage.

Platform considerations

No additional considerations for iOS, iPadOS, macOS, tvOS, visionOS, or watchOS.

Resources
Related

Feedback

Developer documentation

Getting processed device-motion data -- Core Motion

Videos
Measure health with motion
Current page is Gyroscope and accelerometer
Supported platforms
Gyroscope and accelerometer
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
