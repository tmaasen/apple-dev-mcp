/**
 * Content Fusion Service
 * 
 * Intelligently combines Apple design guidelines with technical implementation details
 * Phase 3: Advanced content fusion for comprehensive developer guidance
 */

import type { SearchResult, TechnicalSearchResult, ApplePlatform } from '../types.js';
import type { CrossReference } from './cross-reference-mapping.service.js';

export interface FusedContent {
  id: string;
  title: string;
  description: string;
  designGuidance: {
    principles: string[];
    bestPractices: string[];
    doAndDonts: {
      dos: string[];
      donts: string[];
    };
    accessibility: string[];
    visualExamples: string[];
  };
  technicalImplementation: {
    frameworks: string[];
    codeExamples: Array<{
      framework: string;
      language: string;
      code: string;
      description: string;
    }>;
    apiReferences: Array<{
      symbol: string;
      framework: string;
      url: string;
      description: string;
    }>;
    architecturalNotes: string[];
  };
  implementationGuide: {
    steps: Array<{
      stepNumber: number;
      title: string;
      description: string;
      designConsiderations: string[];
      codeSnippet?: string;
      resources: string[];
    }>;
    prerequisites: string[];
    commonPitfalls: string[];
    testingGuidance: string[];
  };
  platformSpecific: {
    [platform: string]: {
      designAdaptations: string[];
      implementationDifferences: string[];
      platformBestPractices: string[];
      codeExamples: Array<{
        framework: string;
        code: string;
        description: string;
      }>;
    };
  };
  crossReferences: {
    relatedComponents: string[];
    designPatterns: string[];
    technicalConcepts: string[];
  };
  metadata: {
    confidence: number;
    lastUpdated: Date;
    sources: string[];
    complexity: 'beginner' | 'intermediate' | 'advanced';
    estimatedImplementationTime: string;
  };
}

export interface FusionRequest {
  component: string;
  platform?: ApplePlatform;
  framework?: string;
  useCase?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  includeCodeExamples?: boolean;
  includeAccessibility?: boolean;
  includeTestingGuidance?: boolean;
}

export interface ImplementationGuide {
  title: string;
  overview: string;
  designPhase: {
    guidelines: string[];
    decisions: Array<{
      decision: string;
      rationale: string;
      alternatives: string[];
    }>;
    designTokens: Array<{
      property: string;
      value: string;
      platform: string;
    }>;
  };
  implementationPhase: {
    setup: Array<{
      step: string;
      code?: string;
      notes: string[];
    }>;
    coreImplementation: Array<{
      feature: string;
      implementation: string;
      codeExample: string;
      designAlignment: string[];
    }>;
    refinement: Array<{
      aspect: string;
      guidance: string;
      codeSnippet?: string;
    }>;
  };
  validationPhase: {
    designValidation: string[];
    functionalTesting: string[];
    accessibilityTesting: string[];
    performanceTesting: string[];
  };
}

