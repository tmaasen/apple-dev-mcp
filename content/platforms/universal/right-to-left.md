---
title: "Right to left"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/right-to-left
id: universal-right-to-left
lastUpdated: 2025-06-25T18:29:04.028Z
extractionMethod: crawlee
qualityScore: 0.640
confidence: 0.840
contentLength: 11039
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "right to left", "buttons", "controls", "design", "icons", "images", "interface", "layout"]
---
## Summary

Skip Navigation
Right to left
Support right-to-left languages like Arabic and Hebrew by reversing your interface as needed to match the reading direction of the related scripts.

Skip Navigation
Right to left
Support right-to-left languages like Arabic and Hebrew by reversing your interface as needed to match the reading direction of the related scripts.

When people choose a language for their device -- or just your app or game -- they expect the interface to adapt in various ways (to learn more, see Localization).

System-provided UI frameworks support right-to-left (RTL) by default, allowing system-provided UI components to flip automatically in the RTL context. If you use system-provided elements and standard layouts, you might not need to make any changes to your app's automatically reversed interface.

If you want to fine-tune your layout or enhance specific localizations to adapt to different currencies, numerals, or mathematical symbols that can occur in various locales in countries that use RTL languages, follow these guidelines.

Text alignment

Adjust text alignment to match the interface direction, if the system doesn't do so automatically. For example, if you left-align text with content in the left-to-right (LTR) context, right-align the text to match the content's mirrored position in the RTL context.

Left-aligned text in the LTR context

Right-aligned content in the RTL context

Align a paragraph based on its language, not on the current context. When the alignment of a paragraph -- defined as three or more lines of text -- doesn't match its language, it can be difficult to read. For example, right-aligning a paragraph that consists of LTR text can make the beginning of each line difficult to see. To improve readability, continue aligning one- and two-line text blocks to match the reading direction of the current context, but align a paragraph to match its language.

A left-aligned paragraph in the RTL context

A right-aligned paragraph in the RTL context

Use a consistent alignment for all text items in a list. To ensure a comfortable reading and scanning experience, reverse the alignment of all items in a list, including items that are displayed in a different script.

Right-aligned content in the RTL context

Mixed alignment in the RTL content

Numbers and characters

Different RTL languages can use different number systems. For example, Hebrew text uses Western Arabic numerals, whereas Arabic text might use either Western or Eastern Arabic numerals. The use of Western and Eastern Arabic numerals varies among countries and regions and even among areas within the same country or region.

If your app covers mathematical concepts or other number-centric topics, it's a good idea to identify the appropriate way to display such information in each locale you support. In contrast, apps that don't address number-related topics can generally rely on system-provided number representations.

Western Arabic numerals

Eastern Arabic numerals

Don't reverse the order of numerals in a specific number. Regardless of the current language or the surrounding content, the digits in a specific number -- such as "541," a phone number, or a credit card number -- always appear in the same order.

Latin

Hebrew

Arabic (Western Arabic numerals)

Arabic (Eastern Arabic numerals)

Reverse the order of numerals that show progress or a counting direction; never flip the numerals themselves. Controls like progress bars, sliders, and rating controls often include numerals to clarify their meaning. If you use numerals in this way, be sure to reverse the order of the numerals to match the direction of the flipped control. Also reverse a sequence of numerals if you use the sequence to communicate a specific order.

Latin

Arabic (Eastern Arabic numerals)

Hebrew

Arabic (Western Arabic numerals)

Controls

Flip controls that show progress from one value to another. Because people tend to view forward progress as moving in the same direction as the language they read, it makes sense to flip controls like sliders and progress indicators in the RTL context. When you do this, also be sure to reverse the positions of the accompanying glyphs or images that depict the beginning and ending values of the control.

Directional controls in the LTR context

Directional controls in the RTL context

Flip controls that help people navigate or access items in a fixed order. For example, in the RTL context, a back button must point to the right so the flow of screens matches the reading order of the RTL language. Similarly, next or previous buttons that let people access items in an ordered list need to flip in the RTL context to match the reading order.

Preserve the direction of a control that refers to an actual direction or points to an onscreen area. For example, if you provide a control that means "to the right," it must always point right, regardless of the current context.

Visually balance adjacent Latin and RTL scripts when necessary. In buttons, labels, and titles, Arabic or Hebrew text can appear too small when next to uppercased Latin text, because Arabic and Hebrew don't include uppercase letters. To visually balance Arabic or Hebrew text with Latin text that uses all capitals, it often works well to increase the RTL font size by about 2 points.

