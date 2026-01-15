# Design System Guide - Modern Timeleft-Inspired Design

## Overview
This design system implements a warm, elegant, and modern aesthetic inspired by Timeleft.com. It emphasizes human connection, community, and approachability through carefully chosen colors, typography, and layout patterns.

---

## 1. Color Palette

### Primary Backgrounds
- **Primary Background**: `#ffffff` (Pure white)
- **Secondary Background**: `#F7F3ED` (Warm beige/cream - main page background)
- **Hover Background**: `#F5F1EB` (Slightly darker beige for hover states)
- **Active Background**: `#EDE8E0` (Darker beige for active/pressed states)

### Text Colors
- **Primary Text**: `#2C2C2C` (Dark charcoal - main headings and body text)
- **Secondary Text**: `#5A5A5A` (Medium gray - supporting text, descriptions)
- **Tertiary Text**: `#8A8A8A` (Light gray - helper text, captions)

### Accent Colors
- **Primary Accent (Pink)**: `#FFB6C1` (Light pink - buttons, highlights, links)
- **Primary Accent Hover**: `#FFC0CB` (Slightly brighter pink)
- **Primary Accent Light**: `#FFE4E9` (Very light pink - focus rings, subtle backgrounds)

### Borders
- **Primary Border**: `#E5E0D8` (Warm light gray - card borders, input borders)
- **Light Border**: `#F0EBE3` (Very light warm gray - subtle dividers)

### Special Colors
- **White**: `#ffffff` (Pure white for text on dark backgrounds, button text)
- **Card Background**: `rgba(255, 255, 255, 0.8)` (Semi-transparent white for cards)
- **Form Card Background**: `rgba(255, 255, 255, 0.98)` (Nearly opaque white for form cards)

---

## 2. Typography

### Font Families
- **Body Font**: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
  - Used for: Body text, buttons, labels, navigation, general UI elements
  - Weights: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

- **Headline Font**: `'Playfair Display', 'Georgia', serif`
  - Used for: All headings (h1, h2, h3), hero headlines, section headlines
  - Weights: 400 (regular), 600 (semibold), 700 (bold)
  - Creates elegant, sophisticated contrast with body font

### Font Sizes
- **Extra Small**: `12px` (--font-xs) - Helper text, small labels
- **Small**: `14px` (--font-sm) - Form labels, captions
- **Base**: `16px` (--font-base) - Body text, buttons, default size
- **Large**: `18px` (--font-lg) - Emphasized body text, descriptions
- **Extra Large**: `20px` (--font-xl) - Subheadings
- **2XL**: `24px` (--font-2xl) - Card headings, section subheadlines
- **3XL**: `32px` (--font-3xl) - Large card headings
- **4XL**: `48px` (--font-4xl) - Section headlines
- **5XL**: `64px` (--font-5xl) - Hero headlines (desktop)
- **6XL**: `72px` (--font-6xl) - Extra large hero headlines

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Typography Usage Patterns
- **Hero Headlines**: Playfair Display, 64px (5xl), Bold, white color, text shadow
- **Section Headlines**: Playfair Display, 48px (4xl), Bold, primary text color
- **Section Subheadlines**: Playfair Display, 24px (2xl), Semibold, primary text color
- **Card Headings**: Playfair Display, 32px (3xl), Bold, primary text color
- **Form Labels**: Poppins, 14px (sm), Semibold, UPPERCASE, letter-spacing 0.5px, primary text color
- **Body Text**: Poppins, 16px (base), Normal, primary or secondary text color
- **Helper Text**: Poppins, 12px (xs), Normal, italic, tertiary text color

---

## 3. Spacing System

### Spacing Scale
- **Extra Small**: `4px` (--space-xs) - Tight spacing, icon padding
- **Small**: `8px` (--space-sm) - Label margins, small gaps
- **Medium**: `16px` (--space-md) - Standard spacing between elements
- **Large**: `24px` (--space-lg) - Card padding, section spacing
- **Extra Large**: `32px` (--space-xl) - Form group spacing, larger gaps
- **2XL**: `48px` (--space-2xl) - Section spacing, form card padding
- **3XL**: `64px` (--space-3xl) - Large section spacing

