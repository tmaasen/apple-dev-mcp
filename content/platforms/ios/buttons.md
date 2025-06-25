---
title: "iOS Buttons"
platform: iOS
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/buttons
id: ios-ios-buttons
lastUpdated: 2025-06-25T02:52:56.347Z
---
## Table of Contents

- [iOS Buttons](#ios-buttons)
- [Button Guidelines](#button-guidelines)
  - [Design Principles](#design-principles)
  - [Button Types](#button-types)
    - [Filled Buttons](#filled-buttons)
    - [Tinted Buttons  ](#tinted-buttons-)
    - [Plain Buttons](#plain-buttons)
    - [System Buttons](#system-buttons)
  - [Button States](#button-states)
  - [Best Practices](#best-practices)
  - [Modern Design Integration](#modern-design-integration)
  - [Accessibility](#accessibility)
- [Development Considerations](#development-considerations)
- [Code Examples](#code-examples)
  - [SwiftUI Button](#swiftui-button)
  - [UIKit Button](#uikit-button)
- [Design Specifications](#design-specifications)
  - [Sizing](#sizing)
  - [Typography](#typography)
  - [Colors](#colors)
- [Related Guidelines](#related-guidelines)

# iOS Buttons

Buttons initiate app-specific actions and support multiple interaction methods including tap, touch and hold, and drag.

## Button Guidelines

### Design Principles
- Use clear, descriptive titles that convey the button's action
- Style buttons to indicate their level of emphasis within your interface hierarchy
- Consider button placement and spacing for optimal user experience
- Ensure buttons meet minimum touch target size (44x44 points)
- Use system buttons for standard actions when appropriate
- Consider using SF Symbols for button icons to maintain consistency

### Button Types

#### Filled Buttons
High emphasis actions with a filled background color. Use for primary actions that you want to draw attention to.

#### Tinted Buttons  
Medium emphasis buttons with colored text and background tint. Good for secondary actions.

#### Plain Buttons
Low emphasis buttons with standard text styling. Use for tertiary actions or when you need minimal visual weight.

#### System Buttons
Standard iOS styled buttons that automatically adapt to system appearance settings.

### Button States
- **Normal**: Default button appearance
- **Highlighted**: Temporary state when button is being pressed
- **Selected**: Persistent state for toggle-style buttons
- **Disabled**: Non-interactive state with reduced opacity

### Best Practices
- Start button titles with verbs when possible (e.g., "Add Contact" not "Contact")
- Use title case for button labels
- Keep button titles short and descriptive
- Ensure sufficient contrast between button text and background
- Test buttons with accessibility features like VoiceOver enabled
- Group related buttons logically
- Consider the visual hierarchy when choosing button styles

### Modern Design Integration
With current iOS design system:
- Buttons support advanced materials with enhanced visual depth
- Adaptive colors automatically adjust between light and dark modes
- Enhanced visual effects include refined shadows and highlight details
- Latest API support in SwiftUI and UIKit for modern button styling

### Accessibility
- Ensure buttons have descriptive accessibility labels
- Support Dynamic Type for text scaling
- Maintain minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Test with assistive technologies
- Consider reducing motion for users with vestibular disorders

---

This content is based on Apple's Human Interface Guidelines for iOS.
© Apple Inc. All rights reserved. For official and detailed information, visit:
https://developer.apple.com/design/human-interface-guidelines/buttons

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

### UIKit Button

UIButton configuration for iOS with proper styling

```swift
let button = UIButton(type: .system)
button.setTitle("Button Title", for: .normal)
button.backgroundColor = .systemBlue
button.setTitleColor(.white, for: .normal)
button.layer.cornerRadius = 8
button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
button.frame = CGRect(x: 0, y: 0, width: 120, height: 44)

// Accessibility
button.accessibilityLabel = "Descriptive label"
button.accessibilityHint = "Double tap to perform action"
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

- [iOS Controls](https://developer.apple.com/design/human-interface-guidelines/controls) - Comprehensive guide to all interactive UI controls
- [Accessibility Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility) - Making buttons accessible to all users

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/buttons

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
