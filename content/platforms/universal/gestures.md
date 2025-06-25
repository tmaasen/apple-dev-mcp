---
title: "Gestures"
platform: universal
category: motion
url: https://developer.apple.com/design/human-interface-guidelines/gestures
id: universal-gestures
lastUpdated: 2025-06-25T02:54:29.225Z
---
## Table of Contents

- [Apple Human Interface Guidelines](#apple-human-interface-guidelines)
- [Note](#note)
- [Key Design Principles](#key-design-principles)
  - [Clarity](#clarity)
  - [Deference](#deference)
  - [Depth](#depth)
- [Current Apple Design System](#current-apple-design-system)
- [Essential UI Components Reference](#essential-ui-components-reference)
  - [Navigation & Structure](#navigation-structure)
  - [Buttons & Actions](#buttons-actions)
  - [Forms & Input](#forms-input)
  - [Lists & Collections](#lists-collections)
  - [Modals & Overlays](#modals-overlays)
  - [Media & Content](#media-content)
  - [System Integration](#system-integration)
  - [Icons & Visual Elements](#icons-visual-elements)
  - [Accessibility Features](#accessibility-features)
  - [Platform-Specific Features](#platformspecific-features)
    - [iOS Specific](#ios-specific)
    - [macOS Specific](#macos-specific)
    - [watchOS Specific](#watchos-specific)
    - [tvOS Specific](#tvos-specific)
    - [visionOS Specific](#visionos-specific)
- [Platform-Specific Guidelines](#platformspecific-guidelines)
  - [iOS](#ios)
  - [macOS](#macos)
  - [watchOS](#watchos)
  - [tvOS](#tvos)
  - [visionOS](#visionos)
- [Color and Materials](#color-and-materials)
  - [iOS Color Guidelines](#ios-color-guidelines)
  - [Material Design](#material-design)
- [Typography](#typography)
  - [iOS Typography Guidelines](#ios-typography-guidelines)
  - [Text Styles:](#text-styles)

# Apple Human Interface Guidelines

## Note
Apple's Human Interface Guidelines website is now a Single Page Application (SPA) that requires JavaScript to load content. This MCP server provides structured access to Apple's design guidelines.

## Key Design Principles

### Clarity
Text is legible at every size, icons are precise and lucid, adornments are subtle and appropriate, and a sharpened focus on functionality motivates the design.

### Deference
Fluid motion and a crisp, beautiful interface help people understand and interact with content while never competing with it.

### Depth
Distinct visual layers and realistic motion convey hierarchy, impart vitality, and facilitate understanding.

## Current Apple Design System

Apple's modern design language features:
- **Advanced Materials**: Sophisticated visual elements with depth and clarity
- **Adaptive Interface**: Intelligent adaptation across different environments and contexts
- **Cross-platform Consistency**: Unified design language across all Apple platforms
- **Modern APIs**: Latest SwiftUI, UIKit, and AppKit capabilities

## Essential UI Components Reference

### Navigation & Structure
- **Navigation Bars**: Primary navigation with titles, back buttons, and action items
- **Tab Bars**: Bottom navigation for primary app sections (2-5 tabs recommended)
- **Sidebars**: Multi-column navigation for iPad and larger screens
- **Toolbars**: Context-specific actions and tools
- **Search Bars**: Content discovery and filtering functionality
- **Breadcrumbs**: Hierarchical navigation indicators

### Buttons & Actions
- **Buttons**: Primary, secondary, and tertiary action triggers
- **Link Buttons**: Text-based navigation and actions
- **Toggle Buttons**: Binary state controls
- **Action Sheets**: Modal selection from multiple options
- **Context Menus**: Right-click or long-press actions

### Forms & Input
- **Text Fields**: Single-line text input with validation
- **Text Views**: Multi-line text editing areas
- **Switches**: Binary on/off controls
- **Sliders**: Continuous value selection
- **Steppers**: Incremental numeric adjustment
- **Pickers**: Selection from predefined lists
- **Date Pickers**: Date and time selection controls
- **Segmented Controls**: Mutually exclusive option selection

### Lists & Collections
- **Lists and Tables**: Structured data presentation
- **Collection Views**: Grid-based content layout
- **Outline Views**: Hierarchical data structure (macOS)
- **Source Lists**: Sidebar navigation lists (macOS)

### Modals & Overlays
- **Sheets**: Modal content presentation
- **Alerts**: Critical information and confirmations
- **Popovers**: Contextual information overlays
- **Activity Views**: Progress and loading indicators
- **Tooltips**: Helpful hints and explanations

### Media & Content
- **Images**: Static visual content with proper accessibility
- **Video Players**: Media playback controls and interfaces
- **Web Views**: Embedded web content
- **Maps**: Location-based information and interaction
- **Charts**: Data visualization components

### System Integration
- **Notifications**: Local and push notification design
- **Widgets**: Home Screen and Today View extensions
- **App Extensions**: Share, Action, and other system extensions
- **Shortcuts**: Siri integration and automation
- **Handoff**: Cross-device continuity features

### Icons & Visual Elements
- **SF Symbols**: Apple's comprehensive icon library
- **App Icons**: Application identifier and branding
- **System Icons**: Interface and navigation symbols
- **Custom Icons**: Brand-specific iconography guidelines
- **Visual Effects**: Blur, vibrancy, and material effects

### Accessibility Features
- **VoiceOver**: Screen reader support and optimization
- **Voice Control**: Voice navigation and interaction
- **Switch Control**: Alternative input methods
- **Dynamic Type**: Text size scaling and adaptation
- **Reduced Motion**: Animation and transition preferences
- **High Contrast**: Visual accessibility enhancements
- **Color Blind Support**: Color accessibility considerations

### Platform-Specific Features

#### iOS Specific
- **Dynamic Island**: Interactive notification area (iPhone 14 Pro+)
- **Control Center**: System controls and quick actions
- **Spotlight Search**: System-wide search functionality
- **Today View**: Widget dashboard
- **App Library**: App organization and discovery

#### macOS Specific
- **Menu Bar**: Global application menus
- **Dock**: Application launcher and switcher
- **Mission Control**: Window and desktop management
- **Launchpad**: Application grid launcher
- **Touch Bar**: Context-sensitive control strip

#### watchOS Specific
- **Digital Crown**: Rotary input mechanism
- **Complications**: Watch face data displays
- **Force Touch**: Pressure-sensitive interactions
- **Haptic Feedback**: Tactile response patterns

#### tvOS Specific
- **Focus Engine**: Navigation and selection system
- **Siri Remote**: Touch and motion controls
- **Top Shelf**: Featured content display

#### visionOS Specific
- **Spatial Design**: 3D interface layout principles
- **Eye Tracking**: Gaze-based selection
- **Hand Gestures**: Natural interaction methods
- **Immersive Spaces**: Full environment experiences

## Platform-Specific Guidelines

### iOS
- Focus on touch-first interactions
- Leverage iOS-specific features like Dynamic Island
- Implement proper gesture recognition
- Support accessibility features
- Use iOS design tokens and spacing

### macOS
- Utilize the full capabilities of the Mac
- Support keyboard navigation
- Implement proper window management
- Leverage macOS-specific controls
- Consider menu bar integration

### watchOS
- Design for quick, focused interactions
- Optimize for the small screen
- Implement complications effectively
- Support Digital Crown interactions
- Consider wrist gestures

### tvOS
- Focus on the viewing experience
- Support remote control navigation
- Implement proper focus management
- Design for the big screen
- Consider viewing distance

### visionOS
- Design for spatial computing
- Support natural gestures
- Implement proper depth and layering
- Consider user comfort and safety
- Design for mixed reality contexts

## Color and Materials

### iOS Color Guidelines
- Use dynamic colors that adapt to light and dark modes
- Ensure sufficient contrast for accessibility
- Consider color blindness in your color choices
- Use semantic colors for consistent meaning
- Test colors across different devices and conditions

### Material Design
- Implement proper material hierarchy
- Use appropriate opacity and blur effects
- Consider the material's context and purpose
- Test materials across different backgrounds
- Ensure materials enhance rather than distract

## Typography

### iOS Typography Guidelines
- Use Dynamic Type to support user font size preferences
- Choose appropriate font weights for hierarchy
- Ensure sufficient line spacing and character spacing
- Test typography with accessibility features
- Consider localization impact on text layout

### Text Styles:
- **Large Title**: 34pt, prominent page titles
- **Title 1**: 28pt, section titles
- **Title 2**: 22pt, subsection titles
- **Title 3**: 20pt, group titles
- **Headline**: 17pt, emphasized content
- **Body**: 17pt, primary content
- **Callout**: 16pt, secondary content
- **Subhead**: 15pt, descriptive content
- **Footnote**: 13pt, supplementary content
- **Caption 1**: 12pt, image captions
- **Caption 2**: 11pt, minimal text

For the most up-to-date and detailed information, please visit Apple's official Human Interface Guidelines at:
https://developer.apple.com/design/human-interface-guidelines/

---

This content provides general guidance based on Apple's Human Interface Guidelines.
© Apple Inc. All rights reserved. For official and detailed information, visit Apple's documentation.
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/gestures

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
