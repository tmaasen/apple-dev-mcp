---
title: Disclosure Controls
platform: macOS
category: foundations
url: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
quality_score: 0.1
content_length: 3054
last_updated: 2025-07-19T23:20:08.927Z
keywords: ["disclosure controls","macos","foundations","navigation","controls","presentation","buttons"]
has_code_examples: false
has_images: false
is_fallback: true
---

# This page requires JavaScript.

Please turn on JavaScript in your browser and refresh the page to view its content.

Skip Navigation Disclosure controlsDisclosure controls reveal and hide information and functionality related to specific controls or views.Best practicesUse a disclosure control to hide details until they’re relevant. Place controls that people are most likely to use at the top of the disclosure hierarchy so they’re always visible, with more advanced functionality hidden by default. This organization helps people quickly find the most essential information without overwhelming them with too many detailed options.Disclosure trianglesA disclosure triangle shows and hides information and functionality associated with a view or a list of items. For example, Keynote uses a disclosure triangle to show advanced options when exporting a presentation, and the Finder uses disclosure triangles to progressively reveal hierarchy when navigating a folder structure in list view.A disclosure triangle points inward from the leading edge when its content is hidden and down when its content is visible. Clicking or tapping the disclosure triangle switches between these two states, and the view expands or collapses accordingly to accommodate the content.Provide a descriptive label when using a disclosure triangle. Make sure your labels indicate what is disclosed or hidden, like “Advanced Options.”For developer guidance, see NSButton.BezelStyle.disclosure.Disclosure buttonsA disclosure button shows and hides functionality associated with a specific control. For example, the macOS Save sheet shows a disclosure button next to the Save As text field. When people click or tap this button, the Save dialog expands to give advanced navigation options for selecting an output location for their document.A disclosure button points down when its content is hidden and up when its content is visible. Clicking or tapping the disclosure button switches between these two states, and the view expands or collapses accordingly to accommodate the content.Place a disclosure button near the content that it shows and hides. Establish a clear relationship between the control and the expanded choices that appear when a person clicks or taps a button.Use no more than one disclosure button in a single view. Multiple disclosure buttons add complexity and can be confusing.For developer guidance, see NSButton.BezelStyle.pushDisclosure.Platform considerationsNo additional considerations for macOS. Not supported in tvOS or watchOS.iOS, iPadOS, visionOSDisclosure controls are available in iOS, iPadOS, and visionOS with the SwiftUI DisclosureGroup view.ResourcesRelatedOutline viewsLists and tablesButtonsDeveloper documentationDisclosureGroup — SwiftUINSButton.BezelStyle.disclosure — AppKitNSButton.BezelStyle.pushDisclosure — AppKitVideos Stacks, Grids, and Outlines in SwiftUI Current page is Disclosure controls Supported platforms Disclosure controls Best practices Disclosure triangles Disclosure buttons Platform considerations Resources