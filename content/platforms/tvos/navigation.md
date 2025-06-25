---
title: "tvOS Navigation"
platform: tvOS
category: navigation
url: https://developer.apple.com/design/human-interface-guidelines/navigation
id: tvos-tvos-navigation
lastUpdated: 2025-06-25T02:53:55.252Z
---
## Table of Contents

- [iOS Navigation](#ios-navigation)
- [Navigation Patterns](#navigation-patterns)
  - [Hierarchical Navigation](#hierarchical-navigation)
  - [Flat Navigation](#flat-navigation)
  - [Content-Driven Navigation](#contentdriven-navigation)
- [Navigation Bar](#navigation-bar)
  - [Guidelines](#guidelines)
  - [Elements](#elements)
- [Tab Bar](#tab-bar)
  - [Guidelines  ](#guidelines-)
  - [Best Practices](#best-practices)
- [Implementation Notes](#implementation-notes)
- [Code Examples](#code-examples)
  - [SwiftUI Navigation](#swiftui-navigation)
- [Design Specifications](#design-specifications)
  - [Navigation Bar](#navigation-bar)
- [Related Guidelines](#related-guidelines)

# iOS Navigation

Navigation enables movement through your app's information hierarchy and helps users understand where they are in your app.

## Navigation Patterns

### Hierarchical Navigation
Most apps use hierarchical navigation, which presents information in a tree-like structure where users navigate down through detailed information and back up through parent categories.

### Flat Navigation
Move between multiple content categories that don't have a hierarchical relationship.

### Content-Driven Navigation
Navigate freely through content, or the content itself defines the navigation.

## Navigation Bar

### Guidelines
- Use large titles when appropriate for your content hierarchy
- Keep navigation bar titles concise but descriptive
- Use standard navigation bar buttons when possible
- Consider the navigation bar's relationship to other interface elements
- Support both light and dark appearance modes

### Elements
- **Title**: Clear indication of current view context
- **Back Button**: Standard iOS back navigation with automatic title
- **Action Buttons**: Up to two buttons for primary actions (leading/trailing)
- **Search**: Integrated search functionality when content is searchable

## Tab Bar

### Guidelines  
- Limit tab bars to 2-5 tabs for optimal usability
- Use clear, recognizable icons paired with descriptive labels
- Ensure tab bar icons work well at small sizes
- Consider tab bar customization for user personalization
- Maintain visual consistency across all tab bar items

### Best Practices
- Use tab bars for peer information categories of similar importance
- Avoid using tab bars for actions, tools, or modes
- Make sure tab bar labels are clear and concise
- Test tab bar icons for accessibility and international markets

---

This content is based on Apple's Human Interface Guidelines for iOS Navigation.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/navigation

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

- [tvOS Layout Guidelines](https://developer.apple.com/design/human-interface-guidelines/layout) - Layout principles and navigation structure

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/navigation

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