export class ContentFusionService {
  // Knowledge base for design-to-implementation fusion
  private readonly fusionKnowledgeBase = new Map<string, any>([
    ['button', {
      designPrinciples: [
        'Use buttons for primary actions that users need to complete their task',
        'Make buttons look tappable with clear visual hierarchy',
        'Provide sufficient touch target size (minimum 44pt on iOS)',
        'Use consistent button styles throughout your app',
        'Consider the emotional impact of button colors and labels'
      ],
      implementationPatterns: {
        SwiftUI: {
          basic: `Button("Action") { /* action */ }`,
          styled: `Button("Primary") { action() }\n.buttonStyle(.borderedProminent)`,
          customStyle: `Button("Custom") { action() }\n.frame(minHeight: 44)\n.background(Color.accentColor)\n.foregroundColor(.white)\n.cornerRadius(8)`
        },
        UIKit: {
          basic: `let button = UIButton(type: .system)\nbutton.setTitle("Action", for: .normal)\nbutton.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)`,
          styled: `let button = UIButton(configuration: .filled())\nbutton.setTitle("Primary", for: .normal)\nbutton.configuration?.cornerStyle = .medium`
        },
        AppKit: {
          basic: `let button = NSButton(title: "Action", target: self, action: #selector(buttonClicked))\nbutton.bezelStyle = .rounded`
        }
      },
      bestPractices: [
        'Use destructive styling for actions that cannot be undone',
        'Disable buttons when actions are not available rather than hiding them',
        'Provide immediate visual feedback when buttons are tapped',
        'Use loading states for actions that take time to complete',
        'Group related buttons logically and maintain consistent spacing'
      ],
      accessibility: [
        'Ensure button labels are descriptive and actionable',
        'Support Voice Control with clear, unique names',
        'Implement proper button traits for VoiceOver',
        'Ensure sufficient color contrast for text and background',
        'Test with assistive technologies on target platforms'
      ],
      commonPitfalls: [
        'Making touch targets too small (less than 44pt)',
        'Using vague button labels like "Click here" or "Submit"',
        'Inconsistent button styles across the app',
        'Not providing feedback for button interactions',
        'Overusing destructive button styles'
      ]
    }],
    
    ['navigation', {
      designPrinciples: [
        'Create a clear, logical navigation hierarchy',
        'Use platform-standard navigation patterns',
        'Provide clear indication of current location',
        'Make navigation predictable and learnable',
        'Support both forward and backward navigation'
      ],
      implementationPatterns: {
        SwiftUI: {
          basic: `NavigationView {\n    List(items) { item in\n        NavigationLink(destination: DetailView(item)) {\n            Text(item.title)\n        }\n    }\n    .navigationTitle("Items")\n}`,
          stack: `NavigationStack {\n    List(items) { item in\n        NavigationLink(value: item) {\n            Text(item.title)\n        }\n    }\n    .navigationDestination(for: Item.self) { item in\n        DetailView(item)\n    }\n}`
        },
        UIKit: {
          basic: `let navController = UINavigationController(rootViewController: listViewController)\nnavController.navigationBar.prefersLargeTitles = true`,
          push: `navigationController?.pushViewController(detailViewController, animated: true)`
        }
      },
      bestPractices: [
        'Use large titles for top-level screens',
        'Implement proper back button behavior',
        'Consider split-view layouts for iPad',
        'Use navigation bar items consistently',
        'Provide search functionality when appropriate'
      ],
      accessibility: [
        'Ensure navigation elements have clear labels',
        'Support keyboard navigation on macOS',
        'Implement proper heading hierarchy',
        'Provide skip navigation options for complex hierarchies'
      ]
    }],
    
    ['text', {
      designPrinciples: [
        'Use typography to establish clear visual hierarchy',
        'Choose fonts that enhance readability',
        'Maintain consistent text styles throughout the app',
        'Consider dynamic type support for accessibility',
        'Align text styles with platform conventions'
      ],
      implementationPatterns: {
        SwiftUI: {
          basic: `Text("Hello, World!")\n.font(.title)\n.foregroundColor(.primary)`,
          styled: `Text("Headline")\n.font(.headline)\n.fontWeight(.semibold)\n.foregroundColor(.accentColor)`,
          multiline: `Text("Long text content that may wrap to multiple lines")\n.font(.body)\n.lineLimit(nil)\n.multilineTextAlignment(.leading)`
        },
        UIKit: {
          basic: `let label = UILabel()\nlabel.text = "Hello, World!"\nlabel.font = UIFont.preferredFont(forTextStyle: .title1)\nlabel.adjustsFontForContentSizeCategory = true`,
          attributed: `let attributedText = NSAttributedString(string: "Styled Text", attributes: [\n    .font: UIFont.systemFont(ofSize: 16, weight: .semibold),\n    .foregroundColor: UIColor.label\n])`
        }
      },
      bestPractices: [
        'Use semantic text styles instead of fixed sizes',
        'Support Dynamic Type for accessibility',
        'Ensure sufficient contrast for readability',
        'Test text rendering across different devices',
        'Consider localization impact on text length'
      ]
    }],

    ['authentication', {
      designPrinciples: [
        'Make authentication as frictionless as possible',
        'Provide multiple authentication options when appropriate',
        'Use biometric authentication for convenience and security',
        'Follow platform security best practices',
        'Clearly communicate security benefits to users'
      ],
      implementationPatterns: {
        SwiftUI: {
          signInWithApple: `SignInWithAppleButton(\n    .signIn,\n    onRequest: { request in\n        request.requestedScopes = [.fullName, .email]\n    },\n    onCompletion: { result in\n        // Handle authentication result\n    }\n)\n.signInWithAppleButtonStyle(.black)\n.frame(height: 50)`,
          biometric: `@State private var isAuthenticated = false\n\nButton("Authenticate") {\n    authenticateWithBiometrics()\n}\n\nfunc authenticateWithBiometrics() {\n    let context = LAContext()\n    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Authenticate to access your account") { success, error in\n        DispatchQueue.main.async {\n            isAuthenticated = success\n        }\n    }\n}`
        },
        UIKit: {
          signInWithApple: `let authButton = ASAuthorizationAppleIDButton(type: .signIn, style: .black)\nauthButton.addTarget(self, action: #selector(handleAppleSignIn), for: .touchUpInside)`,
          biometric: `let context = LAContext()\ncontext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Authenticate") { success, error in\n    // Handle result\n}`
        }
      },
      bestPractices: [
        'Implement Sign in with Apple as the primary option',
        'Use keychain for secure credential storage',
        'Provide clear error messages for authentication failures',
        'Implement proper session management',
        'Follow privacy guidelines for user data'
      ],
      accessibility: [
        'Ensure authentication buttons are accessible',
        'Provide alternative authentication methods',
        'Support Voice Control for authentication actions',
        'Clear feedback for authentication status'
      ]
    }]
  ]);

