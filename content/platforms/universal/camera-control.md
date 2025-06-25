---
title: "Camera Control"
platform: universal
category: visual-design
url: https://developer.apple.com/design/human-interface-guidelines/camera-control
id: universal-camera-control
lastUpdated: 2025-06-25T18:31:05.149Z
extractionMethod: crawlee
qualityScore: 0.464
confidence: 0.564
contentLength: 4679
hasCodeExamples: false
hasImages: false
keywords: ["universal", "visual-design", "camera control", "controls", "interface", "navigation", "system", "visual", "dynamic type", "ios"]
---
Skip Navigation
Camera Control
The Camera Control provides direct access to your app's camera experience.

On iPhone 16 and iPhone 16 Pro models, the Camera Control quickly opens your app's camera experience to capture moments as they happen. When a person lightly presses the Camera Control, the system displays an overlay that extends from the device bezel.

The overlay allows people to quickly adjust controls. A person can view the available controls by lightly double-pressing the Camera Control. After selecting a control, they can slide their finger on the Camera Control to adjust a value to capture their content as they want.

Controls in the overlay

Anatomy

The Camera Control offers two types of controls for adjusting values or changing between options:

A slider provides a range of values to choose from, such as how much contrast to apply to the content.

A picker offers discrete options, such as turning a grid on and off in the viewfinder.

Slider control

Picker control

In addition to custom controls that you create, the system provides a set of standard controls that you can optionally include in the overlay to allow someone to adjust their camera's zoom and exposure.

Zoom factor control

Exposure bias control

Best practices

Use SF Symbols to represent control functionality. The system doesn't support custom symbols; instead, pick a symbol from SF Symbols that clearly denotes a control's behavior. iOS offers thousands of symbols you can use to represent the controls your app shows in the overlay. Symbols for controls don't represent their current state. To view available symbols, see the Camera & Photos section in the SF Symbols app.

The bolt.fill symbol that represents a control for the camera flash

The camera.filters symbol that represents a control for filters

Keep names of controls short. Control labels adhere to Dynamic Type sizes, and longer names may obfuscate the camera's viewfinder.

Include units or symbols with slider control values to provide context. Providing descriptive information in the overlay, such as EV, %, or a custom string, helps people understand what the slider controls. For developer guidance, see localizedValueFormat.

Value with context

Value without context

Define prominent values for a slider control. Prominent values are ones people choose most frequently, or values that are evenly spaced, like the major increments of zoom factor. When a person slides on the Camera Control to adjust a slider control, the system more easily lands on prominent values you define. For developer guidance, see prominentValues.

Make space for the overlay in the viewfinder. The overlay and control labels occupy the screen area adjacent to the Camera Control in both portrait and landscape orientations. To avoid overlapping the interface elements of your camera capture experience, place your UI outside of the overlay areas. Maximize the height and width of the viewfinder and allow the overlay to appear and disappear over it.

Minimize distractions in the viewfinder. When capturing a photo or video, people appreciate a large preview image with as few visual distractions as possible. Avoid duplicating controls, like sliders and toggles, in your UI and the overlay when the system displays the overlay.

Keep UI minimal.

Avoid showing controls in the viewfinder that people access in the overlay.

Enable or disable controls depending on the camera mode. For example, disable video controls when taking photos. The overlay supports multiple controls, but you can't remove or add controls at runtime.

Consider how to arrange your controls. Order commonly used controls toward the middle to allow quick access, and include lesser used controls on either side. When a person lightly presses the Camera Control to open the overlay again, the system remembers the last control they used in your app.

Allow people to use the Camera Control to launch your experience from anywhere. Create a locked camera capture extension that lets people configure the Camera Control to launch your app's camera experience from their locked device, the Home Screen, or from within other apps. For guidance, see Camera experiences on a locked device.

Platform considerations

Not supported in iPadOS, macOS, watchOS, tvOS, or visionOS.

Resources
Related

SF Symbols

Controls

Developer documentation

Enhancing your app experience with the Camera Control -- AVFoundation

AVCaptureControl -- AVFoundation

LockedCameraCapture

Change log

Date

Changes

September 9, 2024

New page.

Current page is Camera Control
Supported platforms
Camera Control
Anatomy
Best practices
Platform considerations
Resources
Change log
---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/camera-control

This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
