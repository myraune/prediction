# Viking Market Design System

**Version 1.0** | Last updated: February 2026
**Brand:** Viking Market | **Product:** Prediction Market Platform
**Personality:** Minimalist | **Primary Emotion:** Trust | **Target Audience:** 18-45 traders, crypto-native, data-literate

---

## 1. FOUNDATIONS

### 1.1 Design Principles

**Principle 1: Clarity Over Decoration**
Every pixel serves a purpose. No gradients, no shadows, no ornamental borders. Information density is the product's value. If an element doesn't help the user make a decision, remove it.

- DO: Use white space to separate sections. Let data breathe.
- DON'T: Add background colors, icons, or decoration "to make it look nicer."

**Principle 2: Color Means Outcome**
Color is reserved exclusively for communicating trading outcomes. Green means YES/profit. Red means NO/loss. The interface chrome is neutral (black, white, gray) so that YES/NO colors carry maximum signal.

- DO: Use `--color-yes` and `--color-no` only for trading outcomes, P&L, and probability.
- DON'T: Use colored backgrounds for cards, colored text for headings, or brand color for navigation.

**Principle 3: Numbers Are the UI**
This is a financial product. Prices, probabilities, volumes, and P&L are the primary interface. Typography choices serve numeric readability: tabular figures, tight tracking, monospaced alignment.

- DO: Use `tabular-nums` for all numeric values. Right-align columns of numbers.
- DON'T: Display numbers without units. Never round away meaningful precision.

---

### 1.2 Color System

#### Primary Palette

| Token | Hex | RGB | Usage | WCAG on White |
|---|---|---|---|---|
| `--foreground` | `#0a0a0a` | 10, 10, 10 | Primary text, active states, buttons | AAA (19.5:1) |
| `--background` | `#ffffff` | 255, 255, 255 | Page background | -- |
| `--muted` | `#f5f5f5` | 245, 245, 245 | Input backgrounds, hover states, secondary surfaces | -- |
| `--muted-foreground` | `#737373` | 115, 115, 115 | Secondary text, labels, timestamps | AA (4.8:1) |
| `--border` | `#e5e5e5` | 229, 229, 229 | Card borders, dividers, input borders | -- |
| `--brand` | `#1a1a1a` | 26, 26, 26 | Logo lockup (do not use in UI chrome) | AAA (17.4:1) |

#### Semantic Colors (Trading)

| Token | Hex | RGB | Usage | WCAG on White |
|---|---|---|---|---|
| `--color-yes` | `#16a34a` | 22, 163, 74 | YES outcomes, profit, positive P&L | AA (3.5:1 large text) |
| `--color-no` | `#dc2626` | 220, 38, 38 | NO outcomes, loss, negative P&L, closing soon | AA (4.0:1 large text) |
| `--destructive` | `#dc2626` | 220, 38, 38 | Error messages, form validation (same as NO) | AA (4.0:1 large text) |

#### Chart Colors

| Token | Hex | Usage |
|---|---|---|
| `--chart-1` | `#16a34a` | YES price line, area fill |
| `--chart-2` | `#dc2626` | NO price line (when shown) |
| `--chart-3` | `#0a0a0a` | Neutral data series |
| `--chart-4` | `#2563eb` | Supplementary data |
| `--chart-5` | `#9333ea` | Supplementary data |

#### Sidebar Colors

| Token | Hex | Usage |
|---|---|---|
| `--sidebar` | `#fafafa` | Sidebar background |
| `--sidebar-foreground` | `#0a0a0a` | Sidebar text |
| `--sidebar-primary` | `#0a0a0a` | Active nav item background |
| `--sidebar-accent` | `#f5f5f5` | Hover state |
| `--sidebar-border` | `#e5e5e5` | Sidebar border |

#### Color Usage Rules