### Spacing Usage
- **Card Padding**: 32px (xl) standard, 48px (2xl) for form cards
- **Form Group Spacing**: 32px (xl) between form fields
- **Section Spacing**: 48px (2xl) between major sections
- **Button Padding**: 12px vertical, 28px horizontal (standard), 14px/32px for hero CTAs

---

## 4. Layout Patterns

### Container Structure
- **Main Container**: Max-width 1200px, centered, padding 0 24px
- **Full-Width Sections**: Hero sections span 100% width
- **Content Wrapper**: `.main-container` class wraps content after hero sections

### Hero Sections
- **Height**: Minimum 80vh (desktop), 60vh (mobile)
- **Background**: Full-cover background images with gradient overlay
- **Overlay**: Linear gradient from `rgba(0, 0, 0, 0.4)` to `rgba(0, 0, 0, 0.2)` at 135deg
- **Content Positioning**: Left-aligned, max-width 1200px, padding 120px 0 80px (desktop)
- **Text Shadow**: `0 2px 8px rgba(0, 0, 0, 0.4)` for headlines, `0 2px 4px rgba(0, 0, 0, 0.3)` for subtitles

### Card Design
- **Background**: `rgba(255, 255, 255, 0.8)` with `backdrop-filter: blur(10px)`
- **Border**: 1px solid, `#E5E0D8` (primary border color)
- **Border Radius**: `16px` (rounded corners)
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.06)` (soft, subtle shadow)
- **Padding**: 32px (xl) standard, 48px (2xl) for form cards
- **Margin**: 24px (lg) bottom spacing between cards

### Form Card Special Styling
- **Background**: `rgba(255, 255, 255, 0.98)` (more opaque)
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.1)` (stronger shadow for elevation)
- **Negative Margin Top**: `-48px` (2xl) to overlap hero section
- **Z-Index**: 5 (above hero section)
- **Border**: `1px solid rgba(255, 255, 255, 0.8)` (subtle white border)

---

## 5. Component Styles

### Buttons

#### Primary Button
- **Background**: `#FFB6C1` (accent pink)
- **Text Color**: White
- **Border**: Same as background, `30px` border-radius (pill shape)
- **Padding**: `12px 28px` (standard), `14px 32px` (hero CTAs)
- **Font**: Poppins, 16px (base), Medium weight
- **Shadow**: `0 4px 12px rgba(255, 182, 193, 0.3)` (pink glow)
- **Hover State**:
  - Background: `#FFC0CB` (lighter pink)
  - Transform: `translateY(-1px)` (slight lift)
  - Shadow: `0 4px 12px rgba(255, 182, 193, 0.3)`
- **Transition**: `all 0.3s ease`

#### Secondary Button
- **Background**: White
- **Text Color**: Primary text color (`#2C2C2C`)
- **Border**: `1px solid #E5E0D8` (primary border)
- **Border Radius**: `30px` (pill shape)
- **Padding**: `12px 28px`
- **Font**: Poppins, 16px (base), Medium weight
- **Hover State**:
  - Background: `#F5F1EB` (hover background)
  - Transform: `translateY(-1px)`
  - Shadow: `0 4px 12px rgba(0, 0, 0, 0.1)`

#### Hero Secondary Button (White/Transparent)
- **Background**: `rgba(255, 255, 255, 0.2)` (semi-transparent white)
- **Text Color**: White
- **Border**: `1px solid rgba(255, 255, 255, 0.5)`
- **Backdrop Filter**: `blur(10px)` (glass effect)
- **Hover State**:
  - Background: `rgba(255, 255, 255, 0.3)`
  - Border: `rgba(255, 255, 255, 0.7)`
  - Transform: `translateY(-2px)`

### Form Elements

