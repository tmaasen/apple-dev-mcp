---
title: Pop Up Buttons
platform: macOS
category: foundations
url: https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons
quality_score: 0.4
content_length: 1988
last_updated: 2025-07-20T03:12:50.544Z
keywords: ["pop up buttons","macos","foundations","selection","buttons","interface","controls"]
has_code_examples: false
has_images: false
is_fallback: false
---

Pop-up buttonsA pop-up button displays a menu of mutually exclusive options.After people choose an item from a pop-up button’s menu, the menu closes, and the button can update its content to indicate the current selection.Best practicesUse a pop-up button to present a flat list of mutually exclusive options or states. A pop-up button helps people make a choice that affects their content or the surrounding view. Use a pull-down button instead if you need to:Offer a list of actionsLet people select multiple itemsInclude a submenuProvide a useful default selection. A pop-up button can update its content to identify the current selection, but if people haven’t made a selection yet, it shows the default item you specify. When possible, make the default selection an item that most people are likely to want.Give people a way to predict a pop-up button’s options without opening it. For example, you can use an introductory label or a button label that describes the button’s effect, giving context to the options.Consider using a pop-up button when space is limited and you don’t need to display all options all the time. Pop-up buttons are a space-efficient way to present a wide array of choices.If necessary, include a Custom option in a pop-up button’s menu to provide additional items that are useful in some situations. Offering a Custom option can help you avoid cluttering the interface with items or controls that people need only occasionally. You can also display explanatory text below the list to help people understand how the options work. Not supported in tvOS or watchOS.iPadOSWithin a popover or modal view, consider using a pop-up button instead of a disclosure indicator to present multiple options for a list item. For example, people can quickly choose an option from the pop-up button’s menu without navigating to a detail view. Consider using a pop-up button in this scenario when you have a fairly small, well-defined set of options that work well in a menu.