1. **Interface chrome** (navigation, cards, buttons, inputs): Only use neutral palette (foreground, background, muted, border).
2. **Trading data** (prices, outcomes, P&L): Only use `--color-yes` and `--color-no`.
3. **Error states**: Use `--destructive` with 10% opacity background (`bg-destructive/10 text-destructive`).
4. **Opacity modifiers**: Use Tailwind opacity syntax for tinted backgrounds:
   - Active buttons: `bg-[var(--color-yes)]` (full)
   - Inactive buttons: `bg-[var(--color-yes)]/8` (ghost)
   - Hover on ghost: `bg-[var(--color-yes)]/15`
   - Badge backgrounds: `bg-[var(--color-yes)]/15`

---

### 1.3 Typography

#### Font Families

| Token | Font | Usage |
|---|---|---|
| `--font-sans` | Geist Sans | All UI text |
| `--font-mono` | Geist Mono | Code, technical data |

#### Type Scale

| Role | Class | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| **Display** | `text-4xl sm:text-5xl` | 36/48px | `font-bold` | 1.1 | `tracking-tight` | Landing page hero only |
| **Page Title** | `text-xl` | 20px | `font-semibold` | 1.5 | `tracking-tight` | Page headings (h1) |
| **Section Title** | `text-lg` | 18px | `font-semibold` | 1.5 | -- | Section headings (h2) |
| **Card Title** | `text-sm` | 14px | `font-medium` | 1.5 | -- | Card headers (h3) |
| **Section Label** | `text-[11px]` | 11px | `font-semibold` | 1.5 | `tracking-wider uppercase` | Sidebar labels, stat labels |
| **Body** | `text-sm` | 14px | `font-normal` | 1.5 | -- | Default body text |
| **Body Large** | `text-lg` | 18px | `font-normal` | relaxed | -- | Landing page description |
| **Caption** | `text-xs` | 12px | `font-normal` | 1.5 | -- | Timestamps, metadata |
| **Micro** | `text-[10px]` | 10px | `font-medium` | 1.5 | `tracking-wider uppercase` | Category badges, tiny labels |
| **Stat Value** | `text-2xl` | 24px | `font-bold` | 1.5 | -- | Stat cards, portfolio values |
| **Price Large** | `text-3xl` | 30px | `font-bold` | 1 | -- | Market detail yes/no price |
| **Price Medium** | `text-lg` | 18px | `font-semibold` | 1.5 | -- | Related market prices |
| **Price Inline** | `text-[13px]` | 13px | `font-semibold` | 1.5 | -- | Card inline prices |

#### Numeric Text Rules

All numeric values must use `tabular-nums` for proper column alignment:
```
className="tabular-nums"      // Prices, shares, volumes
className="font-bold tabular-nums"  // Stat values
className="font-semibold tabular-nums"  // Inline prices
```

#### Heading Rules

All h1-h4 elements have `-0.025em` letter-spacing applied globally via CSS:
```css
h1, h2, h3, h4 { letter-spacing: -0.025em; }
```

---

### 1.4 Layout Grid

#### Breakpoints

| Name | Width | Usage |
|---|---|---|
| **Mobile** | < 640px | Single column, full-width cards |
| **sm** | >= 640px | 2-column grids, expanded padding |
| **lg** | >= 1024px | Sidebar visible, 2-column market detail |
| **xl** | >= 1280px | Wider container |

#### Page Max-Widths

| Context | Max-Width | Usage |
|---|---|---|
| Landing page | `max-w-5xl` (64rem) | Public marketing pages |
| Main app | `max-w-6xl` (72rem) | Authenticated dashboard pages |
| Admin | `max-w-7xl` (80rem) | Admin data-heavy pages |
| Auth pages | `max-w-sm` (24rem) | Login, register forms |
| Profile | `max-w-2xl` (42rem) | Single-column focused pages |

#### Layout Templates

**Main App Layout:**
```
[Sidebar 220px] | [Content flex-1]
                  [TopBar h-14 sticky]
                  [Main px-4 sm:px-6 py-6 max-w-6xl mx-auto]
```

**Market Detail:**
```
[Main Content 1fr] | [Sidebar 320px sticky top-72px]
grid-cols-1 lg:grid-cols-[1fr_320px] gap-6
```

**Stat Card Grid:**
```
grid-cols-1 sm:grid-cols-3 gap-4
```

---

### 1.5 Spacing System