  /**
   * Generate fused content combining design guidelines with technical implementation
   */
  async generateFusedContent(
    designResult: SearchResult,
    technicalResult: TechnicalSearchResult,
    crossReference: CrossReference,
    request: FusionRequest
  ): Promise<FusedContent> {
    const componentKey = this.normalizeComponentName(request.component);
    const knowledgeBase = this.fusionKnowledgeBase.get(componentKey);
    
    const fusedContent: FusedContent = {
      id: `fused-${componentKey}-${request.platform || 'universal'}`,
      title: `${designResult.title} Implementation Guide`,
      description: this.generateDescription(designResult, technicalResult, request),
      
      designGuidance: await this.generateDesignGuidance(designResult, knowledgeBase, request),
      technicalImplementation: await this.generateTechnicalImplementation(technicalResult, knowledgeBase, request),
      implementationGuide: await this.generateImplementationGuideInternal(designResult, technicalResult, knowledgeBase, request),
      platformSpecific: await this.generatePlatformSpecificGuidance(request, knowledgeBase),
      crossReferences: this.generateCrossReferences(designResult, technicalResult, request),
      
      metadata: {
        confidence: this.calculateFusionConfidence(designResult, technicalResult, crossReference),
        lastUpdated: new Date(),
        sources: [designResult.url, technicalResult.url],
        complexity: request.complexity || 'intermediate',
        estimatedImplementationTime: this.estimateImplementationTime(request.component, request.complexity)
      }
    };

    return fusedContent;
  }

  /**
   * Generate comprehensive implementation guide
   */
  async generateImplementationGuide(
    component: string,
    platform: ApplePlatform,
    framework?: string,
    useCase?: string
  ): Promise<ImplementationGuide> {
    const componentKey = this.normalizeComponentName(component);
    const knowledgeBase = this.fusionKnowledgeBase.get(componentKey);
    
    return {
      title: `Implementing ${component} for ${platform}`,
      overview: this.generateImplementationOverview(component, platform, useCase),
      
      designPhase: {
        guidelines: knowledgeBase?.designPrinciples || this.getGenericDesignGuidelines(component),
        decisions: this.generateDesignDecisions(component, platform),
        designTokens: this.generateDesignTokens(component, platform)
      },
      
      implementationPhase: {
        setup: this.generateSetupSteps(component, platform, framework),
        coreImplementation: this.generateCoreImplementation(component, platform, framework, knowledgeBase),
        refinement: this.generateRefinementGuidance(component, platform)
      },
      
      validationPhase: {
        designValidation: this.generateDesignValidation(component),
        functionalTesting: this.generateFunctionalTesting(component),
        accessibilityTesting: this.generateAccessibilityTesting(component, platform),
        performanceTesting: this.generatePerformanceTesting(component)
      }
    };
  }

