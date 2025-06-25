---
title: "Menus"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/menus
id: universal-menus
lastUpdated: 2025-06-25T18:33:31.926Z
extractionMethod: crawlee
qualityScore: 0.660
confidence: 0.860
contentLength: 11594
hasCodeExamples: true
hasImages: false
keywords: ["universal", "visual-design", "menus", "buttons", "controls", "gestures", "icons", "input", "interface", "layout"]
---
## Summary

Skip Navigation
Menus
A menu reveals its options when people interact with it, making it a space-efficient way to present commands in your app or game.

Skip Navigation
Menus
A menu reveals its options when people interact with it, making it a space-efficient way to present commands in your app or game.

Menus are ubiquitous in apps and games, so most people already know how to use them. Whether you use system-provided components or custom ones, people expect menus to behave in familiar ways. For example, people understand that opening a menu reveals one or more menu items, each of which represents a command, option, or state that affects the current selection or context. The guidance for labeling and organizing menu items applies to all types of menus in all experiences.

Note

Several system-provided components also include menus that support specific use cases. For example, a pop-up button or pull-down button can reveal a menu of options directly relating to its action; a context menu lets people access a small number of frequently used actions relevant to their current view or task; and in macOS, menu bar menus contain all the commands people can perform in the app or game.

Labels

A menu item's label describes what it does and may include a symbol if it helps to clarify meaning. In an app, a menu item can also display the associated keyboard command, if there is one; in a game, a menu item rarely displays a keyboard command because a game typically needs to handle input from a wider range of devices and may offer game-specific mappings for various keys.

Note

Depending on menu layout, an iOS, iPadOS, or visionOS app can display a few unlabeled menu items that use only symbols or icons to identify them. For guidance, see visionOS and iOS, iPadOS.

For each menu item, write a label that clearly and succinctly describes it. In general, label a menu item that initiates an action using a verb or verb phrase that describes the action, such as View, Close, or Select. For guidance labeling menu items that show and hide something in the interface or show the currently selected state of something, see Toggled items. As with all the copy you write, let your app's or game's communication style guide the tone of the menu-item labels you create.

To be consistent with platform experiences, use title-style capitalization. Although a game might have a different writing style, generally prefer using title-style capitalization, which capitalizes every word except articles, coordinating conjunctions, and short prepositions, and capitalizes the last word in the label, regardless of the part of speech. For complete guidance on this style of capitalization in English, see title-style capitalization.

Remove articles like a, an, and the from menu-item labels to save space. In English, articles always lengthen labels, but rarely enhance understanding. For example, changing a menu-item label from View Settings to View the Settings doesn't provide additional clarification.

Show people when a menu item is unavailable. An unavailable menu item often appears dimmed and doesn't respond to interactions. If all of a menu's items are unavailable, the menu itself needs to remain available so people can open it and learn about the commands it contains.

Append an ellipsis to a menu item's label when the action requires more information before it can complete. The ellipsis character (…) signals that people need to input information or make additional choices, typically within another view.

Organization

Organizing menu items in ways that reflect how people use your app or game can make your experience feel straightforward and easy to use.

Prefer listing important or frequently used menu items first. People tend to start scanning a menu from the top, so listing high-priority items first often means that people can find what they want without reading the entire menu.

Consider grouping logically related items. For example, grouping editing commands like Copy, Cut, and Paste or camera commands like Look Up, Look Down, and Look Left can help people remember where to find them. To help people visually distinguish such groups, use a separator. Depending on the platform and type of menu, a separator appears between groups of items as a horizontal line or a short gap in the menu's background appearance.

Prefer keeping all logically related commands in the same group, even if the commands don't all have the same importance. For example, people generally use Paste and Match Style much less often than they use Paste, but they expect to find both commands in the same group that contains more frequently used editing commands like Copy and Cut.

Be mindful of menu length. People need more time and attention to read a long menu, which means they may miss the command they want. If a menu is too long, consider dividing it into separate menus. Alternatively, you might be able to use a submenu to shorten the list, such as listing difficulty levels in a submenu of a New Game menu item. The exception is when a menu contains user-defined or dynamically generated content, like the History and Bookmarks menus in Safari. People expect such a menu to accommodate all the items they add to it, so a long menu is fine, and scrolling is acceptable.

Submenus

Sometimes, a menu item can reveal a set of closely related items in a subordinate list called a submenu. A menu item indicates the presence of a submenu by displaying a symbol -- like a chevron -- after its label.

