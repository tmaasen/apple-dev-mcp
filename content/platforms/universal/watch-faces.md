---
title: "Watch faces"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/watch-faces
id: universal-watch-faces
lastUpdated: 2025-06-25T18:33:55.736Z
extractionMethod: crawlee
qualityScore: 0.407
confidence: 0.507
contentLength: 3540
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "watch faces", "color", "design", "images", "navigation", "system", "visual", "ios"]
---
Skip Navigation
Watch faces
A watch face is a view that people choose as their primary view in watchOS.

The watch face is at the heart of the watchOS experience. People choose a watch face they want to see every time they raise their wrist, and they customize it with their favorite complications. People can even customize different watch faces for different activities, so they can switch to the watch face that fits their current context.

In watchOS 7 and later, people can share the watch faces they configure. For example, a fitness instructor might configure a watch face to share with their students by choosing the Gradient watch face, customizing the color, and adding their favorite health and fitness complications. When the students add the shared watch face to their Apple Watch or the Watch app on their iPhone, they get a custom experience without having to configure it themselves.

You can also configure a watch face to share from within your app, on your website, or through Messages, Mail, or social media. Offering shareable watch faces can help you introduce more people to your complications and your app.

Best practices

Help people discover your app by sharing watch faces that feature your complications. Ideally, you support multiple complications so that you can showcase them in a shareable watch face and provide a curated experience. For some watch faces, you can also specify a system accent color, images, or styles. If people add your watch face but haven't installed your app, the system prompts them to install it.

Display a preview of each watch face you share. Displaying a preview that highlights the advantages of your watch face can help people visualize its benefits. You can get a preview by using the iOS Watch app to email the watch face to yourself. The preview includes an illustrated device bezel that frames the face and is suitable for display on websites and in watchOS and iOS apps. Alternatively, you can replace the illustrated bezel with a high-fidelity hardware bezel that you can download from Apple Design Resources and composite onto the preview. For developer guidance, see Sharing an Apple Watch face.

Aim to offer shareable watch faces for all Apple Watch devices. Some watch faces are available on Series 4 and later -- such as California, Chronograph Pro, Gradient, Infograph, Infograph Modular, Meridian, Modular Compact, and Solar Dial -- and Explorer is available on Series 3 (with cellular) and later. If you use one of these faces in your configuration, consider offering a similar configuration using a face that's available on Series 3 and earlier. To help people make a choice, you can clearly label each shareable watch face with the devices it supports.

Respond gracefully if people choose an incompatible watch face. The system sends your app an error when people try to use an incompatible watch face on Series 3 or earlier. In this scenario, consider immediately offering an alternative configuration that uses a compatible face instead of displaying an error. Along with the previews you provide, help people understand that they might receive an alternative watch face if they choose a face that isn't compatible with their Apple Watch.

Platform considerations

Not supported in iOS, iPadOS, macOS, tvOS, or visionOS.

Resources
Related

Apple Design Resources -- Product Bezels

Developer documentation

Sharing an Apple Watch face -- ClockKit

Current page is Watch faces
Supported platforms
Watch faces
Best practices
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/watch-faces

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