  /**
   * Generate step-by-step implementation guide with design alignment
   */
  async generateStepByStepGuide(
    designGuidance: string[],
    technicalImplementation: any,
    platform: ApplePlatform,
    framework: string
  ): Promise<Array<{
    stepNumber: number;
    title: string;
    description: string;
    designConsiderations: string[];
    codeSnippet?: string;
    resources: string[];
  }>> {
    const steps = [];
    
    // Step 1: Design Planning
    steps.push({
      stepNumber: 1,
      title: 'Design Planning & Guidelines Review',
      description: 'Review Apple\'s design guidelines and plan your component implementation',
      designConsiderations: designGuidance.slice(0, 3),
      resources: ['Apple Human Interface Guidelines', 'Platform Design Resources']
    });
    
    // Step 2: Setup
    steps.push({
      stepNumber: 2,
      title: 'Project Setup & Framework Configuration',
      description: `Configure your ${framework} project for ${platform} development`,
      designConsiderations: ['Ensure proper project structure', 'Configure accessibility settings'],
      codeSnippet: this.generateSetupCode(framework, platform),
      resources: [`${framework} Documentation`, `${platform} Development Guide`]
    });
    
    // Step 3: Basic Implementation
    steps.push({
      stepNumber: 3,
      title: 'Basic Component Implementation',
      description: 'Implement the core functionality following design guidelines',
      designConsiderations: designGuidance.slice(3, 6),
      codeSnippet: technicalImplementation.codeExamples?.[0]?.code,
      resources: ['API Reference', 'Code Examples']
    });
    
    // Step 4: Styling & Polish
    steps.push({
      stepNumber: 4,
      title: 'Styling & Visual Polish',
      description: 'Apply design tokens and ensure visual consistency',
      designConsiderations: ['Apply consistent spacing', 'Use system colors', 'Ensure proper contrast'],
      codeSnippet: this.generateStylingCode(framework),
      resources: ['Design System Documentation', 'Accessibility Guidelines']
    });
    
    // Step 5: Testing & Validation
    steps.push({
      stepNumber: 5,
      title: 'Testing & Accessibility Validation',
      description: 'Test your implementation across devices and accessibility scenarios',
      designConsiderations: ['Test with assistive technologies', 'Validate across device sizes', 'Check dynamic type support'],
      resources: ['Testing Guidelines', 'Accessibility Testing Tools']
    });
    
    return steps;
  }

  // Private helper methods
  
  private generateDescription(designResult: SearchResult, technicalResult: TechnicalSearchResult, request: FusionRequest): string {
    return `Comprehensive guide for implementing ${request.component} on ${request.platform || 'Apple platforms'}, combining design principles from Apple's Human Interface Guidelines with technical implementation using ${technicalResult.framework}.`;
  }

  private async generateDesignGuidance(designResult: SearchResult, knowledgeBase: any, request: FusionRequest) {
    return {
      principles: knowledgeBase?.designPrinciples || this.extractDesignPrinciples(designResult.snippet),
      bestPractices: knowledgeBase?.bestPractices || this.generateGenericBestPractices(request.component),
      doAndDonts: {
        dos: this.generateDos(request.component),
        donts: this.generateDonts(request.component)
      },
      accessibility: knowledgeBase?.accessibility || this.generateAccessibilityGuidance(request.component),
      visualExamples: this.generateVisualExamples(request.component, request.platform)
    };
  }

  private async generateTechnicalImplementation(technicalResult: TechnicalSearchResult, knowledgeBase: any, request: FusionRequest) {
    const framework = request.framework || technicalResult.framework;
    const patterns = knowledgeBase?.implementationPatterns?.[framework];
    
    return {
      frameworks: [framework],
      codeExamples: this.generateCodeExamples(request.component, framework, patterns),
      apiReferences: [{
        symbol: technicalResult.title,
        framework: technicalResult.framework,
        url: technicalResult.url,
        description: technicalResult.description
      }],
      architecturalNotes: this.generateArchitecturalNotes(request.component, framework)
    };
  }

  private async generateImplementationGuideInternal(designResult: SearchResult, technicalResult: TechnicalSearchResult, knowledgeBase: any, request: FusionRequest) {
    return {
      steps: await this.generateStepByStepGuide(
        knowledgeBase?.designPrinciples || [],
        { codeExamples: knowledgeBase?.implementationPatterns?.[request.framework || technicalResult.framework] },
        request.platform || 'iOS',
        request.framework || technicalResult.framework
      ),
      prerequisites: this.generatePrerequisites(request.component, request.platform),
      commonPitfalls: knowledgeBase?.commonPitfalls || this.generateCommonPitfalls(request.component),
      testingGuidance: this.generateTestingGuidance(request.component)
    };
  }

