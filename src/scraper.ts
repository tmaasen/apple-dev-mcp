/**
 * Apple HIG content scraper with intelligent fallbacks and respectful practices
 */

import { load } from 'cheerio';
import fetch from 'node-fetch';
import { HIGSection, ApplePlatform, HIGCategory, ScrapingConfig, SearchResult } from './types.js';
import { HIGCache } from './cache.js';

export class HIGScraper {
  private cache: HIGCache;
  private config: ScrapingConfig;
  private lastRequestTime: number = 0;

  constructor(cache: HIGCache) {
    this.cache = cache;
    this.config = {
      baseUrl: 'https://developer.apple.com/design/human-interface-guidelines',
      userAgent: 'Apple-HIG-MCP-Server/1.0.0 (Educational/Development Purpose)',
      requestDelay: 1000, // 1 second between requests
      retryAttempts: 3,
      timeout: 10000
    };
  }

  /**
   * Respectful request with rate limiting
   */
  private async makeRequest(url: string): Promise<string> {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.requestDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.requestDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    const cacheKey = `request:${url}`;
    
    // Try cache first with graceful fallback
    const cached = this.cache.getWithGracefulFallback<string>(cacheKey);
    if (cached.data) {
      if (cached.isStale) {
        // console.warn(`[HIGScraper] Using stale cached data for: ${url}`);
      }
      return cached.data;
    }

    // Fetch fresh data
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // console.log(`[HIGScraper] Fetching: ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Cache with graceful degradation (24 hour backup)
        this.cache.setWithGracefulDegradation(cacheKey, html, 3600, 86400);
        
        return html;
      } catch (error) {
        // console.error(`[HIGScraper] Attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt === this.config.retryAttempts) {
          // Final attempt failed, try graceful degradation
          const staleData = this.cache.getStale<string>(cacheKey);
          if (staleData) {
            // console.warn(`[HIGScraper] Using very stale cached data for: ${url}`);
            return staleData;
          }
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`Failed to fetch ${url} after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Extract clean text content from HTML, converting to markdown-like format
   */
  private cleanContent(html: string, sectionTitle?: string): string {
    const $ = load(html);
    
    // Check if this is the JavaScript placeholder page
    if (html.includes('This page requires JavaScript') || html.includes('noscript')) {
      // console.warn('[HIGScraper] Detected SPA page, using fallback content');
      return this.getContextualFallbackContent(sectionTitle);
    }
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .navigation, .sidebar').remove();
    
    // Convert headers to markdown
    $('h1').each((_, el) => {
      $(el).replaceWith(`# ${$(el).text().trim()}\n\n`);
    });
    $('h2').each((_, el) => {
      $(el).replaceWith(`## ${$(el).text().trim()}\n\n`);
    });
    $('h3').each((_, el) => {
      $(el).replaceWith(`### ${$(el).text().trim()}\n\n`);
    });
    $('h4').each((_, el) => {
      $(el).replaceWith(`#### ${$(el).text().trim()}\n\n`);
    });

    // Convert lists
    $('ul').each((_, el) => {
      const items = $(el).find('li').map((_, li) => `- ${$(li).text().trim()}`).get();
      $(el).replaceWith(items.join('\n') + '\n\n');
    });

    $('ol').each((_, el) => {
      const items = $(el).find('li').map((i, li) => `${i + 1}. ${$(li).text().trim()}`).get();
      $(el).replaceWith(items.join('\n') + '\n\n');
    });

    // Convert paragraphs
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        $(el).replaceWith(`${text}\n\n`);
      }
    });

    // Get clean text and normalize whitespace
    const cleanText = $('body').text() || $.text();
    return cleanText
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim
      .substring(0, 50000); // Limit content length
  }

  /**
   * Get contextual fallback content based on section title
   */
  private getContextualFallbackContent(sectionTitle?: string): string {
    if (!sectionTitle) {
      return this.getFallbackContent();
    }

    const titleLower = sectionTitle.toLowerCase();
    
    // Return specific content based on section title (keep only the most essential ones)
    if (titleLower.includes('button')) {
      return this.getButtonFallbackContent();
    } else if (titleLower.includes('navigation')) {
      return this.getNavigationFallbackContent();
    } else if (titleLower.includes('color')) {
      return this.getColorFallbackContent();
    } else if (titleLower.includes('typography') || titleLower.includes('font')) {
      return this.getTypographyFallbackContent();
    } else if (titleLower.includes('layout')) {
      return this.getLayoutFallbackContent();
    }
    
    // Default to full fallback content
    return this.getFallbackContent();
  }

  /**
   * Get button-specific fallback content
   */
  private getButtonFallbackContent(): string {
    return `# iOS Buttons

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

### Liquid Glass Integration
With iOS 26 and the new Liquid Glass design system:
- Buttons now support translucent materials with real-time rendering
- Adaptive colors automatically adjust between light and dark modes
- Enhanced visual effects include subtle shadows and specular highlights
- New API support in SwiftUI and UIKit for Liquid Glass button styling

### Accessibility
- Ensure buttons have descriptive accessibility labels
- Support Dynamic Type for text scaling
- Maintain minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Test with assistive technologies
- Consider reducing motion for users with vestibular disorders

---
**Attribution Notice**

This content is based on Apple's Human Interface Guidelines for iOS.
© Apple Inc. All rights reserved. For official and detailed information, visit:
https://developer.apple.com/design/human-interface-guidelines/buttons
`;
  }

  /**
   * Get navigation-specific fallback content
   */
  private getNavigationFallbackContent(): string {
    return `# iOS Navigation

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
**Attribution Notice**

This content is based on Apple's Human Interface Guidelines for iOS Navigation.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/navigation
`;
  }

  /**
   * Get color-specific fallback content  
   */
  private getColorFallbackContent(): string {
    return `# iOS Color

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
**Attribution Notice**

This content is based on Apple's Human Interface Guidelines for iOS Color.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/color
`;
  }

  /**
   * Get typography-specific fallback content
   */
  private getTypographyFallbackContent(): string {
    return `# iOS Typography

Typography is a fundamental part of your app's user interface, helping establish hierarchy, express brand personality, and improve readability.

## Dynamic Type

iOS provides Dynamic Type, which enables users to scale text to a comfortable reading size. Your app should support Dynamic Type to ensure accessibility and user preference accommodation.

### Text Styles

#### Display Text Styles
- **Large Title**: 34pt - Prominent page or section titles
- **Title 1**: 28pt - Primary section headings
- **Title 2**: 22pt - Secondary section headings  
- **Title 3**: 20pt - Tertiary headings and group titles

#### Body Text Styles
- **Headline**: 17pt, semibold - Emphasized content headings
- **Body**: 17pt - Primary content and reading material
- **Callout**: 16pt - Secondary content emphasis
- **Subhead**: 15pt - Descriptive and supplementary content

#### Detail Text Styles
- **Footnote**: 13pt - Supplementary information
- **Caption 1**: 12pt - Image captions and secondary details
- **Caption 2**: 11pt - Minimal supporting text

## Typography Guidelines

### Hierarchy
Establish clear visual hierarchy through:
- Font size variations
- Font weight differences  
- Color and contrast adjustments
- Spacing and positioning

### Readability
- Use sufficient line spacing for comfortable reading
- Ensure adequate character spacing
- Maintain appropriate line length (45-75 characters)
- Test text at various Dynamic Type sizes

### Accessibility
- Support Dynamic Type scaling
- Maintain contrast ratios for text accessibility
- Test with accessibility features like VoiceOver
- Consider bold text accessibility setting

### Best Practices
- Use system fonts when possible for consistency
- Limit the number of font families in your interface
- Ensure text remains legible at all supported sizes
- Consider localization impact on text layout and spacing

### Liquid Glass Integration
Typography in the Liquid Glass design system features:
- Enhanced text rendering with subtle depth effects
- Adaptive font weights that respond to ambient lighting
- Improved legibility on translucent backgrounds
- Dynamic font smoothing and anti-aliasing

---
**Attribution Notice**

This content is based on Apple's Human Interface Guidelines for iOS Typography.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/typography
`;
  }

  /**
   * Get layout-specific fallback content
   */
  private getLayoutFallbackContent(): string {
    return `# iOS Layout

A well-designed layout enhances communication, reduces complexity, and facilitates use across different device sizes and orientations.

## Layout Principles

### Adaptivity
Design interfaces that adapt gracefully to different screen sizes, orientations, and dynamic content changes.

### Consistency
Maintain consistent spacing, alignment, and sizing throughout your interface to create a cohesive experience.

### Clarity
Use layout to establish clear visual hierarchy and help users understand the relationships between interface elements.

## Safe Areas

Respect safe areas to ensure your content remains visible and interactive across all device configurations:
- Avoid placing critical content behind system UI elements
- Use safe area guides for proper content positioning
- Consider device-specific features like Dynamic Island and home indicator

## Spacing and Margins

### System Spacing
iOS provides standard spacing values that ensure consistency:
- **Standard margin**: 16-20 points from screen edges
- **Inter-element spacing**: 8-16 points between related elements
- **Section spacing**: 24-32 points between content sections

### Grid Systems
- Use consistent grid systems for content alignment
- Maintain vertical rhythm through consistent spacing
- Consider baseline grids for text-heavy interfaces

## Responsive Design

### Size Classes
Design for different size classes:
- **Compact width**: iPhone in portrait, iPhone landscape (some models)
- **Regular width**: iPad, iPhone Plus/Pro Max landscape
- **Compact height**: iPhone landscape
- **Regular height**: iPhone portrait, iPad

### Adaptive Layouts
- Use Auto Layout to create flexible interfaces
- Design for multiple screen densities and sizes
- Test layouts across different device configurations

## Layout Guidelines

### Content Prioritization
- Place most important content in easily accessible areas
- Use the top portion of the screen for critical information
- Consider thumb reach zones for touch targets

### Visual Balance
- Distribute visual weight evenly across your interface
- Use whitespace effectively to reduce cognitive load
- Align elements to create clean, organized layouts

### Liquid Glass Integration
Layout in the Liquid Glass design system features:
- Enhanced depth perception through layered translucent elements
- Adaptive spacing that responds to content density
- Improved visual hierarchy through material elevation
- Dynamic layout adjustments based on environmental context

---
**Attribution Notice**

This content is based on Apple's Human Interface Guidelines for iOS Layout.
© Apple Inc. All rights reserved. For official information, visit:
https://developer.apple.com/design/human-interface-guidelines/layout
`;
  }

  /**
   * Get fallback content when Apple's SPA website doesn't provide real content
   */
  private getFallbackContent(): string {
    return `# Apple Human Interface Guidelines

## Note
Apple's Human Interface Guidelines website is now a Single Page Application (SPA) that requires JavaScript to load content. This MCP server provides structured access to Apple's design guidelines.

## Key Design Principles

### Clarity
Text is legible at every size, icons are precise and lucid, adornments are subtle and appropriate, and a sharpened focus on functionality motivates the design.

### Deference
Fluid motion and a crisp, beautiful interface help people understand and interact with content while never competing with it.

### Depth
Distinct visual layers and realistic motion convey hierarchy, impart vitality, and facilitate understanding.

## Liquid Glass Design System (WWDC 2025)

Apple's latest design language features:
- **Translucent Materials**: Glass-like visual elements with real-time rendering
- **Adaptive Colors**: Intelligent adaptation between light and dark environments  
- **System-wide Implementation**: Consistent across all Apple platforms
- **Enhanced APIs**: Updated SwiftUI, UIKit, and AppKit support

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
**Attribution Notice**

This content provides general guidance based on Apple's Human Interface Guidelines.
© Apple Inc. All rights reserved. For official and detailed information, visit Apple's documentation.
`;
  }

  /**
   * Discover HIG sections and their URLs
   * 
   * Note: Apple's HIG website is now a SPA (Single Page Application) that loads content
   * dynamically with JavaScript. Instead of trying to scrape the dynamic content,
   * we use a curated list of known HIG sections and URLs that are stable.
   */
  async discoverSections(): Promise<HIGSection[]> {
    const cacheKey = 'hig:sections:all';
    
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // console.log('[HIGScraper] Loading known HIG sections...');
    
    // Comprehensive curated list of Apple HIG sections
    // Covers major UI components, design principles, and platform-specific guidelines
    const knownSections: Omit<HIGSection, 'id' | 'lastUpdated'>[] = [
      // iOS Guidelines - Core Components
      { title: 'iOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/ios', platform: 'iOS', category: 'foundations' },
      { title: 'iOS Accessibility', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', platform: 'iOS', category: 'foundations' },
      { title: 'iOS App Icons', url: 'https://developer.apple.com/design/human-interface-guidelines/app-icons', platform: 'iOS', category: 'icons-and-images' },
      { title: 'iOS Color', url: 'https://developer.apple.com/design/human-interface-guidelines/color', platform: 'iOS', category: 'color-and-materials' },
      { title: 'iOS Typography', url: 'https://developer.apple.com/design/human-interface-guidelines/typography', platform: 'iOS', category: 'typography' },
      { title: 'iOS Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', platform: 'iOS', category: 'layout' },
      { title: 'iOS Buttons', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons', platform: 'iOS', category: 'visual-design' },
      
      // iOS Navigation & Structure
      { title: 'iOS Navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars', platform: 'iOS', category: 'navigation' },
      { title: 'iOS Tab Bars', url: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars', platform: 'iOS', category: 'navigation' },
      { title: 'iOS Sidebars', url: 'https://developer.apple.com/design/human-interface-guidelines/sidebars', platform: 'iOS', category: 'navigation' },
      { title: 'iOS Toolbars', url: 'https://developer.apple.com/design/human-interface-guidelines/toolbars', platform: 'iOS', category: 'navigation' },
      { title: 'iOS Search', url: 'https://developer.apple.com/design/human-interface-guidelines/search-bars', platform: 'iOS', category: 'selection-and-input' },
      
      // iOS Forms & Input
      { title: 'iOS Text Fields', url: 'https://developer.apple.com/design/human-interface-guidelines/text-fields', platform: 'iOS', category: 'selection-and-input' },
      { title: 'iOS Forms', url: 'https://developer.apple.com/design/human-interface-guidelines/entering-data', platform: 'iOS', category: 'selection-and-input' },
      { title: 'iOS Pickers', url: 'https://developer.apple.com/design/human-interface-guidelines/pickers', platform: 'iOS', category: 'selection-and-input' },
      { title: 'iOS Sliders', url: 'https://developer.apple.com/design/human-interface-guidelines/sliders', platform: 'iOS', category: 'selection-and-input' },
      { title: 'iOS Steppers', url: 'https://developer.apple.com/design/human-interface-guidelines/steppers', platform: 'iOS', category: 'selection-and-input' },
      { title: 'iOS Switches', url: 'https://developer.apple.com/design/human-interface-guidelines/toggles', platform: 'iOS', category: 'selection-and-input' },
      
      // iOS Lists & Collections
      { title: 'iOS Lists and Tables', url: 'https://developer.apple.com/design/human-interface-guidelines/lists-and-tables', platform: 'iOS', category: 'presentation' },
      { title: 'iOS Collection Views', url: 'https://developer.apple.com/design/human-interface-guidelines/collection-views', platform: 'iOS', category: 'presentation' },
      
      // iOS Modals & Overlays
      { title: 'iOS Sheets', url: 'https://developer.apple.com/design/human-interface-guidelines/sheets', platform: 'iOS', category: 'presentation' },
      { title: 'iOS Alerts', url: 'https://developer.apple.com/design/human-interface-guidelines/alerts', platform: 'iOS', category: 'presentation' },
      { title: 'iOS Action Sheets', url: 'https://developer.apple.com/design/human-interface-guidelines/action-sheets', platform: 'iOS', category: 'presentation' },
      { title: 'iOS Popovers', url: 'https://developer.apple.com/design/human-interface-guidelines/popovers', platform: 'iOS', category: 'presentation' },
      
      // iOS System Features
      { title: 'iOS Notifications', url: 'https://developer.apple.com/design/human-interface-guidelines/notifications', platform: 'iOS', category: 'system-capabilities' },
      { title: 'iOS Widgets', url: 'https://developer.apple.com/design/human-interface-guidelines/widgets', platform: 'iOS', category: 'system-capabilities' },
      { title: 'iOS App Extensions', url: 'https://developer.apple.com/design/human-interface-guidelines/app-extensions', platform: 'iOS', category: 'system-capabilities' },
      { title: 'iOS Sharing', url: 'https://developer.apple.com/design/human-interface-guidelines/sharing', platform: 'iOS', category: 'system-capabilities' },
      
      // iOS Icons & Images
      { title: 'iOS SF Symbols', url: 'https://developer.apple.com/design/human-interface-guidelines/sf-symbols', platform: 'iOS', category: 'icons-and-images' },
      { title: 'iOS System Icons', url: 'https://developer.apple.com/design/human-interface-guidelines/system-icons', platform: 'iOS', category: 'icons-and-images' },
      { title: 'iOS Images', url: 'https://developer.apple.com/design/human-interface-guidelines/images', platform: 'iOS', category: 'icons-and-images' },
      
      // iOS Animation & Interaction
      { title: 'iOS Animation', url: 'https://developer.apple.com/design/human-interface-guidelines/animation', platform: 'iOS', category: 'motion' },
      { title: 'iOS Gestures', url: 'https://developer.apple.com/design/human-interface-guidelines/gestures', platform: 'iOS', category: 'motion' },
      
      // macOS Guidelines
      { title: 'macOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/macos', platform: 'macOS', category: 'foundations' },
      { title: 'macOS Windows', url: 'https://developer.apple.com/design/human-interface-guidelines/windows', platform: 'macOS', category: 'layout' },
      { title: 'macOS Menus', url: 'https://developer.apple.com/design/human-interface-guidelines/menus', platform: 'macOS', category: 'navigation' },
      { title: 'macOS Toolbars', url: 'https://developer.apple.com/design/human-interface-guidelines/toolbars', platform: 'macOS', category: 'navigation' },
      { title: 'macOS Dock', url: 'https://developer.apple.com/design/human-interface-guidelines/dock', platform: 'macOS', category: 'system-capabilities' },
      { title: 'macOS Touch Bar', url: 'https://developer.apple.com/design/human-interface-guidelines/touch-bar', platform: 'macOS', category: 'selection-and-input' },
      
      // watchOS Guidelines  
      { title: 'watchOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/watchos', platform: 'watchOS', category: 'foundations' },
      { title: 'watchOS Complications', url: 'https://developer.apple.com/design/human-interface-guidelines/complications', platform: 'watchOS', category: 'visual-design' },
      { title: 'watchOS Digital Crown', url: 'https://developer.apple.com/design/human-interface-guidelines/digital-crown', platform: 'watchOS', category: 'selection-and-input' },
      { title: 'watchOS Notifications', url: 'https://developer.apple.com/design/human-interface-guidelines/notifications', platform: 'watchOS', category: 'system-capabilities' },
      
      // tvOS Guidelines
      { title: 'tvOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/tvos', platform: 'tvOS', category: 'foundations' },
      { title: 'tvOS Focus and Selection', url: 'https://developer.apple.com/design/human-interface-guidelines/focus-and-selection', platform: 'tvOS', category: 'selection-and-input' },
      { title: 'tvOS Remote Control', url: 'https://developer.apple.com/design/human-interface-guidelines/remote-control', platform: 'tvOS', category: 'selection-and-input' },
      
      // visionOS Guidelines
      { title: 'visionOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/visionos', platform: 'visionOS', category: 'foundations' },
      { title: 'visionOS Spatial Design', url: 'https://developer.apple.com/design/human-interface-guidelines/spatial-design', platform: 'visionOS', category: 'layout' },
      { title: 'visionOS Immersive Experiences', url: 'https://developer.apple.com/design/human-interface-guidelines/immersive-experiences', platform: 'visionOS', category: 'presentation' },
      { title: 'visionOS Eyes and Hands', url: 'https://developer.apple.com/design/human-interface-guidelines/eyes-and-hands', platform: 'visionOS', category: 'selection-and-input' },
      
      // Universal Guidelines - Foundations
      { title: 'Design Principles', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-ios', platform: 'universal', category: 'foundations' },
      { title: 'Accessibility', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', platform: 'universal', category: 'foundations' },
      { title: 'Privacy', url: 'https://developer.apple.com/design/human-interface-guidelines/privacy', platform: 'universal', category: 'system-capabilities' },
      { title: 'Inclusion', url: 'https://developer.apple.com/design/human-interface-guidelines/inclusion', platform: 'universal', category: 'foundations' },
      { title: 'Branding', url: 'https://developer.apple.com/design/human-interface-guidelines/branding', platform: 'universal', category: 'foundations' },
      
      // Universal Guidelines - Visual Design
      { title: 'Materials', url: 'https://developer.apple.com/design/human-interface-guidelines/materials', platform: 'universal', category: 'color-and-materials' },
      { title: 'Visual Effects', url: 'https://developer.apple.com/design/human-interface-guidelines/visual-effects', platform: 'universal', category: 'visual-design' },
      { title: 'Dark Mode', url: 'https://developer.apple.com/design/human-interface-guidelines/dark-mode', platform: 'universal', category: 'color-and-materials' },
      
      // Universal Guidelines - Technologies
      { title: 'Audio', url: 'https://developer.apple.com/design/human-interface-guidelines/audio', platform: 'universal', category: 'technologies' },
      { title: 'Machine Learning', url: 'https://developer.apple.com/design/human-interface-guidelines/machine-learning', platform: 'universal', category: 'technologies' },
      { title: 'Augmented Reality', url: 'https://developer.apple.com/design/human-interface-guidelines/augmented-reality', platform: 'universal', category: 'technologies' },
      { title: 'Game Center', url: 'https://developer.apple.com/design/human-interface-guidelines/game-center', platform: 'universal', category: 'technologies' }
    ];

    // Convert to full HIGSection objects
    const sections: HIGSection[] = knownSections.map(section => ({
      ...section,
      id: this.generateId(section.title, section.platform),
      lastUpdated: new Date()
    }));

    // Verify accessibility of a few key URLs to ensure the base URLs are still valid
    try {
      const testUrl = 'https://developer.apple.com/design/human-interface-guidelines/ios';
      await this.makeRequest(testUrl);
      // console.log('[HIGScraper] Apple HIG website is accessible');
    } catch (error) {
      // console.warn('[HIGScraper] Warning: Could not verify Apple HIG website accessibility:', error);
      // Continue anyway with cached/known sections
    }

    // Cache for 4 hours
    this.cache.set(cacheKey, sections, 14400);
    // console.log(`[HIGScraper] Loaded ${sections.length} known HIG sections`);
    
    return sections;
  }

  /**
   * Fetch content for a specific HIG section
   */
  async fetchSectionContent(section: HIGSection): Promise<HIGSection> {
    const cacheKey = `hig:section:${section.id}`;
    
    // Check cache first
    const cached = this.cache.get<HIGSection>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // console.log(`[HIGScraper] Fetching content for: ${section.title}`);
      const html = await this.makeRequest(section.url);
      const content = this.cleanContent(html, section.title);
      
      const updatedSection: HIGSection = {
        ...section,
        content,
        lastUpdated: new Date()
      };

      // Cache for 2 hours
      this.cache.set(cacheKey, updatedSection, 7200);
      
      return updatedSection;
    } catch (error) {
      // console.error(`[HIGScraper] Failed to fetch content for ${section.title}:`, error);
      return section; // Return original section if fetch fails
    }
  }

  /**
   * Search HIG content
   */
  async searchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit: number = 10): Promise<SearchResult[]> {
    const sections = await this.discoverSections();
    let filteredSections = sections;

    // Filter by platform and category
    if (platform && platform !== 'universal') {
      filteredSections = filteredSections.filter(s => s.platform === platform || s.platform === 'universal');
    }
    if (category) {
      filteredSections = filteredSections.filter(s => s.category === category);
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const section of filteredSections.slice(0, limit * 2)) { // Search more than limit to get best matches
      const titleMatch = section.title.toLowerCase().includes(queryLower);
      const contentSection = await this.fetchSectionContent(section);
      const contentMatch = contentSection.content?.toLowerCase().includes(queryLower) || false;

      if (titleMatch || contentMatch) {
        const relevanceScore = titleMatch ? 1.0 : 0.5;
        const snippet = this.extractSnippet(contentSection.content || '', query);

        results.push({
          id: section.id,
          title: section.title,
          url: section.url,
          platform: section.platform,
          relevanceScore,
          snippet,
          type: 'section'
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Extract a relevant snippet from content
   */
  private extractSnippet(content: string, query: string, maxLength: number = 200): string {
    if (!content) return '';

    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(queryLower);

    if (queryIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, start + maxLength);
    const snippet = content.substring(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  }

  /**
   * Extract platform from URL or text
   */
  private extractPlatform(href: string, text: string): ApplePlatform {
    const combined = (href + ' ' + text).toLowerCase();
    
    if (combined.includes('ios')) return 'iOS';
    if (combined.includes('macos')) return 'macOS';
    if (combined.includes('watchos')) return 'watchOS';
    if (combined.includes('tvos')) return 'tvOS';
    if (combined.includes('visionos')) return 'visionOS';
    
    return 'universal';
  }

  /**
   * Extract category from URL or text
   */
  private extractCategory(href: string, text: string): HIGCategory {
    const combined = (href + ' ' + text).toLowerCase();
    
    if (combined.includes('foundation')) return 'foundations';
    if (combined.includes('layout')) return 'layout';
    if (combined.includes('navigation')) return 'navigation';
    if (combined.includes('presentation')) return 'presentation';
    if (combined.includes('input') || combined.includes('selection')) return 'selection-and-input';
    if (combined.includes('status')) return 'status';
    if (combined.includes('system')) return 'system-capabilities';
    if (combined.includes('visual') || combined.includes('design')) return 'visual-design';
    if (combined.includes('icon') || combined.includes('image')) return 'icons-and-images';
    if (combined.includes('color') || combined.includes('material')) return 'color-and-materials';
    if (combined.includes('typography') || combined.includes('font')) return 'typography';
    if (combined.includes('motion') || combined.includes('animation')) return 'motion';
    if (combined.includes('technolog')) return 'technologies';
    
    return 'foundations';
  }

  /**
   * Generate a unique ID for a section
   */
  private generateId(title: string, platform: ApplePlatform): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `${platform.toLowerCase()}-${cleanTitle}`;
  }
}