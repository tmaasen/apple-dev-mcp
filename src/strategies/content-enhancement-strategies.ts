/**
 * Content Enhancement Strategies
 * Following Strategy Pattern for different content enhancement types
 */

import { IContentEnhancer } from '../interfaces/content-interfaces.js';
import { HIGSection } from '../types.js';

// Base abstract class for common functionality
abstract class BaseContentEnhancer implements IContentEnhancer {
  abstract canEnhance(section: HIGSection): boolean;
  abstract enhance(content: string, section: HIGSection): string;

  protected generateCodeExamples(section: HIGSection): string {
    const examples = this.getCodeExamples(section);
    if (examples.length === 0) return '';

    let codeSection = '\n\n## Code Examples\n\n';
    
    examples.forEach(example => {
      codeSection += `### ${example.title}\n\n`;
      if (example.description) {
        codeSection += `${example.description}\n\n`;
      }
      codeSection += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
    });
    
    return codeSection;
  }

  protected generateDesignSpecs(section: HIGSection): string {
    const specs = this.getDesignSpecs(section);
    if (Object.keys(specs).length === 0) return '';

    let specsSection = '\n\n## Design Specifications\n\n';
    
    Object.entries(specs).forEach(([category, values]) => {
      specsSection += `### ${category}\n\n`;
      if (Array.isArray(values)) {
        values.forEach(value => {
          specsSection += `- ${value}\n`;
        });
      } else {
        Object.entries(values).forEach(([key, value]) => {
          specsSection += `- **${key}**: ${value}\n`;
        });
      }
      specsSection += '\n';
    });
    
    return specsSection;
  }

  protected generateRelatedSections(section: HIGSection): string {
    const related = this.getRelatedSections(section);
    if (related.length === 0) return '';

    let relatedSection = '\n\n## Related Guidelines\n\n';
    related.forEach(item => {
      relatedSection += `- [${item.title}](${item.url}) - ${item.description}\n`;
    });
    
    return relatedSection;
  }

  protected abstract getCodeExamples(section: HIGSection): Array<{
    title: string;
    description?: string;
    language: string;
    code: string;
  }>;

  protected abstract getDesignSpecs(section: HIGSection): Record<string, any>;

  protected abstract getRelatedSections(section: HIGSection): Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

// Strategy for button-related content
export class ButtonContentEnhancer extends BaseContentEnhancer {
  canEnhance(section: HIGSection): boolean {
    return section.title.toLowerCase().includes('button');
  }

  enhance(content: string, section: HIGSection): string {
    let enhanced = content;

    // Add development considerations
    enhanced += '\n\n## Development Considerations\n\n';
    enhanced += '- Use system-provided button styles when possible for automatic Dark Mode support\n';
    enhanced += '- Ensure buttons respond to accessibility settings like Larger Text\n';
    enhanced += '- Test button interactions with VoiceOver and other assistive technologies\n';
    enhanced += '- Consider button placement in relation to safe areas on different devices\n';

    // Add code examples, specs, and related sections
    enhanced += this.generateCodeExamples(section);
    enhanced += this.generateDesignSpecs(section);
    enhanced += this.generateRelatedSections(section);

    return enhanced;
  }

  protected getCodeExamples(section: HIGSection): Array<any> {
    const examples = [];
    const platform = section.platform.toLowerCase();

    examples.push({
      title: 'SwiftUI Button',
      description: 'Basic button implementation with proper styling and accessibility',
      language: 'swift',
      code: `Button("Button Title") {
    // Button action
    handleButtonTap()
}
.buttonStyle(.filled)
.frame(minWidth: 44, minHeight: 44)
.accessibilityLabel("Descriptive label")
.accessibilityHint("Double tap to perform action")`
    });

    if (platform === 'ios') {
      examples.push({
        title: 'UIKit Button',
        description: 'UIButton configuration for iOS with proper styling',
        language: 'swift',
        code: `let button = UIButton(type: .system)
button.setTitle("Button Title", for: .normal)
button.backgroundColor = .systemBlue
button.setTitleColor(.white, for: .normal)
button.layer.cornerRadius = 8
button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
button.frame = CGRect(x: 0, y: 0, width: 120, height: 44)

// Accessibility
button.accessibilityLabel = "Descriptive label"
button.accessibilityHint = "Double tap to perform action"`
      });
    }

    return examples;
  }

  protected getDesignSpecs(_section: HIGSection): Record<string, any> {
    return {
      'Sizing': {
        'Minimum Touch Target': '44×44 points',
        'Corner Radius': '8 points (standard)',
        'Horizontal Padding': '16 points minimum'
      },
      'Typography': {
        'Font Family': 'SF Pro Text',
        'Font Size': '17 points (body)',
        'Font Weight': 'Medium (.medium)'
      },
      'Colors': {
        'Primary Blue': '#007AFF (light), #0A84FF (dark)',
        'Success Green': '#34C759 (light), #30D158 (dark)'
      }
    };
  }