  private async generatePlatformSpecificGuidance(request: FusionRequest, knowledgeBase: any) {
    const platforms = request.platform ? [request.platform] : ['iOS', 'macOS', 'watchOS', 'tvOS'];
    const guidance: any = {};
    
    for (const platform of platforms) {
      guidance[platform] = {
        designAdaptations: this.generatePlatformDesignAdaptations(request.component, platform),
        implementationDifferences: this.generatePlatformImplementationDifferences(request.component, platform),
        platformBestPractices: this.generatePlatformBestPractices(request.component, platform),
        codeExamples: this.generatePlatformCodeExamples(request.component, platform, knowledgeBase)
      };
    }
    
    return guidance;
  }

  private generateCrossReferences(designResult: SearchResult, technicalResult: TechnicalSearchResult, request: FusionRequest) {
    return {
      relatedComponents: this.getRelatedComponents(request.component),
      designPatterns: this.getRelatedDesignPatterns(request.component),
      technicalConcepts: this.getRelatedTechnicalConcepts(technicalResult.framework)
    };
  }

  private calculateFusionConfidence(designResult: SearchResult, technicalResult: TechnicalSearchResult, crossReference: CrossReference): number {
    // Base confidence from individual results
    let confidence = (designResult.relevanceScore + technicalResult.relevanceScore) / 2;
    
    // Boost from cross-reference quality
    confidence += crossReference.confidence * 0.3;
    
    // Ensure confidence is between 0 and 1
    return Math.min(1, Math.max(0, confidence));
  }

  private estimateImplementationTime(component: string, complexity?: string): string {
    const baseTime = {
      button: { beginner: '1-2 hours', intermediate: '2-4 hours', advanced: '4-8 hours' },
      navigation: { beginner: '4-6 hours', intermediate: '6-12 hours', advanced: '1-2 days' },
      text: { beginner: '30 minutes', intermediate: '1-2 hours', advanced: '2-4 hours' },
      authentication: { beginner: '2-4 hours', intermediate: '4-8 hours', advanced: '1-2 days' }
    };
    
    const componentKey = this.normalizeComponentName(component);
    const timeEstimates = baseTime[componentKey as keyof typeof baseTime];
    
    if (timeEstimates) {
      return timeEstimates[complexity as keyof typeof timeEstimates] || timeEstimates.intermediate;
    }
    
    return complexity === 'beginner' ? '1-2 hours' : complexity === 'advanced' ? '4-8 hours' : '2-4 hours';
  }

