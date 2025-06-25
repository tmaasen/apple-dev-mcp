---
title: "Navigation and search"
platform: universal
category: navigation
url: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search
id: universal-navigation-and-search
lastUpdated: 2025-06-25T18:29:30.766Z
extractionMethod: crawlee
qualityScore: 0.067
confidence: 0.067
contentLength: 134
hasCodeExamples: false
hasImages: false
keywords: ["universal", "navigation", "navigation and search", "controls", "search"]
---
Skip Navigation
Navigation and search
Path controls
Search fields
Sidebars
Tab bars
Token fields
Current page is Navigation and search

## Implementation Notes

- Use NavigationView/NavigationStack for SwiftUI or UINavigationController for UIKit
- Configure navigation bar appearance for both light and dark modes
- Ensure navigation hierarchy is logical and predictable for users
- Test navigation with different screen sizes and orientations


## Code Examples

### SwiftUI Navigation

Navigation setup with proper hierarchy and title configuration

```swift
NavigationView {
    List {
        // Your content here
        ForEach(items) { item in
            NavigationLink(destination: DetailView(item: item)) {
                Text(item.title)
            }
        }
    }
    .navigationTitle("Title")
    .navigationBarTitleDisplayMode(.large)
    .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
            Button("Add") {
                // Add action
            }
        }
    }
}
```



## Design Specifications

### Navigation Bar

- **Height**: 44 points (compact), 96 points (large title)
- **Title Font**: SF Pro Display, 17pt (regular), 34pt (large)



## Related Guidelines

- [universal Layout Guidelines](https://developer.apple.com/design/human-interface-guidelines/layout) - Layout principles and navigation structure

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
