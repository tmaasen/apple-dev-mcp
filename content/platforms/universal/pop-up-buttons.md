---
title: "Pop-up buttons"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons
id: universal-pop-up-buttons
lastUpdated: 2025-06-25T18:34:14.953Z
extractionMethod: crawlee
qualityScore: 0.329
confidence: 0.529
contentLength: 2577
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "pop-up buttons", "buttons", "controls", "interface", "navigation", "selection", "ios", "ipad"]
---
Skip Navigation
Pop-up buttons
A pop-up button displays a menu of mutually exclusive options.

After people choose an item from a pop-up button's menu, the menu closes, and the button can update its content to indicate the current selection.

Best practices

Use a pop-up button to present a flat list of mutually exclusive options or states. A pop-up button helps people make a choice that affects their content or the surrounding view. Use a pull-down button instead if you need to:

Offer a list of actions

Let people select multiple items

Include a submenu

Provide a useful default selection. A pop-up button can update its content to identify the current selection, but if people haven't made a selection yet, it shows the default item you specify. When possible, make the default selection an item that most people are likely to want.

Give people a way to predict a pop-up button's options without opening it. For example, you can use an introductory label or a button label that describes the button's effect, giving context to the options.

Consider using a pop-up button when space is limited and you don't need to display all options all the time. Pop-up buttons are a space-efficient way to present a wide array of choices.

If necessary, include a Custom option in a pop-up button's menu to provide additional items that are useful in some situations. Offering a Custom option can help you avoid cluttering the interface with items or controls that people need only occasionally. You can also display explanatory text below the list to help people understand how the options work.

Platform considerations

No additional considerations for iOS, macOS, or visionOS. Not supported in tvOS or watchOS.

iPadOS

Within a popover or modal view, consider using a pop-up button instead of a disclosure indicator to present multiple options for a list item. For example, people can quickly choose an option from the pop-up button's menu without navigating to a detail view. Consider using a pop-up button in this scenario when you have a fairly small, well-defined set of options that work well in a menu.

Resources
Related

Pull-down buttons

Buttons

Menus

Developer documentation

MenuPickerStyle -- SwiftUI

changesSelectionAsPrimaryAction -- UIKit

NSPopUpButton -- AppKit

Change log

Date

Changes

October 24, 2023

Added artwork.

September 14, 2022

Added a guideline on using a pop-up button in a popover or modal view in iPadOS.

Current page is Pop-up buttons
Supported platforms
Pop-up buttons
Best practices
Platform considerations
Resources
Change log

## Development Considerations

- Use system-provided button styles when possible for automatic Dark Mode support
- Ensure buttons respond to accessibility settings like Larger Text
- Test button interactions with VoiceOver and other assistive technologies
- Consider button placement in relation to safe areas on different devices


## Code Examples

### SwiftUI Button

Basic button implementation with proper styling and accessibility

```swift
Button("Button Title") {
    // Button action
    handleButtonTap()
}
.buttonStyle(.filled)
.frame(minWidth: 44, minHeight: 44)
.accessibilityLabel("Descriptive label")
.accessibilityHint("Double tap to perform action")
```



## Design Specifications

### Sizing

- **Minimum Touch Target**: 44×44 points
- **Corner Radius**: 8 points (standard)
- **Horizontal Padding**: 16 points minimum

### Typography

- **Font Family**: SF Pro Text
- **Font Size**: 17 points (body)
- **Font Weight**: Medium (.medium)

### Colors

- **Primary Blue**: #007AFF (light), #0A84FF (dark)
- **Success Green**: #34C759 (light), #30D158 (dark)



## Related Guidelines

- [universal Controls](https://developer.apple.com/design/human-interface-guidelines/controls) - Comprehensive guide to all interactive UI controls
- [Accessibility Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility) - Making buttons accessible to all users

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