  private normalizeComponentName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  }

  // Additional helper methods for content generation
  private extractDesignPrinciples(snippet: string): string[] {
    // Extract key design principles from snippet
    return [
      'Follow platform conventions and user expectations',
      'Maintain consistency throughout your app',
      'Prioritize clarity and usability',
      'Consider accessibility from the start'
    ];
  }

  private generateGenericBestPractices(component: string): string[] {
    return [
      `Use ${component} consistently throughout your app`,
      'Follow platform-specific design guidelines',
      'Test across different device sizes and orientations',
      'Ensure accessibility compliance',
      'Provide appropriate feedback for user interactions'
    ];
  }

  private generateDos(component: string): string[] {
    return [
      `Use ${component} for its intended purpose`,
      'Provide clear and descriptive labels',
      'Maintain consistent styling',
      'Test with real content and data',
      'Follow accessibility best practices'
    ];
  }

  private generateDonts(component: string): string[] {
    return [
      `Don't overuse ${component} in a single view`,
      'Don\'t use ambiguous or unclear labels',
      'Don\'t ignore platform conventions',
      'Don\'t forget to test edge cases',
      'Don\'t neglect accessibility considerations'
    ];
  }

  private generateAccessibilityGuidance(component: string): string[] {
    return [
      'Ensure proper accessibility traits and labels',
      'Support VoiceOver and other assistive technologies',
      'Maintain sufficient color contrast',
      'Test with accessibility features enabled',
      'Provide alternative interaction methods when needed'
    ];
  }

  private generateVisualExamples(component: string, platform?: string): string[] {
    return [
      `Standard ${component} appearance on ${platform || 'iOS'}`,
      `${component} in different states (normal, highlighted, disabled)`,
      `${component} with various content lengths`,
      `${component} in light and dark mode`
    ];
  }

  private generateCodeExamples(component: string, framework: string, patterns?: any): any[] {
    if (patterns) {
      return Object.entries(patterns).map(([key, code]) => ({
        framework,
        language: framework === 'SwiftUI' ? 'Swift' : 'Swift',
        code: code as string,
        description: `${key} implementation of ${component}`
      }));
    }
    
    return [{
      framework,
      language: 'Swift',
      code: `// Basic ${component} implementation\n// Add your implementation here`,
      description: `Basic ${component} implementation`
    }];
  }

  private generateArchitecturalNotes(component: string, framework: string): string[] {
    return [
      `${component} fits into the ${framework} architecture as a UI component`,
      'Consider data flow and state management requirements',
      'Plan for reusability across different parts of your app',
      'Consider performance implications for complex implementations'
    ];
  }

  private generatePrerequisites(component: string, platform?: string): string[] {
    return [
      `${platform || 'iOS'} development environment setup`,
      'Basic understanding of Swift and the chosen framework',
      'Familiarity with Interface Builder or SwiftUI',
      'Understanding of Auto Layout or SwiftUI layout system'
    ];
  }

  private generateCommonPitfalls(component: string): string[] {
    return [
      `Not following ${component} design guidelines`,
      'Inconsistent implementation across the app',
      'Poor accessibility implementation',
      'Not handling edge cases properly',
      'Ignoring platform-specific behaviors'
    ];
  }

  private generateTestingGuidance(component: string): string[] {
    return [
      `Test ${component} functionality across different scenarios`,
      'Verify accessibility with VoiceOver and other tools',
      'Test with different content lengths and types',
      'Validate behavior in different device orientations',
      'Test with various system settings (text size, contrast, etc.)'
    ];
  }

  private generateImplementationOverview(component: string, platform: string, useCase?: string): string {
    return `This guide walks you through implementing ${component} on ${platform}${useCase ? ` for ${useCase}` : ''}, following Apple's design principles and best practices. You'll learn both the design considerations and technical implementation details.`;
  }

  private generateDesignDecisions(component: string, platform: string): any[] {
    return [
      {
        decision: `Choose appropriate ${component} style`,
        rationale: `Different styles convey different levels of importance and context`,
        alternatives: ['Primary', 'Secondary', 'Destructive', 'Plain']
      },
      {
        decision: 'Determine sizing and placement',
        rationale: 'Proper sizing ensures accessibility and visual hierarchy',
        alternatives: ['Standard size', 'Large size', 'Custom size']
      }
    ];
  }

  private generateDesignTokens(component: string, platform: string): any[] {
    return [
      { property: 'minHeight', value: '44pt', platform },
      { property: 'cornerRadius', value: '8pt', platform },
      { property: 'horizontalPadding', value: '16pt', platform }
    ];
  }

  private generateSetupSteps(component: string, platform: string, framework?: string): any[] {
    return [
      {
        step: 'Create new project or open existing project',
        notes: [`Ensure ${platform} deployment target is set appropriately`]
      },
      {
        step: `Import required ${framework || 'UI'} framework`,
        code: framework === 'SwiftUI' ? 'import SwiftUI' : 'import UIKit',
        notes: ['Add any additional framework imports as needed']
      }
    ];
  }

  private generateCoreImplementation(component: string, platform: string, framework?: string, knowledgeBase?: any): any[] {
    const patterns = knowledgeBase?.implementationPatterns?.[framework || 'SwiftUI'];
    const basicPattern = patterns?.basic || `// Basic ${component} implementation`;
    
    return [
      {
        feature: `Basic ${component}`,
        implementation: 'Create the fundamental component structure',
        codeExample: basicPattern,
        designAlignment: ['Follows platform conventions', 'Uses appropriate styling']
      }
    ];
  }

  private generateRefinementGuidance(component: string, platform: string): any[] {
    return [
      {
        aspect: 'Visual polish',
        guidance: 'Apply final styling and animations'
      },
      {
        aspect: 'Accessibility',
        guidance: 'Ensure full accessibility compliance'
      },
      {
        aspect: 'Performance',
        guidance: 'Optimize for smooth performance'
      }
    ];
  }

  private generateDesignValidation(component: string): string[] {
    return [
      'Verify visual consistency with design system',
      'Check spacing and alignment',
      'Validate color usage and contrast',
      'Ensure appropriate typography'
    ];
  }

  private generateFunctionalTesting(component: string): string[] {
    return [
      `Test all ${component} interactions`,
      'Verify proper state changes',
      'Test error handling',
      'Validate data flow'
    ];
  }

  private generateAccessibilityTesting(component: string, platform: string): string[] {
    return [
      'Test with VoiceOver enabled',
      'Verify keyboard navigation (macOS)',
      'Test with Dynamic Type',
      'Check color contrast ratios',
      'Validate with accessibility inspector'
    ];
  }

  private generatePerformanceTesting(component: string): string[] {
    return [
      'Profile rendering performance',
      'Test with large datasets',
      'Measure memory usage',
      'Test on older devices'
    ];
  }

  private generateSetupCode(framework: string, platform: string): string {
    if (framework === 'SwiftUI') {
      return `import SwiftUI\n\nstruct ContentView: View {\n    var body: some View {\n        // Your implementation here\n    }\n}`;
    }
    return `import UIKit\n\nclass ViewController: UIViewController {\n    override func viewDidLoad() {\n        super.viewDidLoad()\n        // Your implementation here\n    }\n}`;
  }

  private generateStylingCode(framework: string): string {
    if (framework === 'SwiftUI') {
      return `.foregroundColor(.primary)\n.font(.body)\n.padding()\n.background(Color(.systemBackground))\n.cornerRadius(8)`;
    }
    return `view.backgroundColor = UIColor.systemBackground\nview.layer.cornerRadius = 8\nview.clipsToBounds = true`;
  }

  private generatePlatformDesignAdaptations(component: string, platform: string): string[] {
    const adaptations: Record<string, string[]> = {
      iOS: ['Use iOS-specific button styles', 'Follow iOS navigation patterns'],
      macOS: ['Adapt to macOS window chrome', 'Use macOS-specific controls'],
      watchOS: ['Optimize for small screen', 'Use Digital Crown when appropriate'],
      tvOS: ['Design for focus-based navigation', 'Use tvOS button styles']
    };
    
    return adaptations[platform] || ['Follow platform-specific guidelines'];
  }

  private generatePlatformImplementationDifferences(component: string, platform: string): string[] {
    return [
      `${platform}-specific API differences`,
      'Platform-specific styling options',
      'Different interaction patterns',
      'Platform-specific best practices'
    ];
  }

  private generatePlatformBestPractices(component: string, platform: string): string[] {
    return [
      `Follow ${platform} design guidelines`,
      'Use platform-appropriate patterns',
      'Consider platform-specific features',
      'Test on actual devices'
    ];
  }

  private generatePlatformCodeExamples(component: string, platform: string, knowledgeBase?: any): any[] {
    const framework = platform === 'macOS' ? 'AppKit' : 'SwiftUI';
    return [{
      framework,
      code: `// ${platform}-specific ${component} implementation\n// Platform-optimized code here`,
      description: `${component} optimized for ${platform}`
    }];
  }

  private getRelatedComponents(component: string): string[] {
    const relationships: Record<string, string[]> = {
      button: ['navigation', 'alert', 'sheet'],
      navigation: ['button', 'list', 'tab'],
      text: ['textField', 'label', 'font'],
      authentication: ['button', 'textField', 'biometric']
    };
    
    return relationships[this.normalizeComponentName(component)] || [];
  }

  private getRelatedDesignPatterns(component: string): string[] {
    return [
      'Progressive disclosure',
      'Visual hierarchy',
      'Consistency patterns',
      'Feedback patterns'
    ];
  }

  private getRelatedTechnicalConcepts(framework: string): string[] {
    const concepts: Record<string, string[]> = {
      SwiftUI: ['State management', 'Data binding', 'View composition'],
      UIKit: ['Delegation', 'Auto Layout', 'View controllers'],
      AppKit: ['Responder chain', 'Document architecture', 'Menu systems']
    };
    
    return concepts[framework] || ['Platform APIs', 'Design patterns'];
  }

  private getGenericDesignGuidelines(component: string): string[] {
    return [
      'Follow platform design conventions',
      'Maintain visual consistency',
      'Prioritize accessibility',
      'Consider user context and needs',
      'Test with real content'
    ];
  }
}