---
title: "Nfc"
platform: universal
category: technologies
url: https://developer.apple.com/design/human-interface-guidelines/nfc
id: nfc-universal
lastUpdated: 2025-06-30T12:46:42.408Z
extractionMethod: enhanced-turndown
qualityScore: 0.711
confidence: 0.911
contentLength: 2878
structureScore: 0.400
cleaningScore: 0.113
hasCodeExamples: false
hasImages: false
keywords: ["nfc", "near", "field", "communication", "allows", "devices", "within", "few", "centimeters", "each"]
---
## Overview

NFC Near-field communication (NFC) allows devices within a few centimeters of each other to exchange information wirelessly. iOS apps running on supported devices can use NFC scanning to read data from electronic tags attached to real-world objects. For example, a person can scan a toy to connect it with a video game, a shopper can scan an in-store sign to access coupons, or a retail employee can scan products to track inventory. In-app tag reading An app can support single- or multiple-object scanning when the app is active, and display a scanning sheet whenever people are about to scan something. Don’t encourage people to make contact with physical objects. To scan a tag, an iOS device must simply be within close proximity of the tag. It doesn’t need to actually touch the tag. Use terms like scan and hold near instead of tap and touch when asking people to scan objects. Use approachable terminology. Near-field communication may be unfamiliar to some people. To make it approachable, avoid referring to technical, developer-oriented terms like NFC, Core NFC, Near-field communication, and tag. Instead, use friendly, conversational terms that most people will understand. Use Don’t use Scan the \[object name\]. Scan the NFC tag. Hold your iPhone near the \[object name\] to learn more about it. To use NFC scanning, tap your phone to the \[object\]. Provide succinct instructional text for the scanning sheet. Provide a complete sentence, in sentence case, with ending punctuation. Identify the object to scan, and revise the text appropriately for subsequent scans. Keep the text short to avoid truncation. First scan Subsequent scans Hold your iPhone near the \[object name\] to learn more about it. Now hold your iPhone near another \[object name\]. Background tag reading Background tag reading lets people scan tags quickly any time, without needing to first open your app and initiate scanning. On devices that support background tag reading, the system automatically looks for nearby compatible tags whenever the screen is illuminated. After detecting and matching a tag with an app, the system shows a notification that the people can tap to send the tag data to the app for processing. Note that background reading isn’t available when an NFC scanning sheet is visible, Wallet or Apple Pay are in use, cameras are in use, the device is in Airplane Mode, and the device is locked after a restart. Support both background and in-app tag reading. Your app must still provide an in-app way to scan tags, for people with devices that don’t support background tag reading. Platform considerations No additional considerations for iOS or iPadOS. Not supported in macOS, tvOS, visionOS, or watchOS. Resources Developer documentation Core NFC Current page is NFC Supported platforms NFC In-app tag reading Background tag reading Platform considerations Resources

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/nfc

This content was extracted with good confidence. Structure and guidelines have been enhanced for better usability.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
