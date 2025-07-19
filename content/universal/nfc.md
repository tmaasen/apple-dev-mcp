---
title: Nfc
platform: universal
category: technologies
url: https://developer.apple.com/design/human-interface-guidelines/nfc
quality_score: 0.1
content_length: 2988
last_updated: 2025-07-19T23:18:55.110Z
keywords: ["nfc","universal","technologies","navigation","system"]
has_code_examples: false
has_images: false
is_fallback: true
---

# This page requires JavaScript.

Please turn on JavaScript in your browser and refresh the page to view its content.

Skip Navigation NFCNear-field communication (NFC) allows devices within a few centimeters of each other to exchange information wirelessly.iOS apps running on supported devices can use NFC scanning to read data from electronic tags attached to real-world objects. For example, a person can scan a toy to connect it with a video game, a shopper can scan an in-store sign to access coupons, or a retail employee can scan products to track inventory.In-app tag readingAn app can support single- or multiple-object scanning when the app is active, and display a scanning sheet whenever people are about to scan something.Don’t encourage people to make contact with physical objects. To scan a tag, an iOS device must simply be within close proximity of the tag. It doesn’t need to actually touch the tag. Use terms like scan and hold near instead of tap and touch when asking people to scan objects.Use approachable terminology. Near-field communication may be unfamiliar to some people. To make it approachable, avoid referring to technical, developer-oriented terms like NFC, Core NFC, Near-field communication, and tag. Instead, use friendly, conversational terms that most people will understand.UseDon’t useScan the \[object name\].Scan the NFC tag.Hold your iPhone near the \[object name\] to learn more about it.To use NFC scanning, tap your phone to the \[object\].Provide succinct instructional text for the scanning sheet. Provide a complete sentence, in sentence case, with ending punctuation. Identify the object to scan, and revise the text appropriately for subsequent scans. Keep the text short to avoid truncation.First scanSubsequent scansHold your iPhone near the \[object name\] to learn more about it.Now hold your iPhone near another \[object name\].Background tag readingBackground tag reading lets people scan tags quickly any time, without needing to first open your app and initiate scanning. On devices that support background tag reading, the system automatically looks for nearby compatible tags whenever the screen is illuminated. After detecting and matching a tag with an app, the system shows a notification that the people can tap to send the tag data to the app for processing. Note that background reading isn’t available when an NFC scanning sheet is visible, Wallet or Apple Pay are in use, cameras are in use, the device is in Airplane Mode, and the device is locked after a restart.Support both background and in-app tag reading. Your app must still provide an in-app way to scan tags, for people with devices that don’t support background tag reading.Platform considerationsNo additional considerations for iOS or iPadOS. Not supported in macOS, tvOS, visionOS, or watchOS.ResourcesDeveloper documentationCore NFC Current page is NFC Supported platforms NFC In-app tag reading Background tag reading Platform considerations Resources