Arabic and Hebrew text can look too small next to uppercased Latin text of the same font size.

You can slightly increase the font size of Arabic and Hebrew text to visually balance uppercased Latin text.

Images

Avoid flipping images like photographs, illustrations, and general artwork. Flipping an image often changes the image's meaning; flipping a copyrighted image could be a violation. If an image's content is strongly connected to reading direction, consider creating a new version of the image instead of flipping the original.

Reverse the positions of images when their order is meaningful. For example, if you display multiple images in a specific order like chronological, alphabetical, or favorite, reverse their positions to preserve the order's meaning in the RTL context.

Items with meaningful positions in the LTR context

Items with meaningful positions in the RTL context

Interface icons

When you use SF Symbols to supply interface icons for your app, you get variants for the RTL context and localized symbols for Arabic and Hebrew, among other languages. If you create custom symbols, you can specify their directionality. For developer guidance, see Creating custom symbol images for your app.

LTR variants of directional symbols

RTL variants of directional symbols

Flip interface icons that represent text or reading direction. For example, if an interface icon uses left-aligned bars to represent text in the LTR context, right-align the bars in the RTL context.

LTR variant of a symbol that represents text

RTL variant of a symbol that represents text

Consider creating a localized version of an interface icon that displays text. Some interface icons include letters or words to help communicate a script-related concept, like font-size choice or a signature. If you have a custom interface icon that needs to display actual text, consider creating a localized version. For example, SF Symbols offers different versions of the signature, rich-text, and I-beam pointer symbols for use with Latin, Hebrew, and Arabic text, among others.

Latin

Hebrew

Arabic

If you have a custom interface icon that uses letters or words to communicate a concept unrelated to reading or writing, consider designing an alternative image that doesn't use text.

Flip an interface icon that shows forward or backward motion. When something moves in the same direction that people read, they typically interpret that direction as forward; when something moves in the opposite direction, people tend to interpret the direction as backward. An interface icon that depicts an object moving forward or backward needs to flip in the RTL context to preserve the meaning of the motion. For example, an icon that represents a speaker typically shows sound waves emanating forward from the speaker. In the LTR context, the sound waves come from the left, so in the RTL context, the icon needs to flip to show the waves coming from the right.

LTR variant of a symbol that depicts forward motion

RTL variant of a symbol that depicts forward motion

Don't flip logos or universal signs and marks. Displaying a flipped logo confuses people and can have legal repercussions. Always display a logo in its original form, even if it includes text. People expect universal symbols and marks like the checkmark to have a consistent appearance, so avoid flipping them.

A logo

A universal symbol or mark

In general, avoid flipping interface icons that depict real-world objects. Unless you use the object to indicate directionality, it's best to avoid flipping an icon that represents a familiar item. For example, clocks work the same everywhere, so a traditional clock interface icon needs to look the same regardless of language direction. Some interface icons might seem to reference language or reading direction because they represent items that are slanted for right-handed use. However, most people are right-handed, so flipping an icon that shows a right-handed tool isn't necessary and might be confusing.

Before merely flipping a complex custom interface icon, consider its individual components and the overall visual balance. In some cases, a component -- like a badge, slash, or magnifying glass -- needs to adhere to a visual design language regardless of localization. For example, SF Symbols maintains visual consistency by using the same backslash to represent the prohibition or negation of a symbol's meaning in both LTR and RTL versions.

LTR variant of a symbol that includes a backslash

RTL variant of a symbol that includes a backslash

In other cases, you might need to flip a component (or its position) to ensure the localized version of the icon still makes sense. For example, if a badge represents the actual UI that people see in your app, it needs to flip if your UI flips. Alternatively, if a badge modifies the meaning of an interface icon, consider whether flipping the badge preserves both the modified meaning and the overall visual balance of the icon. In the images shown below, the badge doesn't depict an object in the UI, but keeping it in the top-right corner visually unbalances the cart.

If your custom interface icon includes a component that can imply handedness, like a tool, consider preserving the orientation of the tool while flipping the base image if necessary.

LTR variant of a symbol that depicts a tool

RTL variant of a symbol that depicts a tool

Platform considerations

No additional considerations for iOS, iPadOS, macOS, tvOS, visionOS, or watchOS.

Resources
Related

Layout

Inclusion

SF Symbols

Developer documentation

Localization

Preparing views for localization -- SwiftUI

Videos
Enhance your app's multilingual experience
Design for Arabic
Current page is Right to left
Supported platforms
Right to left
Text alignment
Numbers and characters
Controls
Images
Interface icons
Platform considerations
Resources
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/right-to-left

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
