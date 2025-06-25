---
title: "Color wells"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/color-wells
id: universal-color-wells
lastUpdated: 2025-06-25T18:35:29.743Z
extractionMethod: crawlee
qualityScore: 0.331
confidence: 0.531
contentLength: 1417
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "color wells", "color", "design", "interface", "navigation", "selection", "system", "visual"]
---
Skip Navigation
Color wells
A color well lets people adjust the color of text, shapes, guides, and other onscreen elements.

A color well displays a color picker when people tap or click it. This color picker can be the system-provided one or a custom interface that you design.

Best practices

Consider the system-provided color picker for a familiar experience. Using the built-in color picker provides a consistent experience, in addition to letting people save a set of colors they can access from any app. The system-defined color picker can also help provide a familiar experience when developing apps across iOS, iPadOS, and macOS.

Platform considerations

No additional considerations for iOS, iPadOS, or visionOS. Not supported in tvOS or watchOS.

macOS

When people click a color well, it receives a highlight to provide visual confirmation that it's active. It then opens a color picker so people can choose a color. After they make a selection, the color well updates to show the new color.

Color wells also support drag and drop, so people can drag colors from one color well to another, and from the color picker to a color well.

Resources
Related

Color

Developer documentation

UIColorWell -- UIKit

UIColorPickerViewController -- UIKit

NSColorWell -- AppKit

Color Programming Topics

Current page is Color wells
Supported platforms
Color wells
Best practices
Platform considerations
Resources

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

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/color-wells

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
