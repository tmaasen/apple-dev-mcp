---
title: "iOS Color"
platform: iOS
category: color-and-materials
url: https://developer.apple.com/design/human-interface-guidelines/color
id: ios-ios-color
lastUpdated: 2025-06-25T02:52:53.068Z
---
## Table of Contents

- [iOS Color](#ios-color)
- [Dynamic Colors](#dynamic-colors)
  - [System Colors](#system-colors)
  - [Semantic Colors](#semantic-colors)
- [Color Guidelines](#color-guidelines)
  - [Accessibility](#accessibility)
  - [Best Practices](#best-practices)
  - [Liquid Glass Integration](#liquid-glass-integration)
- [Color Implementation](#color-implementation)
- [Code Examples](#code-examples)
  - [System Colors](#system-colors)
- [Design Specifications](#design-specifications)
  - [System Colors](#system-colors)
  - [Contrast Requirements](#contrast-requirements)
- [Related Guidelines](#related-guidelines)

# iOS Color

Color enhances communication, evokes emotion, and provides visual continuity across your app's interface.

## Dynamic Colors

iOS provides dynamic colors that automatically adapt to both light and dark appearance modes, ensuring your interface remains beautiful and accessible.

### System Colors
- **Primary**: Blue (#007AFF) - Primary actions and selected states
- **Secondary**: Gray (#8E8E93) - Secondary text and inactive elements  
- **Success**: Green (#34C759) - Success states and positive actions
- **Warning**: Orange (#FF9500) - Warning states and cautionary actions
- **Danger**: Red (#FF3B30) - Error states and destructive actions

### Semantic Colors
Use semantic colors to communicate meaning:
- **Label**: Primary text color that adapts to appearance mode
- **Secondary Label**: Secondary text with appropriate contrast
- **Background**: Primary background color for your interface
- **Secondary Background**: Grouped content backgrounds

## Color Guidelines

### Accessibility
- Ensure sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey important information
- Test colors with various accessibility settings
- Consider color blindness when choosing color combinations

### Best Practices
- Use dynamic colors that adapt to appearance modes
- Maintain visual hierarchy through color choices
- Be consistent with color usage throughout your app
- Test your color palette across different devices and lighting conditions

### Liquid Glass Integration
With the new Liquid Glass design system:
- Colors now feature adaptive properties that respond to environmental lighting
- Enhanced color depth with translucent overlays
- Automatic color harmonization across system elements
- Real-time color adaptation based on content and context

---

This content is based on Apple's Human Interface Guidelines for iOS Color.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/color

## Color Implementation

- Always use semantic colors for automatic dark mode adaptation
- Test color combinations with accessibility settings enabled
- Verify contrast ratios meet WCAG guidelines
- Consider colorblind users when choosing color schemes


## Code Examples

### System Colors

Using adaptive system colors that work in light and dark modes

```swift
// SwiftUI
struct ContentView: View {
    var body: some View {
        VStack {
            Text("Primary Text")
                .foregroundColor(.primary)
            
            Text("Secondary Text")
                .foregroundColor(.secondary)
            
            Rectangle()
                .fill(Color.accentColor)
        }
        .background(Color(.systemBackground))
    }
}
```



## Design Specifications

### System Colors

- **Blue**: #007AFF / #0A84FF
- **Green**: #34C759 / #30D158
- **Red**: #FF3B30 / #FF453A

### Contrast Requirements

- **Normal Text**: 4.5:1 minimum ratio
- **Large Text (18pt+)**: 3:1 minimum ratio



## Related Guidelines

- [Accessibility Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility) - Color accessibility and contrast requirements

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/color

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