  protected getRelatedSections(section: HIGSection): Array<any> {
    const platform = section.platform;
    return [
      {
        title: `${platform} Controls`,
        url: `https://developer.apple.com/design/human-interface-guidelines/controls`,
        description: 'Comprehensive guide to all interactive UI controls'
      },
      {
        title: 'Accessibility Guidelines',
        url: `https://developer.apple.com/design/human-interface-guidelines/accessibility`,
        description: 'Making buttons accessible to all users'
      }
    ];
  }
}

// Strategy for navigation-related content
export class NavigationContentEnhancer extends BaseContentEnhancer {
  canEnhance(section: HIGSection): boolean {
    return section.title.toLowerCase().includes('navigation');
  }

  enhance(content: string, section: HIGSection): string {
    let enhanced = content;

    // Add implementation notes
    enhanced += '\n\n## Implementation Notes\n\n';
    enhanced += '- Use NavigationView/NavigationStack for SwiftUI or UINavigationController for UIKit\n';
    enhanced += '- Configure navigation bar appearance for both light and dark modes\n';
    enhanced += '- Ensure navigation hierarchy is logical and predictable for users\n';
    enhanced += '- Test navigation with different screen sizes and orientations\n';

    enhanced += this.generateCodeExamples(section);
    enhanced += this.generateDesignSpecs(section);
    enhanced += this.generateRelatedSections(section);

    return enhanced;
  }

  protected getCodeExamples(_section: HIGSection): Array<any> {
    return [
      {
        title: 'SwiftUI Navigation',
        description: 'Navigation setup with proper hierarchy and title configuration',
        language: 'swift',
        code: `NavigationView {
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
}`
      }
    ];
  }

  protected getDesignSpecs(_section: HIGSection): Record<string, any> {
    return {
      'Navigation Bar': {
        'Height': '44 points (compact), 96 points (large title)',
        'Title Font': 'SF Pro Display, 17pt (regular), 34pt (large)'
      }
    };
  }

  protected getRelatedSections(section: HIGSection): Array<any> {
    const platform = section.platform;
    return [
      {
        title: `${platform} Layout Guidelines`,
        url: `https://developer.apple.com/design/human-interface-guidelines/layout`,
        description: 'Layout principles and navigation structure'
      }
    ];
  }
}

// Strategy for color-related content
export class ColorContentEnhancer extends BaseContentEnhancer {
  canEnhance(section: HIGSection): boolean {
    return section.title.toLowerCase().includes('color');
  }

  enhance(content: string, section: HIGSection): string {
    let enhanced = content;

    // Add color implementation notes
    enhanced += '\n\n## Color Implementation\n\n';
    enhanced += '- Always use semantic colors for automatic dark mode adaptation\n';
    enhanced += '- Test color combinations with accessibility settings enabled\n';
    enhanced += '- Verify contrast ratios meet WCAG guidelines\n';
    enhanced += '- Consider colorblind users when choosing color schemes\n';

    enhanced += this.generateCodeExamples(section);
    enhanced += this.generateDesignSpecs(section);
    enhanced += this.generateRelatedSections(section);

    return enhanced;
  }

  protected getCodeExamples(_section: HIGSection): Array<any> {
    return [
      {
        title: 'System Colors',
        description: 'Using adaptive system colors that work in light and dark modes',
        language: 'swift',
        code: `// SwiftUI
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
}`
      }
    ];
  }

  protected getDesignSpecs(_section: HIGSection): Record<string, any> {
    return {
      'System Colors': {
        'Blue': '#007AFF / #0A84FF',
        'Green': '#34C759 / #30D158',
        'Red': '#FF3B30 / #FF453A'
      },
      'Contrast Requirements': {
        'Normal Text': '4.5:1 minimum ratio',
        'Large Text (18pt+)': '3:1 minimum ratio'
      }
    };
  }

  protected getRelatedSections(_section: HIGSection): Array<any> {
    return [
      {
        title: 'Accessibility Guidelines',
        url: `https://developer.apple.com/design/human-interface-guidelines/accessibility`,
        description: 'Color accessibility and contrast requirements'
      }
    ];
  }
}

// Factory for creating appropriate enhancers
export class ContentEnhancerFactory {
  private static enhancers: IContentEnhancer[] = [
    new ButtonContentEnhancer(),
    new NavigationContentEnhancer(),
    new ColorContentEnhancer()
  ];

  static getEnhancers(section: HIGSection): IContentEnhancer[] {
    return this.enhancers.filter(enhancer => enhancer.canEnhance(section));
  }
}