#### Input Fields
- **Padding**: `14px 18px` (comfortable, spacious)
- **Border**: `1px solid #E5E0D8` (primary border)
- **Border Radius**: `12px` (rounded, not fully pill-shaped)
- **Background**: White
- **Font**: Poppins, 16px (base), inherited
- **Shadow**: `0 1px 2px rgba(0, 0, 0, 0.02)` (very subtle)
- **Hover State**:
  - Border: `#F0EBE3` (light border)
  - Shadow: `0 2px 4px rgba(0, 0, 0, 0.04)`
- **Focus State**:
  - Border: `#FFB6C1` (accent pink)
  - Shadow: `0 0 0 3px rgba(255, 182, 193, 0.2)` (pink focus ring)
  - Transform: `translateY(-1px)` (slight lift)
- **Transition**: `all 0.2s ease`

#### Labels
- **Font**: Poppins, 14px (sm), Semibold
- **Text Transform**: UPPERCASE
- **Letter Spacing**: `0.5px`
- **Color**: Primary text color
- **Margin Bottom**: 8px (sm)

#### Helper Text (Small)
- **Font**: Poppins, 12px (xs), Normal, Italic
- **Color**: Tertiary text color (`#8A8A8A`)
- **Line Height**: 1.5
- **Display**: Block
- **Margin Top**: 4px (xs)

### Cards

#### Standard Card
- **Background**: `rgba(255, 255, 255, 0.8)` with `backdrop-filter: blur(10px)`
- **Border**: `1px solid #E5E0D8`
- **Border Radius**: `16px`
- **Padding**: `32px` (xl)
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.06)`
- **Margin Bottom**: `24px` (lg)

#### Form Card
- **Background**: `rgba(255, 255, 255, 0.98)`
- **Border**: `1px solid rgba(255, 255, 255, 0.8)`
- **Border Radius**: `16px`
- **Padding**: `48px` (2xl)
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.1)`
- **Margin Top**: `-48px` (negative to overlap hero)
- **Z-Index**: 5

---

## 6. Header/Navigation

### Header Styles
- **Background**: White (standard), Transparent (overlay mode)
- **Border**: `1px solid #E5E0D8` (standard), `1px solid rgba(255, 255, 255, 0.2)` (overlay)
- **Position**: Sticky, top: 0, z-index: 100
- **Transition**: `background-color 0.3s ease, border-color 0.3s ease`

### Overlay Header (on Hero Sections)
- **Background**: Transparent
- **Position**: Absolute, width: 100%
- **Logo**: White color
- **Logo Icon**: `rgba(255, 255, 255, 0.2)` background with `backdrop-filter: blur(10px)`
- **Nav Links**: White color
- **Nav Link Hover**: `rgba(255, 255, 255, 0.1)` background
- **Nav Link Active**: `rgba(255, 255, 255, 0.2)` background
- **Hamburger Menu**: White spans

---

## 7. Visual Effects

### Shadows
- **Card Shadow**: `0 2px 8px rgba(0, 0, 0, 0.06)` (subtle)
- **Form Card Shadow**: `0 8px 32px rgba(0, 0, 0, 0.1)` (elevated)
- **Button Shadow**: `0 4px 12px rgba(255, 182, 193, 0.3)` (pink glow)
- **Input Shadow**: `0 1px 2px rgba(0, 0, 0, 0.02)` (very subtle)
- **Input Focus Shadow**: `0 0 0 3px rgba(255, 182, 193, 0.2)` (pink ring)

### Backdrop Filters
- **Card Backdrop**: `blur(10px)` (glass effect on cards)
- **Hero Button Backdrop**: `blur(10px)` (glass effect on transparent buttons)
- **Logo Icon Backdrop**: `blur(10px)` (glass effect on logo)

### Transitions
- **Standard**: `all 0.2s ease` (inputs, buttons)
- **Header**: `background-color 0.3s ease, border-color 0.3s ease`
- **Hero Buttons**: `all 0.3s ease`

### Transforms
- **Button Hover**: `translateY(-1px)` (subtle lift)
- **Hero Button Hover**: `translateY(-2px)` (more pronounced lift)
- **Input Focus**: `translateY(-1px)` (subtle lift)

