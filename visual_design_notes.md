# Sustainability App Design Guide
## Supporting Small Businesses Through Sustainable Practices

---

## Color Palette

### Primary Colors
- **Forest Green**: `#2D5F3F` - Trust, growth, environmental commitment
- **Sage Green**: `#8BA888` - Calm, approachable, natural
- **Cream**: `#F5F1E8` - Warmth, clarity, openness
- **Warm Cream**: `#FCF8F0` - Background warmth, gentle contrast

### Accent Colors
- **Terracotta**: `#C86B4B` - Energy, action, human touch
- **Golden Ochre**: `#D4A574` - Optimism, highlights, success markers
- **Deep Earth Brown**: `#4A3829` - Grounding, text, stability

### Supporting Neutrals
- **Soft Gray-Green**: `#B8C4BD` - Borders, dividers, subtle elements
- **Off-White**: `#FDFCFA` - Pure backgrounds, cards, cleanliness

---

## Typography 

### Classic & Trustworthy 
- **Headings**: **Plus Jakarta Sans** (weights: 600, 700)
  - Friendly, rounded, accessible
  - Modern without being trendy
- **Body Text**: **Inter** (weights: 400, 500)
  - Industry standard for interfaces
  - Exceptional map label legibility
- **Data/Numbers**: **JetBrains Mono** (weight: 400) - Optional
  - For statistics, metrics, clear data display

---

## Design Principles

### 1. Warmth Through Purpose
- Use cream backgrounds as the foundation to create an inviting canvas
- Green tones should feel alive and growing, not corporate or sterile
- Terracotta accents provide human warmth and call-to-action energy
- Shadows should be soft (brown/green-tinted) rather than pure gray

### 2. Interactive Map Design

#### Visual Approach
- **Base Map**: Cream background with soft gray-green for roads/boundaries
- **Business Markers**: 
  - Use varying shades of green based on sustainability metrics
  - Pulse animation on hover (subtle, organic expansion)
  - Terracotta for selected/active businesses
  - Golden ochre for featured or high-impact businesses

#### Map Interactivity
- Smooth zoom with organic easing (not mechanical)
- Cluster markers that bloom/expand when zoomed
- Hover states reveal mini-cards with cream backgrounds
- Connecting lines between related businesses in soft sage green

#### Information Clarity
- Use cream cards with subtle shadows for business details
- Clear hierarchy: Business name (larger, Plus Jakarta Sans Bold) → Category (smaller, Inter Medium) → Impact metrics (Inter Regular with numbers in medium weight)
- Icons should be simple, line-based, in forest green with terracotta hover states

### 3. Living, Breathing Interface

#### Micro-animations
- Gentle floating on cards (2-3px vertical movement, 4-6s duration)
- Leaf or growth-inspired loading animations
- Success states that "bloom" or "grow"
- Smooth color transitions (300-400ms)

#### Organic Shapes
- Rounded corners throughout (8-12px for cards, 16-24px for major containers)
- Soft blob shapes as background accents (10% opacity sage green)
- Irregular, hand-drawn-feeling dividers (not harsh lines)

#### Data Visualization
- Use warm gradients from sage to forest green
- Charts with rounded caps on bars
- Progress indicators with organic growth metaphors (sprouting seeds, growing plants)

### 4. Accessibility & Readability

#### Contrast Ratios
- Forest green on cream: 7.2:1 (AAA)
- Deep earth brown on cream: 10.5:1 (AAA)
- Ensure all map labels maintain WCAG AA standards

#### Text Sizing
- Minimum body text: 16px
- Map labels: 14px (bold weight for legibility)
- Headings: 24px, 32px, 40px scale
- Comfortable line-height: 1.6 for body, 1.3 for headings

---

## Component Examples

### Business Card
- **Background**: Warm cream with 1px soft gray-green border
- **Business Name**: Plus Jakarta Sans Bold, 20px, Deep Earth Brown
- **Category Badge**: Small pill shape, Sage Green background, Cream text, Inter Medium 12px
- **Impact Metrics**: Icons in Forest Green, numbers in Golden Ochre (Inter Medium 14px)
- **Hover State**: Subtle lift (4px) with terracotta accent line appearing on left edge

### Map Marker
- **Default**: Sage green circle with white center icon
- **Active**: Terracotta with scale increase (1.2x)
- **High Impact**: Golden ochre glow/ring
- **Pulse Animation**: Expanding sage green ring, 2s duration, 40% opacity

### Call-to-Action Buttons
- **Primary**: Forest green background, cream text, terracotta hover
- **Secondary**: Cream background, forest green border and text, sage green hover background
- **Shape**: Rounded (8px), comfortable padding (12px 24px)

---

## Implementation Notes

### Spacing System
Use a consistent 8px base unit:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

### Elevation (Shadows)
- **Level 1** (cards): `0 1px 3px rgba(45, 95, 63, 0.08)`
- **Level 2** (modals): `0 4px 12px rgba(45, 95, 63, 0.12)`
- **Level 3** (dropdowns): `0 8px 24px rgba(45, 95, 63, 0.16)`

### Motion Timing
- **Quick**: 150ms - small UI changes
- **Standard**: 300ms - most transitions
- **Smooth**: 500ms - page transitions, complex animations
- **Organic easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)`

---

## Key Takeaways

This design system balances **warmth and professionalism**, creating an environment where small businesses feel supported and users feel engaged. The green-cream palette evokes natural growth and sustainability without feeling cliché, while the carefully chosen typography ensures clarity even with dense map information. Interactive elements feel alive and responsive, encouraging exploration while maintaining the functional integrity crucial for a map-based interface.