Use submenus sparingly. Each submenu adds complexity to the interface and hides the items it contains. You might consider creating a submenu when a term appears in more than two menu items in the same group. For example, instead of offering separate menu items for Sort by Date, Sort by Score, and Sort by Time, a game could present a menu item that uses a submenu to list the sorting options Date, Score, and Time. It generally works well to use the repeated term -- in this case, Sort by -- in the menu item's label to help people predict the contents of the submenu.

Limit the depth and length of submenus. It can be difficult for people to reveal multiple levels of hierarchical submenus, so it's generally best to restrict them to a single level. Also, if a submenu contains more than about five items, consider creating a new menu.

Make sure a submenu remains available even when its nested menu items are unavailable. A submenu item -- like all menu items -- needs to let people open it and learn about the commands it contains.

Prefer using a submenu to indenting menu items. Using indentation is inconsistent with the system and doesn't clearly express the relationships between the menu items.

Toggled items

Menu items often represent attributes or objects that people can turn on or off. If you want to avoid listing a separate menu item for each state, it can be efficient to create a single, toggled menu item that communicates the current state and lets people change it.

Consider using a changeable label that describes an item's current state. For example, instead of listing two menu items like Show Map and Hide Map, you could include one menu item whose label changes from Show Map to Hide Map, depending on whether the map is visible.

Include a verb if a changeable label isn't clear enough. For example, people might not know whether the changeable labels HDR On and HDR Off describe actions or states. If you needed to clarify that these items represent actions, you could add verbs to the labels, like Turn HDR On and Turn HDR Off.

If necessary, display both menu items instead of one toggled item. Sometimes, it helps people to view both actions or states at the same time. For example, a game could list both Take Account Online and Take Account Offline items, so when someone's account is online, only the Take Account Offline menu item appears available.

Consider using a checkmark to show that an attribute is currently in effect. It's easy for people to scan for checkmarks in a list of attributes to find the ones that are selected. For example, in the standard Format > Font menu, checkmarks can make it easy for people notice the styles that apply to selected text.

Consider offering a menu item that makes it easy to remove multiple toggled attributes. For example, if you let people apply several styles to selected text, it can work well to provide a menu item -- such as Plain -- that removes all applied formatting attributes at one time.

In-game menus

In-game menus give players ways to control gameplay as well as determine settings for the game as a whole.

Let players navigate in-game menus using the platform's default interaction method. People expect to use the same interactions to navigate your menus as they use for navigating other menus on the device. For example, players expect to navigate your game menus using touch in iOS and iPadOS, and direct and indirect gestures in visionOS.

Make sure your menus remain easy to open and read on all platforms you support. Each platform defines specific sizes that work best for fonts and interaction targets. Sometimes, scaling your game content to display on a different screen -- especially a mobile device screen -- can make in-game menus too small for people to read or interact with. If this happens, modify the size of the tap targets and consider alternative ways to communicate the menu's content. For guidance, see Typography and Touch controls.

Platform considerations

No additional considerations for macOS, tvOS, or watchOS.

iOS, iPadOS

In iOS and iPadOS, a menu can display items in one of the following three layouts.

Small. A row of four items appears at the top of the menu, above a list that contains the remaining items. For each item in the top row, the menu displays a symbol or icon, but no label.

Medium. A row of three items appears at the top of the menu, above a list that contains the remaining items. For each item in the top row, the menu displays a symbol or icon above a short label.

Large (the default). The menu displays all items in a list.

For developer guidance, see preferredElementSize.

Choose a small or medium menu layout when it can help streamline people's choices. Consider using the medium layout if your app has three important actions that people often want to perform. For example, Notes uses the medium layout to give people a quick way to perform the Scan, Lock, and Pin actions. Use the small layout only for closely related actions that typically appear as a group, such as Bold, Italic, Underline, and Strikethrough. For each action, use a recognizable symbol that helps people identify the action without a label.

visionOS

In visionOS, a menu can display items using the small or large layout styles that iOS and iPadOS define (for guidance, see iOS, iPadOS). As in macOS, an open menu in a visionOS window can appear outside of the window's boundaries.

When possible, prefer displaying a menu near the content it controls. Because people need to look at a menu item before tapping it, they might miss the item's effect if the content it controls is too far away.

Resources
Related

Pop-up buttons

Pull-down buttons

Context menus

The menu bar

Developer documentation

Menu -- SwiftUI

Menus and shortcuts -- UIKit

Menus -- AppKit

Change log

Date

Changes

June 10, 2024

Added guidance for in-game menus and included game-specific examples.

June 21, 2023

Updated to include guidance for visionOS.

September 14, 2022

Added guidelines for using the small, medium, and large menu layouts in iPadOS.

Current page is Menus
Supported platforms
Menus
Labels
Organization
Submenus
Toggled items
In-game menus
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/menus

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
