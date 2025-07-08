/**
 * Cross-Reference Mapping Service
 * 
 * Creates intelligent mappings between Apple design guidelines and technical implementation
 * Phase 2: Enhanced cross-referencing for unified Apple development guidance
 */

export interface CrossReference {
  designSection: string;
  designUrl: string;
  technicalSymbol: string;
  technicalUrl: string;
  confidence: number;
  mappingType: 'direct' | 'related' | 'conceptual' | 'platform-specific';
  explanation: string;
  platforms: string[];
  frameworks: string[];
}

export interface DesignTechnicalMapping {
  designConcept: string;
  technicalImplementations: Array<{
    symbol: string;
    framework: string;
    platform: string;
    confidence: number;
    usageNotes: string;
  }>;
}

export interface ComponentMapping {
  componentName: string;
  designGuidelines: Array<{
    title: string;
    url: string;
    platform: string;
    relevance: number;
  }>;
  technicalSymbols: Array<{
    symbol: string;
    framework: string;
    platform: string;
    symbolKind: string;
    relevance: number;
  }>;
}

export class CrossReferenceMappingService {
  // Comprehensive mapping database of design concepts to technical implementations
  private readonly designToTechnicalMappings = new Map<string, DesignTechnicalMapping>([
    // UI Controls
    ['button', {
      designConcept: 'button',
      technicalImplementations: [
        { symbol: 'Button', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'Primary SwiftUI button implementation' },
        { symbol: 'UIButton', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit button for more control' },
        { symbol: 'NSButton', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS native button' },
        { symbol: 'WKInterfaceButton', framework: 'WatchKit', platform: 'watchOS', confidence: 0.85, usageNotes: 'Watch-specific button' }
      ]
    }],
    
    ['navigation', {
      designConcept: 'navigation',
      technicalImplementations: [
        { symbol: 'NavigationView', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI navigation container' },
        { symbol: 'NavigationStack', framework: 'SwiftUI', platform: 'iOS', confidence: 0.90, usageNotes: 'iOS 16+ navigation' },
        { symbol: 'UINavigationController', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit navigation stack' },
        { symbol: 'NSNavigationController', framework: 'AppKit', platform: 'macOS', confidence: 0.80, usageNotes: 'macOS navigation (rare)' }
      ]
    }],
    
    ['list', {
      designConcept: 'list',
      technicalImplementations: [
        { symbol: 'List', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI list component' },
        { symbol: 'UITableView', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit table/list view' },
        { symbol: 'UICollectionView', framework: 'UIKit', platform: 'iOS', confidence: 0.85, usageNotes: 'Grid-style lists' },
        { symbol: 'NSTableView', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS table view' }
      ]
    }],
    
    ['text input', {
      designConcept: 'text input',
      technicalImplementations: [
        { symbol: 'TextField', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI text input' },
        { symbol: 'SecureField', framework: 'SwiftUI', platform: 'iOS', confidence: 0.90, usageNotes: 'Password input field' },
        { symbol: 'UITextField', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'Single-line text input' },
        { symbol: 'UITextView', framework: 'UIKit', platform: 'iOS', confidence: 0.85, usageNotes: 'Multi-line text input' },
        { symbol: 'NSTextField', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS text field' }
      ]
    }],
    
    ['image', {
      designConcept: 'image',
      technicalImplementations: [
        { symbol: 'Image', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI image display' },
        { symbol: 'UIImageView', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit image display' },
        { symbol: 'NSImageView', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS image display' }
      ]
    }],
    
    ['picker', {
      designConcept: 'picker',
      technicalImplementations: [
        { symbol: 'Picker', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI picker control' },
        { symbol: 'UIPickerView', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit wheel picker' },
        { symbol: 'NSPopUpButton', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS dropdown picker' }
      ]
    }],
    
    ['slider', {
      designConcept: 'slider',
      technicalImplementations: [
        { symbol: 'Slider', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI slider control' },
        { symbol: 'UISlider', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit slider control' },
        { symbol: 'NSSlider', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS slider control' }
      ]
    }],
    
    ['toggle', {
      designConcept: 'toggle',
      technicalImplementations: [
        { symbol: 'Toggle', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI toggle switch' },
        { symbol: 'UISwitch', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit switch control' },
        { symbol: 'NSSwitch', framework: 'AppKit', platform: 'macOS', confidence: 0.85, usageNotes: 'macOS switch (rare)' }
      ]
    }],
    
    ['alert', {
      designConcept: 'alert',
      technicalImplementations: [
        { symbol: 'Alert', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI alert dialog' },
        { symbol: 'UIAlertController', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit alert with actions' },
        { symbol: 'NSAlert', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS alert dialog' }
      ]
    }],
    
    ['sheet', {
      designConcept: 'sheet',
      technicalImplementations: [
        { symbol: 'sheet', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI modal sheet' },
        { symbol: 'UIModalPresentationStyle', framework: 'UIKit', platform: 'iOS', confidence: 0.85, usageNotes: 'UIKit modal presentation' },
        { symbol: 'NSModalSession', framework: 'AppKit', platform: 'macOS', confidence: 0.80, usageNotes: 'macOS modal sessions' }
      ]
    }],
    
    ['scroll view', {
      designConcept: 'scroll view',
      technicalImplementations: [
        { symbol: 'ScrollView', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI scrollable container' },
        { symbol: 'UIScrollView', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit scroll container' },
        { symbol: 'NSScrollView', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS scroll container' }
      ]
    }],
    
    ['stack', {
      designConcept: 'stack',
      technicalImplementations: [
        { symbol: 'VStack', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'Vertical stack layout' },
        { symbol: 'HStack', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'Horizontal stack layout' },
        { symbol: 'ZStack', framework: 'SwiftUI', platform: 'iOS', confidence: 0.90, usageNotes: 'Depth stack layout' },
        { symbol: 'UIStackView', framework: 'UIKit', platform: 'iOS', confidence: 0.85, usageNotes: 'UIKit stack container' },
        { symbol: 'NSStackView', framework: 'AppKit', platform: 'macOS', confidence: 0.85, usageNotes: 'macOS stack container' }
      ]
    }],

    // Authentication & Security
    ['authentication', {
      designConcept: 'authentication',
      technicalImplementations: [
        { symbol: 'AuthenticationServices', framework: 'AuthenticationServices', platform: 'iOS', confidence: 0.95, usageNotes: 'Sign in with Apple, web auth' },
        { symbol: 'LocalAuthentication', framework: 'LocalAuthentication', platform: 'iOS', confidence: 0.90, usageNotes: 'Touch ID, Face ID authentication' },
        { symbol: 'ASAuthorizationAppleIDButton', framework: 'AuthenticationServices', platform: 'iOS', confidence: 0.90, usageNotes: 'Sign in with Apple button' }
      ]
    }],
    
    ['biometric authentication', {
      designConcept: 'biometric authentication',
      technicalImplementations: [
        { symbol: 'LAContext', framework: 'LocalAuthentication', platform: 'iOS', confidence: 0.95, usageNotes: 'Touch ID, Face ID context' },
        { symbol: 'LAPolicy', framework: 'LocalAuthentication', platform: 'iOS', confidence: 0.90, usageNotes: 'Authentication policies' }
      ]
    }],

    // Colors and Visual Design
    ['color', {
      designConcept: 'color',
      technicalImplementations: [
        { symbol: 'Color', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI color system' },
        { symbol: 'UIColor', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit color system' },
        { symbol: 'NSColor', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS color system' }
      ]
    }],
    
    ['dark mode', {
      designConcept: 'dark mode',
      technicalImplementations: [
        { symbol: 'colorScheme', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI color scheme detection' },
        { symbol: 'UIUserInterfaceStyle', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit interface style' },
        { symbol: 'NSAppearance', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS appearance system' }
      ]
    }],

    // Typography
    ['typography', {
      designConcept: 'typography',
      technicalImplementations: [
        { symbol: 'Font', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SwiftUI font system' },
        { symbol: 'UIFont', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'UIKit font system' },
        { symbol: 'NSFont', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS font system' }
      ]
    }],

    // SF Symbols
    ['icons', {
      designConcept: 'icons',
      technicalImplementations: [
        { symbol: 'Image', framework: 'SwiftUI', platform: 'iOS', confidence: 0.95, usageNotes: 'SF Symbols and custom icons' },
        { symbol: 'UIImage', framework: 'UIKit', platform: 'iOS', confidence: 0.90, usageNotes: 'SF Symbols and image loading' },
        { symbol: 'NSImage', framework: 'AppKit', platform: 'macOS', confidence: 0.90, usageNotes: 'macOS image and icon system' }
      ]
    }]
  ]);

  // Platform-specific mapping priorities
  private readonly platformPriorities = new Map<string, number>([
    ['iOS', 1.0],
    ['macOS', 0.9],
    ['watchOS', 0.8],
    ['tvOS', 0.7],
    ['visionOS', 0.6]
  ]);

  /**
   * Find cross-references between design guidelines and technical implementations
   */
  findCrossReferences(
    designTitle: string,
    technicalSymbol: string,
    designPlatform?: string,
    technicalPlatforms?: string[]
  ): CrossReference[] {
    const crossReferences: CrossReference[] = [];
    
    // Direct mapping lookup
    const directMappings = this.findDirectMappings(designTitle, technicalSymbol);
    crossReferences.push(...directMappings);
    
    // Conceptual mappings
    const conceptualMappings = this.findConceptualMappings(designTitle, technicalSymbol);
    crossReferences.push(...conceptualMappings);
    
    // Platform-specific mappings
    if (designPlatform && technicalPlatforms) {
      const platformMappings = this.findPlatformSpecificMappings(
        designTitle,
        technicalSymbol,
        designPlatform,
        technicalPlatforms
      );
      crossReferences.push(...platformMappings);
    }
    
    // Sort by confidence and return unique references
    return this.deduplicateAndRank(crossReferences);
  }

  /**
   * Get comprehensive component mapping
   */
  getComponentMapping(componentName: string): ComponentMapping | null {
    const normalizedName = this.normalizeComponentName(componentName);
    const mapping = this.designToTechnicalMappings.get(normalizedName);
    
    if (!mapping) {
      return null;
    }

    return {
      componentName: normalizedName,
      designGuidelines: this.generateDesignGuidelines(normalizedName),
      technicalSymbols: mapping.technicalImplementations.map(impl => ({
        symbol: impl.symbol,
        framework: impl.framework,
        platform: impl.platform,
        symbolKind: this.inferSymbolKind(impl.symbol),
        relevance: impl.confidence
      }))
    };
  }

  /**
   * Find related components for cross-referencing
   */
  findRelatedComponents(componentName: string): string[] {
    const related: string[] = [];
    const normalizedName = this.normalizeComponentName(componentName);
    
    // Define component relationships
    const relationships = new Map<string, string[]>([
      ['button', ['alert', 'sheet', 'navigation']],
      ['navigation', ['button', 'list', 'stack']],
      ['list', ['scroll view', 'navigation', 'text input']],
      ['text input', ['button', 'picker', 'alert']],
      ['picker', ['button', 'list', 'sheet']],
      ['alert', ['button', 'sheet']],
      ['sheet', ['button', 'alert', 'navigation']],
      ['authentication', ['button', 'biometric authentication', 'text input']],
      ['color', ['dark mode', 'typography']],
      ['typography', ['color', 'dark mode']],
      ['icons', ['button', 'navigation', 'list']]
    ]);
    
    return relationships.get(normalizedName) || [];
  }

  /**
   * Generate suggestions for improving cross-references
   */
  generateCrossReferenceSuggestions(
    designResults: any[],
    technicalResults: any[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (designResults.length === 0 && technicalResults.length > 0) {
      suggestions.push('Consider reviewing Apple\'s Human Interface Guidelines for design best practices');
      suggestions.push('Look for related design patterns in the HIG that complement this technical implementation');
    }
    
    if (technicalResults.length === 0 && designResults.length > 0) {
      suggestions.push('Explore technical documentation for implementation details');
      suggestions.push('Search for framework-specific implementations of this design concept');
    }
    
    if (designResults.length > 0 && technicalResults.length > 0) {
      suggestions.push('Compare design guidelines with technical capabilities');
      suggestions.push('Consider platform-specific implementation variations');
    }
    
    return suggestions;
  }

  /**
   * Validate cross-reference quality
   */
  validateCrossReference(crossRef: CrossReference): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = crossRef.confidence;
    
    // Check confidence threshold
    if (crossRef.confidence < 0.3) {
      issues.push('Low confidence mapping');
      score -= 0.1;
    }
    
    // Check platform consistency
    if (crossRef.platforms.length === 0) {
      issues.push('No platform information');
      score -= 0.1;
    }
    
    // Check framework relevance
    if (crossRef.frameworks.length === 0) {
      issues.push('No framework information');
      score -= 0.05;
    }
    
    // Check explanation quality
    if (!crossRef.explanation || crossRef.explanation.length < 10) {
      issues.push('Poor explanation quality');
      score -= 0.05;
    }
    
    return {
      isValid: score >= 0.2 && issues.length < 3,
      score: Math.max(0, Math.min(1, score)),
      issues
    };
  }

  // Private helper methods
  
  private findDirectMappings(designTitle: string, technicalSymbol: string): CrossReference[] {
    const mappings: CrossReference[] = [];
    const normalizedDesign = this.normalizeComponentName(designTitle);
    
    const mapping = this.designToTechnicalMappings.get(normalizedDesign);
    if (mapping) {
      for (const impl of mapping.technicalImplementations) {
        if (impl.symbol.toLowerCase().includes(technicalSymbol.toLowerCase()) ||
            technicalSymbol.toLowerCase().includes(impl.symbol.toLowerCase())) {
          mappings.push({
            designSection: designTitle,
            designUrl: `#${normalizedDesign}`,
            technicalSymbol: impl.symbol,
            technicalUrl: `#${impl.framework}/${impl.symbol}`,
            confidence: impl.confidence,
            mappingType: 'direct',
            explanation: `${impl.symbol} is the ${impl.framework} implementation of ${normalizedDesign} for ${impl.platform}. ${impl.usageNotes}`,
            platforms: [impl.platform],
            frameworks: [impl.framework]
          });
        }
      }
    }
    
    return mappings;
  }

  private findConceptualMappings(designTitle: string, technicalSymbol: string): CrossReference[] {
    const mappings: CrossReference[] = [];
    
    // Implement fuzzy concept matching
    for (const [concept, mapping] of this.designToTechnicalMappings) {
      if (designTitle.toLowerCase().includes(concept) || 
          concept.includes(designTitle.toLowerCase())) {
        for (const impl of mapping.technicalImplementations) {
          if (this.areConceptuallyRelated(technicalSymbol, impl.symbol)) {
            mappings.push({
              designSection: designTitle,
              designUrl: `#${concept}`,
              technicalSymbol: impl.symbol,
              technicalUrl: `#${impl.framework}/${impl.symbol}`,
              confidence: impl.confidence * 0.7, // Lower confidence for conceptual matches
              mappingType: 'conceptual',
              explanation: `${impl.symbol} is conceptually related to ${designTitle}. ${impl.usageNotes}`,
              platforms: [impl.platform],
              frameworks: [impl.framework]
            });
          }
        }
      }
    }
    
    return mappings;
  }

  private findPlatformSpecificMappings(
    designTitle: string,
    technicalSymbol: string,
    designPlatform: string,
    technicalPlatforms: string[]
  ): CrossReference[] {
    const mappings: CrossReference[] = [];
    
    // Find platform-specific implementations
    for (const platform of technicalPlatforms) {
      if (platform.toLowerCase().includes(designPlatform.toLowerCase())) {
        const platformPriority = this.platformPriorities.get(platform) || 0.5;
        mappings.push({
          designSection: designTitle,
          designUrl: `#${designPlatform}/${designTitle}`,
          technicalSymbol: technicalSymbol,
          technicalUrl: `#${platform}/${technicalSymbol}`,
          confidence: platformPriority * 0.8,
          mappingType: 'platform-specific',
          explanation: `Platform-specific implementation for ${platform}`,
          platforms: [platform],
          frameworks: ['Platform-specific']
        });
      }
    }
    
    return mappings;
  }

  private normalizeComponentName(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  private areConceptuallyRelated(symbol1: string, symbol2: string): boolean {
    const s1 = symbol1.toLowerCase();
    const s2 = symbol2.toLowerCase();
    
    // Check for partial matches
    if (s1.includes(s2) || s2.includes(s1)) return true;
    
    // Check for common UI patterns
    const uiPatterns = ['ui', 'ns', 'swiftui', 'view', 'controller', 'button', 'text', 'image'];
    const s1Patterns = uiPatterns.filter(p => s1.includes(p));
    const s2Patterns = uiPatterns.filter(p => s2.includes(p));
    
    return s1Patterns.some(p => s2Patterns.includes(p));
  }

  private generateDesignGuidelines(componentName: string): Array<{
    title: string;
    url: string;
    platform: string;
    relevance: number;
  }> {
    // Generate typical design guideline references
    return [
      {
        title: `${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Guidelines`,
        url: `#hig/${componentName}`,
        platform: 'iOS',
        relevance: 0.95
      },
      {
        title: `${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Best Practices`,
        url: `#hig/${componentName}/best-practices`,
        platform: 'universal',
        relevance: 0.90
      }
    ];
  }

  private inferSymbolKind(symbol: string): string {
    if (symbol.startsWith('UI') || symbol.startsWith('NS')) return 'class';
    if (symbol.includes('View') || symbol.includes('Controller')) return 'class';
    if (symbol[0] === symbol[0].toUpperCase()) return 'struct';
    return 'unknown';
  }

  private deduplicateAndRank(crossReferences: CrossReference[]): CrossReference[] {
    // Remove duplicates and rank by confidence
    const seen = new Set<string>();
    const unique: CrossReference[] = [];
    
    for (const ref of crossReferences.sort((a, b) => b.confidence - a.confidence)) {
      const key = `${ref.designSection}-${ref.technicalSymbol}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ref);
      }
    }
    
    return unique.slice(0, 10); // Limit to top 10 cross-references
  }
}