---

## 8. Map Styling

### Map Container
- **Height**: 400px
- **Width**: 100%
- **Border Radius**: 6px
- **Border**: `1px solid #E5E0D8`
- **Filter**: `saturate(0.7) brightness(0.95)` (reduces vibrancy, softer look)

### Map Tile Layer
- **Provider**: Esri World Imagery (satellite/aerial view)
- **Attribution**: Required Esri attribution
- **Max Zoom**: 19

### Map Popup
- **Format**: Business/place name as title (if available), then address
- **Styling**: Bold title, address below

---

## 9. Responsive Design

### Breakpoints
- **Mobile**: Max-width 768px
- **Tablet**: 769px - 1024px
- **Desktop**: 1025px+

### Mobile Adjustments
- **Hero Section**: Min-height 60vh, padding 100px 0 60px
- **Hero Headline**: Font size 32px (3xl) instead of 64px
- **Form Card**: Padding 32px (xl), margin-top -32px
- **Form Columns**: Stack vertically (flex-direction: column)
- **Hero CTA Buttons**: Full width, stacked vertically
- **Section Headlines**: Font size 24px (2xl) instead of 48px

---

## 10. Image Guidelines

### Hero Images
- **Source**: Unsplash (high-quality, warm-toned images)
- **Style**: People-focused, community-oriented, warm lighting
- **Aspect Ratio**: Landscape, suitable for full-width display
- **Overlay**: Dark gradient overlay for text readability

### Image Usage
- **Homepage Hero**: Community gatherings, people connecting
- **Coordinate Page Hero**: People laughing, having fun (not drinks-focused)
- **Signup Page Hero**: Event/community focused imagery

---

## 11. Implementation Checklist

### CSS Variables Setup
```css
:root {
  /* Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #F7F3ED;
  --text-primary: #2C2C2C;
  --accent-pink: #FFB6C1;
  /* ... all other variables */
}
```

### Font Imports
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
```

### Key Classes
- `.hero-section` - Full-width hero with background image
- `.hero-content` - Content wrapper inside hero
- `.hero-headline` - Large headline in hero
- `.card` - Standard card component
- `.card.form-card` - Special form card styling
- `.button-primary` - Pink primary button
- `.button-secondary` - White secondary button
- `.section-headline` - Large section heading
- `.section-subheadline` - Medium section heading
- `.header.overlay` - Transparent header for hero sections

---

## 12. Design Principles

1. **Warmth**: Use warm beige backgrounds and soft pink accents to create approachability
2. **Elegance**: Serif headlines (Playfair Display) add sophistication
3. **Clarity**: Generous spacing and clear hierarchy improve readability
4. **Softness**: Rounded corners (16px cards, 30px buttons, 12px inputs) create friendliness
5. **Depth**: Subtle shadows and backdrop filters add visual interest without heaviness
6. **Accessibility**: High contrast text, clear focus states, readable font sizes
7. **Consistency**: Use design tokens (CSS variables) throughout for maintainability

---

## 13. Color Psychology

- **Warm Beige (#F7F3ED)**: Creates comfort, approachability, warmth
- **Light Pink (#FFB6C1)**: Friendly, welcoming, non-intimidating
- **Dark Charcoal (#2C2C2C)**: Professional, readable, not harsh black
- **Soft Shadows**: Subtle depth without heaviness

---

## 14. Typography Hierarchy

1. **Hero Headline** (64px, Playfair Display, Bold) - Primary attention
2. **Section Headline** (48px, Playfair Display, Bold) - Major sections
3. **Card Heading** (32px, Playfair Display, Bold) - Card titles
4. **Section Subheadline** (24px, Playfair Display, Semibold) - Subsections
5. **Body Text** (16px, Poppins, Normal) - Main content
6. **Helper Text** (12px, Poppins, Italic) - Supporting information

---

This design system creates a cohesive, warm, and modern aesthetic that emphasizes community, connection, and approachability while maintaining professionalism and elegance.