Base unit: **4px** (Tailwind's 0.25rem scale)

| Token | Value | Class | Usage |
|---|---|---|---|
| `space-1` | 4px | `gap-1`, `p-1` | Tight inline elements |
| `space-1.5` | 6px | `gap-1.5` | Button groups, pill gaps |
| `space-2` | 8px | `gap-2`, `p-2` | Within components, label-input gap |
| `space-2.5` | 10px | `gap-2.5` | Nav item spacing |
| `space-3` | 12px | `gap-3`, `p-3` | Card internal sections, stat previews |
| `space-4` | 16px | `gap-4`, `p-4` | Card padding, grid gaps, form sections |
| `space-5` | 20px | `px-5` | Card content horizontal padding (shadcn) |
| `space-6` | 24px | `gap-6`, `space-y-6` | Page section spacing, layout gap |
| `space-8` | 32px | `space-y-8` | Major section breaks |

#### Spacing Hierarchy

```
Between page sections:     space-y-6 (24px)
Between cards in grid:     gap-4 (16px) or gap-3 (12px)
Within card sections:      space-y-4 (16px)
Within form groups:        space-y-3 (12px) or space-y-4 (16px)
Between label and input:   space-y-2 (8px)
Between inline elements:   gap-2 (8px) or gap-1.5 (6px)
```

---

### 1.6 Border Radius

| Token | Value | Computed | Usage |
|---|---|---|---|
| `--radius` | `0.625rem` | 10px | Base value |
| `rounded-sm` | `calc(var(--radius) - 4px)` | 6px | Small chips, micro badges |
| `rounded-md` | `calc(var(--radius) - 2px)` | 8px | Buttons, inputs, badges |
| `rounded-lg` | `var(--radius)` | 10px | Toggle containers, previews |
| `rounded-xl` | `calc(var(--radius) + 4px)` | 14px | Cards, sections, images |
| `rounded-full` | `9999px` | Pill | Avatars, probability bar, sort pills, nav pills |

#### Radius Rules

- **Cards and containers**: Always `rounded-xl`
- **Buttons and inputs**: Always `rounded-md` (via component defaults)
- **Avatars**: Always `rounded-full`
- **Probability bars**: Always `rounded-full`
- **Navigation pills**: Always `rounded-full`
- **Market images**: `rounded-xl`
- **Toggle containers**: `rounded-lg`

---

## 2. COMPONENTS

### 2.1 Navigation

#### Sidebar
- Width: `w-[220px]`
- Background: `bg-sidebar` (#fafafa)
- Border: `border-r`
- Active item: `bg-foreground text-background rounded-full` (black pill)
- Inactive item: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Item text: `text-[13px] font-medium`
- Category label: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`
- Logo area: Linked to `/`, contains VikingLogo + brand text

#### Top Bar
- Height: `h-14`
- Background: `bg-background/80 backdrop-blur-lg`
- Position: `sticky top-0 z-30`
- Border: `border-b`
- Search: `bg-muted border-0 rounded-lg` with `focus-visible:ring-1`
- Balance: `bg-muted rounded-full px-3 py-1 text-sm font-medium`
- Avatar: `h-8 w-8 bg-foreground text-background`

#### Sort Tabs (Horizontal Pills)
- Container: `flex items-center gap-1 overflow-x-auto`
- Active pill: `bg-foreground text-background rounded-full px-3 py-1.5 text-sm font-medium`
- Inactive pill: `text-muted-foreground hover:text-foreground hover:bg-muted rounded-full`

#### Status Filter
- Inline text links: `text-sm`
- Active: `text-foreground font-medium`
- Inactive: `text-muted-foreground hover:text-foreground`

---

### 2.2 Buttons

#### Variant Reference

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| `default` | `bg-primary` (#0a0a0a) | `text-primary-foreground` (white) | none | `bg-primary/90` |
| `outline` | `bg-background` (white) | `text-foreground` | `border` | `bg-accent` |
| `ghost` | transparent | `text-foreground` | none | `bg-accent` |
| `secondary` | `bg-secondary` (#f5f5f5) | `text-secondary-foreground` | none | `bg-secondary/80` |
| `destructive` | `bg-destructive` (#dc2626) | white | none | `bg-destructive/90` |
| `link` | transparent | `text-primary` | none | underline |

#### Size Reference

| Size | Height | Padding | Text Size | Icon Size |
|---|---|---|---|---|
| `xs` | 24px (h-6) | px-2 | text-xs | h-3 w-3 |
| `sm` | 32px (h-8) | px-3 | text-sm | h-3 w-3 |
| `default` | 36px (h-9) | px-4 py-2 | text-sm | h-4 w-4 |
| `lg` | 40px (h-10) | px-6 | text-sm | h-4 w-4 |
| `icon` | 36px (size-9) | -- | -- | h-4 w-4 |
| `icon-sm` | 32px (size-8) | -- | -- | h-4 w-4 |
| `icon-xs` | 24px (size-6) | -- | -- | h-3 w-3 |

#### Trading Buttons (Custom)

| Type | Background | Text | Hover | Usage |
|---|---|---|---|---|
| YES (active) | `bg-[var(--color-yes)]` | white | `/90` | Selected YES outcome |
| YES (ghost) | `bg-[var(--color-yes)]/8` | `text-[var(--color-yes)]` | `/15` | Unselected YES |
| NO (active) | `bg-[var(--color-no)]` | white | `/90` | Selected NO outcome |
| NO (ghost) | `bg-[var(--color-no)]/8` | `text-[var(--color-no)]` | `/15` | Unselected NO |
| YES sell | `border-[var(--color-yes)]` | `text-[var(--color-yes)]` | `/10` bg | Sell YES shares |
| NO sell | `border-[var(--color-no)]` | `text-[var(--color-no)]` | `/10` bg | Sell NO shares |

#### Auth Buttons
```
className="w-full bg-foreground text-background hover:bg-foreground/90"
```
Black button, full-width, for sign in / create account.

#### States (All Buttons)
- **Disabled**: `opacity-50 pointer-events-none`
- **Loading**: Text changes to "Buying..." / "Selling..." / "Signing in..."
- **Focus**: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`

---

### 2.3 Inputs

#### Text Input
- Height: `h-9` (36px)
- Border: `border border-input` (#e5e5e5)
- Radius: `rounded-md` (8px)
- Padding: `px-3 py-1`
- Text: `text-base md:text-sm`
- Placeholder: `text-muted-foreground`
- Focus: `focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring`
- Error: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`

#### Search Input (Custom)
- Background: `bg-muted`
- Border: `border-0`
- Radius: `rounded-lg`
- Focus: `focus-visible:ring-1 focus-visible:ring-foreground/20`
- Icon: `h-3.5 w-3.5 text-muted-foreground` positioned inside

#### Comment Input (Custom)
- Background: `bg-muted`
- Radius: `rounded-lg`
- Padding: `px-3 py-2`
- Focus: `focus:ring-1 focus:ring-foreground/20`
- No border

#### Trade Amount Input
- Class: `text-lg font-semibold mt-1` applied to standard Input
- Larger text for financial amounts

---

### 2.4 Cards

#### Standard Card
```html
<div className="rounded-xl border p-4 bg-card">
  <!-- content -->
</div>
```
- Border: 1px solid `--border`
- Background: `--card` (white)
- Padding: 16px all sides
- Radius: `rounded-xl` (14px)

#### Card with Header
```html
<div className="rounded-xl border bg-card">
  <div className="px-4 py-3 border-b">
    <h3 className="text-sm font-medium">Title</h3>
  </div>
  <div className="p-4">
    <!-- content -->
  </div>
</div>
```

#### Stat Card
```html
<div className="rounded-xl border p-4 bg-card">
  <p className="text-xs text-muted-foreground">Label</p>
  <p className="text-2xl font-bold mt-1 tabular-nums">Value</p>
</div>
```

#### Market List Container
```html
<div className="rounded-xl border divide-y overflow-hidden bg-card">
  <!-- MarketCard rows -->
</div>
```

---

### 2.5 Badges

#### Outcome Badges
| Type | Classes |
|---|---|
| YES (tinted) | `bg-[var(--color-yes)]/15 text-[var(--color-yes)]` |
| NO (tinted) | `bg-[var(--color-no)]/15 text-[var(--color-no)]` |
| YES (solid) | `bg-[var(--color-yes)] text-white` |
| NO (solid) | `bg-[var(--color-no)] text-white` |

#### Status Badges
| Type | Classes |
|---|---|
| Default | `variant="outline"` |
| Closing soon | `variant="outline" text-[var(--color-no)] border-[var(--color-no)]/30` |
| Role (admin) | `variant="default"` (black) |
| Role (user) | `variant="outline"` |

#### Category Label (Not Badge Component)
```html
<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
  POLITICS
</span>
```
Alternatively, in the detail page:
```html
<span className="text-muted-foreground font-medium text-xs">Politics</span>
```

---

### 2.6 Avatars

| Size | Dimensions | Text Size | Usage |
|---|---|---|---|
| Micro | `h-6 w-6` | `text-[10px]` | Nested replies |
| Small | `h-7 w-7` | `text-xs` | Table rows, comments |
| Default | `h-8 w-8` | `text-xs` | Top bar, comment input |
| Medium | `h-10 w-10` | `text-sm` | Podium cards |
| Large | `h-14 w-14` | `text-xl` | Profile page |

#### Fallback Patterns
- **Primary**: `bg-foreground text-background` (dark circle, white letter)
- **Muted**: `bg-muted text-foreground` (light circle, dark letter) -- for comment threads
- Content: First character of name, uppercased

---

### 2.7 Tables

- Container: `rounded-xl border bg-card` with header `px-4 py-3 border-b`
- Row height: Implicit (content-driven)
- Row hover: `hover:bg-muted/50`
- Header text: `text-foreground font-medium`
- Cell padding: `p-2`
- Numeric cells: `text-right tabular-nums`
- Dividers: `divide-y` or `border-b last:border-0`

---

### 2.8 Trading Panel

- Container: `rounded-xl border p-4 bg-card`
- BUY/SELL toggle: `rounded-lg bg-muted p-0.5` with pills inside
  - Active BUY: `bg-[var(--color-yes)]/15 text-[var(--color-yes)]`
  - Active SELL: `bg-[var(--color-no)]/15 text-[var(--color-no)]`
- YES/NO buttons: `py-3 rounded-lg font-semibold text-sm`
- Preview box: `bg-muted rounded-lg p-3 space-y-1.5 text-sm`
- Quick amounts: `variant="outline" size="sm" text-xs h-7 px-3`
- Submit: Full-width `h-11 font-semibold` with outcome color

---

### 2.9 Price Chart

- Container: `rounded-xl border p-4 bg-card`
- Time range pills: Same pattern as sort tabs (`bg-foreground text-background` active)
- Chart height: `h-[200px]`
- Y-axis: `0-100` range, `{v}` format
- Reference line: 50 midpoint, dashed, `--border` color
- Area fill: Linear gradient from `--color-yes` 30% opacity to 0%
- Tooltip: `bg-card`, `border`, `rounded-md`, `text-xs`
- Skeleton: Pulse animation with SVG wave path

---

### 2.10 Probability Bar

- Track: `rounded-full bg-muted`
- YES fill: `bg-[var(--color-yes)]`
- NO fill: `bg-[var(--color-no)]/30`
- Sizes: `sm` (h-1.5, no labels), `md` (h-2), `lg` (h-3)
- Labels (md/lg): `text-xs font-medium` with outcome colors

---

### 2.11 Market Card (List Row)

- Container: `flex items-center gap-3 px-4 py-3`
- Hover: `hover:bg-muted/50 transition-colors`
- Thumbnail: `h-10 w-10 rounded-lg object-cover`
- Title: `text-sm font-medium leading-tight line-clamp-2`
- Meta: `text-xs text-muted-foreground` with separator
- YES/NO buttons: `w-[60px] h-9 rounded-lg font-semibold text-[13px]`

---

### 2.12 Feedback Components

#### Error Alert (Forms)
```html
<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
  {error}
</div>
```

#### Toast Notifications
Via `sonner` library:
- `toast.success()` -- green checkmark
- `toast.error()` -- red X

#### Empty States
```html
<div className="text-center py-20 text-muted-foreground">
  <p className="font-medium">No markets found</p>
  <p className="text-sm mt-1">Try a different filter or search</p>
</div>
```
Variations: `py-8` for inline empty states, `py-4` for compact.

#### Loading States
- Buttons: Text changes ("Buying..." / "Selling...")
- Charts: Skeleton with `animate-pulse` and SVG wave
- Disabled state: `opacity-50 pointer-events-none`

#### Market Disabled State
```html
<div className="text-center py-6 text-muted-foreground">
  <p className="font-medium">Market is resolved</p>
  <p className="text-sm mt-1">Trading is no longer available</p>
</div>
```

---

## 3. PATTERNS

### 3.1 Page Templates

#### Landing Page
```
[Nav: logo + login/signup buttons]
[Hero: text-4xl heading + text-lg description + 2 CTA buttons]
[Stats Row: 3 columns, text-2xl values + text-xs labels]
[Top Markets: rounded-xl border divide-y list]
[How It Works: 3 numbered steps]
[CTA: text-2xl heading + button]
[Footer: brand + copyright]
```

#### Dashboard (Markets Browse)
```
[h1 "Markets" + count badge]
[Sort tabs: Trending | New | Ending Soon | Popular]
[Status filter: Open | Resolved | All]
[Market list: rounded-xl border divide-y]
```

#### Market Detail
```
[Image: h-44 sm:h-52 rounded-xl]
[Category + Status badges]
[h1 title + description]
[Price display: 3xl YES / NO cents]
[Probability bar: lg size]
[Stats bar: border-y]
[Info row: traders, volume, created]
[Price chart: rounded-xl border]
[Resolution rules: rounded-xl border]
[Your positions: rounded-xl border]
[Recent trades: rounded-xl border]
[Comments: rounded-xl border]
[Related markets: rounded-xl border]
         |  [Trade panel: rounded-xl border sticky]
         |  [Market info: rounded-xl border]
```

#### Auth (Login/Register)
```
[Centered container: max-w-sm]
[Logo + brand name]
[Heading + description]
[Form: space-y-4]
[Submit button: full-width black]
[Link to alternate auth page]
```

### 3.2 User Flows

#### Trading Flow
1. Browse markets (list view with inline YES/NO prices)
2. Click market row -> detail page
3. See large price + probability bar
4. Select BUY/SELL in trade panel
5. Select YES/NO outcome
6. Enter amount (or use quick-fill buttons)
7. Review preview (shares, avg price, slippage, return)
8. Confirm trade (colored button)
9. Toast notification on success
10. Page refreshes with updated positions

#### Authentication Flow
1. Landing page -> "Get Started" or "Sign In"
2. Login: email + password -> redirect to /markets
3. Register: name + email + password + confirm -> auto-login -> redirect to /markets
4. Error: inline red alert below form header

---

## 4. DESIGN TOKENS (JSON)

```json
{
  "color": {
    "background": "#ffffff",
    "foreground": "#0a0a0a",
    "card": "#ffffff",
    "card-foreground": "#0a0a0a",
    "primary": "#0a0a0a",
    "primary-foreground": "#ffffff",
    "secondary": "#f5f5f5",
    "secondary-foreground": "#0a0a0a",
    "muted": "#f5f5f5",
    "muted-foreground": "#737373",
    "accent": "#f5f5f5",
    "accent-foreground": "#0a0a0a",
    "border": "#e5e5e5",
    "input": "#e5e5e5",
    "ring": "#0a0a0a",
    "destructive": "#dc2626",
    "brand": "#1a1a1a",
    "yes": "#16a34a",
    "no": "#dc2626",
    "sidebar": {
      "background": "#fafafa",
      "foreground": "#0a0a0a",
      "primary": "#0a0a0a",
      "primary-foreground": "#ffffff",
      "accent": "#f5f5f5",
      "accent-foreground": "#0a0a0a",
      "border": "#e5e5e5"
    },
    "chart": {
      "1": "#16a34a",
      "2": "#dc2626",
      "3": "#0a0a0a",
      "4": "#2563eb",
      "5": "#9333ea"
    }
  },
  "radius": {
    "base": "0.625rem",
    "sm": "0.375rem",
    "md": "0.5rem",
    "lg": "0.625rem",
    "xl": "0.875rem",
    "full": "9999px"
  },
  "spacing": {
    "1": "0.25rem",
    "1.5": "0.375rem",
    "2": "0.5rem",
    "2.5": "0.625rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem"
  },
  "typography": {
    "fontFamily": {
      "sans": "Geist Sans, -apple-system, BlinkMacSystemFont, sans-serif",
      "mono": "Geist Mono, monospace"
    },
    "fontSize": {
      "micro": "10px",
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px"
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "letterSpacing": {
      "tight": "-0.025em",
      "wider": "0.05em",
      "widest": "0.1em"
    }
  },
  "shadows": {
    "none": "none"
  },
  "animation": {
    "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    "transition": "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
  }
}
```

---

## 5. DO'S AND DON'TS

### DO

1. **DO** use `tabular-nums` on every number that might appear in a column or be compared visually.
2. **DO** show prices in cents format: `72` not `0.72` or `72%`.
3. **DO** use `rounded-xl border p-4 bg-card` for all card-like containers.
4. **DO** use the active pill pattern (`bg-foreground text-background rounded-full`) for navigation.
5. **DO** keep page titles at `text-xl font-semibold tracking-tight`.
6. **DO** use `space-y-6` between major page sections.
7. **DO** right-align numeric table columns with `text-right`.
8. **DO** show units with values: `72` (YES price), `1,000 pts` (balance), `3.50 shares`.
9. **DO** use YES/NO colors only for trading outcomes.
10. **DO** provide empty states with a call to action.

### DON'T

1. **DON'T** add shadows to cards. Ever. The design is flat with borders only.
2. **DON'T** use `--color-brand` for UI elements. It's for the logo lockup only.
3. **DON'T** use colored backgrounds on cards or sections. Only `bg-card` (white) or `bg-muted` (#f5f5f5).
4. **DON'T** use the Card/CardHeader/CardContent shadcn components for new UI. Use plain `div` with `rounded-xl border`.
5. **DON'T** add icons to sort tabs or navigation pills. Text only.
6. **DON'T** use `nb-NO` or any hardcoded locale. Use `en-US` or no locale parameter.
7. **DON'T** use `text-2xl font-bold` for page titles. That's only for stat values.
8. **DON'T** mix `border-border/60` with `border`. Just use `border` (which uses `--border`).
9. **DON'T** add dark mode styles. The app is light-only with `forcedTheme="light"`.
10. **DON'T** use percentage format for prices. Always use cents: `72` not `72%`.

---

## 6. IMPLEMENTATION GUIDE

### For Developers

#### Adding a New Page
```tsx
export default async function NewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Page Title</h1>
        <p className="text-sm text-muted-foreground mt-1">Description</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Label</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">Value</p>
        </div>
      </div>

      {/* Data section */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Section Title</h3>
        </div>
        <div className="p-4">
          {/* Table or content */}
        </div>
      </div>
    </div>
  );
}
```

#### Adding a Trading Element
```tsx
// YES/NO price display
<span className="text-[var(--color-yes)] font-semibold tabular-nums">
  {Math.round(price.yes * 100)}
</span>

// YES/NO badge
<Badge className="bg-[var(--color-yes)]/15 text-[var(--color-yes)]">YES</Badge>

// P&L display
<span className={cn(
  "font-medium tabular-nums",
  pnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
)}>
  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
</span>
```

#### Focus & Accessibility
```tsx
// All interactive elements get this focus ring (via component defaults):
"focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring"

// Error states use aria-invalid:
"aria-invalid:ring-destructive/20 aria-invalid:border-destructive"

// Disabled state:
"disabled:pointer-events-none disabled:opacity-50"
```

---

*Viking Market Design System v1.0 - Built with Next.js 15, Tailwind CSS v4, shadcn/ui (new-york), Geist fonts.*
