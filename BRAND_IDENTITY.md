# Viking Market — Brand Identity & UI/UX System

**Version 1.0** | February 2026
**Prepared by:** Creative Director, Pentagram × Senior UI Designer, Apple
**Product:** Prediction Market Platform (Web)
**Live:** prediction-vert.vercel.app

---

# PART ONE: BRAND STRATEGY

## 1. Brand Strategy Foundation

**Mission:** Make real-time information trading accessible to everyone through a simple, transparent prediction market.

**Vision:** Become the default place people go to understand what the world thinks will happen next.

**Values:**
1. **Transparency** — Prices, odds, and outcomes are always visible. No hidden mechanics.
2. **Simplicity** — Complex financial instruments reduced to a binary: YES or NO.
3. **Precision** — Every number matters. We display data with care and accuracy.
4. **Fairness** — An automated market maker ensures equal access. No insider advantages.
5. **Clarity** — The interface never obscures information behind decoration.

**Positioning:** Viking Market is the prediction market for people who care about accuracy over entertainment. Unlike betting platforms that gamify everything, or financial exchanges that intimidate with complexity, Viking Market presents probability as a clean, minimal interface where the numbers *are* the product.

---

## 2. Brand Story

**Challenge:** People make important decisions every day based on vague intuitions about the future — elections, markets, technology shifts, climate events. Traditional media offers opinions. Social media offers noise. Neither gives you a clear, real-time signal of what informed people actually believe will happen.

**Transformation:** Viking Market turns collective intelligence into a number. When thousands of traders put points on the line, the resulting price — 72¢ for YES, 28¢ for NO — becomes the most honest assessment of probability available. No editorial bias, no algorithmic manipulation, just a price that moves with new information.

**Resolution:** A world where anyone can open Viking Market and immediately understand what the crowd believes about any event. A clean number. A clear signal. Trade on what happens next.

---

## 3. Brand Personality

**Archetype: The Sage**
Viking Market is the calm, knowledgeable voice in a room full of speculation. It doesn't shout, doesn't decorate, doesn't persuade. It presents data and lets you decide.

**Human traits:**
- **Intelligent** — speaks precisely, never dumbs down
- **Confident** — quiet confidence, not loud bravado
- **Minimal** — says less, means more
- **Trustworthy** — consistent, reliable, no surprises
- **Direct** — no jargon, no fluff, no marketing speak

**Viking Market is NOT:**
- Flashy (we're not a casino)
- Aggressive (we're not a trading floor)
- Playful (we're not a game app)
- Corporate (we're not a bank)

---

## 4. Voice & Tone Matrix

| Dimension | Position | Example |
|---|---|---|
| **Funny ←→ Serious** | 80% Serious | "Trade on what happens next." not "Bet on the future! 🎲" |
| **Casual ←→ Formal** | 60% Casual | "Buy YES at 72¢" not "Execute a long position on the affirmative outcome" |
| **Irreverent ←→ Respectful** | 75% Respectful | "Markets are open" not "Let's make some money, degens" |
| **Enthusiastic ←→ Matter-of-fact** | 85% Matter-of-fact | "1,000 free points. No credit card." not "Start your AMAZING journey!!!" |

**Voice rules:**
- Use sentence case everywhere (not Title Case)
- Numbers always win over words ("72¢" not "about seventy percent")
- Keep sentences under 15 words where possible
- Never use exclamation marks in product UI
- Use periods. Short sentences. Let them land.

---

## 5. Messaging Hierarchy

**Tagline:** *Trade on what happens next.*

**Value Proposition:** Buy and sell shares on future events. Prices 1¢–99¢ reflect real-time probability.

**Key Messages:**
1. "Prices are probabilities" — Every price is the crowd's belief expressed as cents
2. "Start free" — 1,000 free points, no credit card, no risk
3. "Binary simplicity" — Every market is YES or NO. That's it.
4. "Real-time signal" — Prices move with news. Watch probability in real time.

**Proof Points:**
- LMSR automated market maker ensures fair pricing
- Markets across 10+ categories (politics, sports, crypto, climate, tech)
- Sub-second price updates
- Transparent trade history visible to all

---

# PART TWO: VISUAL IDENTITY SYSTEM

## 6. Logo System

### 6.1 Logo Concept — Strategic Rationale

Viking Market uses a **wordmark-first** approach. The name is the brand.

**Direction chosen: Wordmark + Icon Lockup**
- **Wordmark:** "Viking Market" in a clean geometric sans-serif (Geist Sans bold weight), lowercase, tight tracking
- **Icon:** A stylized V mark derived from the intersection of Viking ship geometry — abstract enough to work at favicon scale, distinctive enough to be recognized at a glance
- **Rationale:** Prediction markets are trust-first products. A wordmark conveys maturity and seriousness. The lowercase treatment signals accessibility and modernity without sacrificing authority.

### 6.2 Logo Variations

| Variant | File | Usage |
|---|---|---|
| **Primary (full color)** | `logo-dark.svg` | On white/light backgrounds — main usage |
| **Reversed** | `logo-light.svg` | On dark backgrounds |
| **Icon only** | `icon-1.svg` | Favicon, app icon, small contexts |
| **Icon alt** | `icon-2.svg`, `icon-3.svg` | Social avatars, alternate contexts |
| **Favicon** | `favicon.svg` | Browser tab |

### 6.3 Minimum Size

- Wordmark: never smaller than **80px wide** (digital)
- Icon: never smaller than **16×16px** (favicon is the floor)
- At sizes below 20px, use icon-only variant, never the full wordmark

### 6.4 Clear Space

- Minimum clear space around wordmark: **height of the "V" character** on all sides
- Minimum clear space around icon: **50% of icon width** on all sides
- Never place the logo on busy backgrounds or over images

### 6.5 Logo Usage Rules

**Correct applications:**
1. Wordmark on white background with generous clear space (sidebar header)
2. Icon as favicon at 16×16 or 32×32 on white
3. Wordmark in landing page nav, left-aligned, height 22px
4. Icon in mobile header alongside text "Viking Market"
5. Wordmark on a flat #f5f5f5 surface with sufficient contrast

**Incorrect applications — DO NOT:**
1. Place logo on a photographic or busy background
2. Rotate, stretch, or distort the logo
3. Apply drop shadows, gradients, or effects to the logo
4. Use the logo in colors other than black (#0a0a0a) or white (#ffffff)
5. Place the icon inside a colored circle or container
6. Use the wordmark at sizes where text becomes illegible (<80px)

---

## 7. Color Palette

### 7.1 Primary Colors

| Name | Hex | RGB | Pantone (nearest) | CMYK | Usage |
|---|---|---|---|---|---|
| **Ink** | `#0a0a0a` | 10, 10, 10 | Black 6 C | 0, 0, 0, 96 | Primary text, buttons, active nav, logo |
| **Paper** | `#ffffff` | 255, 255, 255 | — | 0, 0, 0, 0 | Page background, card background |

**Psychology:** Black-on-white is the highest-contrast, most trustworthy color combination. It says "we have nothing to hide." Financial products that use heavy color feel speculative. Viking Market feels factual.

### 7.2 Secondary Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Stone** | `#f5f5f5` | 245, 245, 245 | Input fields, hover states, muted surfaces, sidebar |
| **Ash** | `#737373` | 115, 115, 115 | Secondary text, timestamps, labels, descriptions |
| **Wire** | `#e5e5e5` | 229, 229, 229 | Borders, dividers, card outlines, table rules |

**Psychology:** A tight grayscale keeps the interface recessive, allowing the trading colors (green/red) to dominate visual attention whenever they appear.

### 7.3 Semantic Colors (Trading)

| Name | Hex | RGB | Usage | Psychology |
|---|---|---|---|---|
| **Win / YES** | `#16a34a` | 22, 163, 74 | YES buttons, profit, positive P&L, chart area fill | Universal "go" and "positive" signal |
| **Risk / NO** | `#dc2626` | 220, 38, 38 | NO buttons, loss, negative P&L, closing-soon warnings | Universal "stop" and "negative" signal |

**Rule:** Green and red appear ONLY for trading outcomes. Never for brand, navigation, decoration, or status indicators unrelated to trading.

### 7.4 Accent / Utility Colors

| Name | Hex | Usage |
|---|---|---|
| **Blue** | `#2563eb` | Links (rare), chart-4 |
| **Purple** | `#9333ea` | Chart-5 |
| **Destructive** | `#dc2626` | (shares --color-no) Error states, delete actions |

### 7.5 Contrast Ratios (WCAG 2.1)

| Pair | Ratio | Rating |
|---|---|---|
| Ink on Paper (#0a0a0a on #ffffff) | 19.5:1 | AAA ✓ |
| Ash on Paper (#737373 on #ffffff) | 4.8:1 | AA ✓ |
| Win on Paper (#16a34a on #ffffff) | 3.5:1 | AA Large ✓ |
| Risk on Paper (#dc2626 on #ffffff) | 4.6:1 | AA ✓ |
| Wire on Paper (#e5e5e5 on #ffffff) | 1.4:1 | Decorative only |

---

## 8. Typography

### 8.1 Typefaces

**Primary:** Geist Sans (by Vercel)
- Modern geometric sans-serif with excellent readability at small sizes
- Tabular figures built in — critical for a financial product
- Available weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

**Monospace:** Geist Mono (by Vercel)
- Used sparingly for step numbers, code-like elements, and raw data

### 8.2 Type Scale

| Role | Size | Weight | Tracking | Example |
|---|---|---|---|---|
| **Display** | 40–48px (text-4xl/5xl) | Bold (700) | -0.025em | Hero headlines on landing page |
| **Page Title** | 20px (text-xl) | SemiBold (600) | -0.025em | "Portfolio", "Leaderboard" |
| **Section Heading** | 14px (text-sm) | Medium (500) | default | "Price History", "Recent Activity" |
| **Overline** | 11px | SemiBold (600) | 0.05em uppercase | "MARKET INFO", "CATEGORIES" |
| **Body** | 14px (text-sm) | Regular (400) | default | Descriptions, comments, paragraphs |
| **Body Small** | 13px (text-[13px]) | Medium (500) | default | Nav items, card titles |
| **Caption** | 12px (text-xs) | Regular (400) | default | Timestamps, labels, meta info |
| **Micro** | 10–11px | Medium (500) | 0.05em | Category badges, step numbers |
| **Numeric (Large)** | 24–36px | Bold (700) | default | Price display (72¢), portfolio values |
| **Numeric (Inline)** | 13–14px | SemiBold (600) | default | Table figures, card prices |

### 8.3 Typography Rules

- All numeric values use `tabular-nums` for column alignment
- Headings use `tracking-tight` (-0.025em)
- Body text maxes out at `max-w-lg` (512px) for comfortable line length
- Overlines: always `uppercase tracking-widest text-muted-foreground`
- Price displays always use ¢ suffix: "72¢" not "0.72" or "72%"

---

## 9. Imagery & Photography

### 9.1 Market Thumbnails

- **Size:** 40×40px in card list view, full-width 176–208px tall in detail view
- **Style:** High-quality editorial/photojournalistic style (Unsplash sourced)
- **Subjects:** Relevant to market topic — politicians, stadiums, tech, nature
- **Treatment:** Always displayed with `object-cover` and `rounded-lg` or `rounded-xl`
- **Fallback:** Plain `bg-muted` rectangle when no image available

### 9.2 Iconography

- **Source:** Lucide icon set (consistent with shadcn/ui)
- **Size:** 14px (h-3.5 w-3.5) for inline, 16px (h-4 w-4) for nav, 20px (h-5 w-5) for mobile
- **Weight:** 1.5px stroke (Lucide default)
- **Color:** Always `text-muted-foreground` or `text-foreground`, never colored
- **Rule:** Icons supplement text labels, never replace them in navigation

### 9.3 No Illustrations

Viking Market does not use illustrations, mascots, decorative graphics, or emoji in the product UI. The brand communicates through data and typography alone.

---

# PART THREE: UI/UX PATTERN SYSTEM

## 10. User Research Foundation

**Primary User Persona: "Data-Driven Alex"**
- Age 22–40, digitally native, follows news/crypto/politics
- Comfortable with financial interfaces (Robinhood, Coinbase)
- Values speed and information density over tutorials
- Uses mobile 60% of the time, desktop 40%

**Top 3 User Goals:**
1. Quickly scan markets and find interesting events to trade
2. Understand current probability and price movement
3. Execute a trade (buy/sell) in under 10 seconds

**Pain Points in Existing Solutions:**
1. Polymarket is cluttered with too many categories and dense text
2. Kalshi requires KYC and feels intimidating for new users
3. Most prediction markets have confusing order book UIs

---

## 11. Hierarchy & Layout

### 11.1 Visual Hierarchy Strategy

**First look (< 1 second):** Market title + YES/NO price in green/red cents
**Second look (1–3 seconds):** Volume, time remaining, price chart direction
**Third look (3+ seconds):** Trade panel, positions, activity feed, comments

**Principle:** The hierarchy always leads with *what* and *how likely*, followed by *context*, then *action*.

### 11.2 Layout Patterns

**F-Pattern (Markets browse page):**
- Eye enters at top-left (logo/nav)
- Scans horizontally across sort tabs
- Drops down the left edge of the market list
- Each card's title→volume→price follows the F-bar

**Z-Pattern (Landing page):**
- Top-left: Logo → Top-right: Sign up button
- Diagonal: Hero text "Trade on what happens next"
- Bottom-left: Stats (markets, volume, trades) → Bottom: Top markets list

### 11.3 Content Density

Viking Market prioritizes **information density over breathing room** — this is a financial product, not a lifestyle app. However, density is achieved through *tight spacing* and *compact components*, never through *small text* or *hidden information*.

- Cards: `px-4 py-3.5` (compact padding, not cramped)
- Sections: `space-y-6` gap between major blocks
- Max content width: `max-w-6xl` (1152px) inside main layout
- Sidebar: fixed 220px, never collapses on desktop

---

## 12. Platform Patterns

### 12.1 Navigation

**Desktop:** Persistent left sidebar (220px) with:
- Logo (wordmark, links to landing page)
- Main nav: Markets, Portfolio, Leaderboard (icon + label)
- Category nav: 10 categories with counts (icon + label + count)

**Mobile:** Hamburger → Sheet overlay (260px) with identical nav
**Top bar:** Search field (left), balance pill + avatar dropdown (right)

### 12.2 Navigation Active States

- Active main nav item: `bg-foreground text-background rounded-lg` (black pill)
- Active category: `bg-muted text-foreground font-medium rounded-lg`
- Hover (all): `hover:bg-muted hover:text-foreground`

### 12.3 Modals & Sheets

- Mobile sidebar: `Sheet` from left, 260px wide
- Dropdown menus: `DropdownMenu` for avatar/settings, 192px wide
- Toasts: `sonner` toasts for trade confirmations, bottom-right
- No full-screen modals in the current design

### 12.4 Gestures (Mobile)

- Swipe left on market card: (future) Quick trade
- Pull-to-refresh: Native browser behavior
- Sheet dismissal: Swipe right or tap overlay

---

## 13. Screen Designs (8 Key Screens)

### Screen 1: Landing Page (Onboarding/Welcome)

**Layout:** Full-width, no sidebar. Top nav bar with logo + Login/Sign Up.

**Component inventory:**
- Nav: logo (left), ghost "Log in" + solid "Sign up" buttons (right)
- Hero section: H1 "Trade on what happens next." + subtitle + CTA buttons + stats row
- Top Markets: bordered list of MarketCards in `divide-y` layout
- How It Works: 3-column grid with step numbers (01, 02, 03)
- CTA: centered "Ready to start?" with sign-up button
- Footer: copyright + "Virtual prediction market · No real money"

**Interactions:**
- "Get Started" → /register
- "Browse Markets" → /markets
- Market cards → /markets/[id]
- "View all" → /markets

**Empty state:** If database unavailable, hero still renders with 0 stats, no market list.

**Designer's Notes:** The landing page is deliberately sparse. No screenshots, no feature grids, no testimonials. The product *is* the content — showing live market data in the "Top Markets" section is more convincing than any marketing copy.

---

### Screen 2: Markets Browse (Home/Dashboard)

**Layout:** Sidebar + TopBar + content area (max-w-6xl)

**Component inventory:**
- Sort tabs: Horizontal pills (Trending, New, Ending Soon, Popular)
- Status filter: Text links (Active, Resolved, All)
- Market count: "Showing N markets"
- Market list: `rounded-xl border divide-y bg-card` containing MarketCards
- Each MarketCard: thumbnail (40×40) + title + meta row (volume · time) + YES/NO price buttons

**Interactions:**
- Tab click → sort/filter with URL params
- Category click in sidebar → filter by category
- Search → URL param `?q=query`
- Card click → /markets/[id]
- YES/NO buttons on card → stopPropagation (visual only in card context)

**Loading state:** Skeleton — 6 rows of `h-14 bg-muted animate-pulse rounded-lg`

**Empty state:** "No markets found" with link to browse all categories

**Designer's Notes:** The list layout (not grid) is a deliberate Polymarket/Kalshi pattern. Lists scan faster than grids because the eye stays in one column. The YES/NO price buttons provide at-a-glance probability without opening the detail page.

---

### Screen 3: Market Detail (Primary Task Screen)

**Layout:** Two-column on desktop (content | 320px sidebar), single-column on mobile.

**Component inventory — Main column:**
1. Market image (full-width, rounded-xl, h-44 to h-52)
2. Category label + status badges (resolved/closing-soon)
3. H1 title + description
4. Big price display: `72¢` YES / `28¢` NO in large colored text
5. Probability bar (green/red proportional bar)
6. Stats bar (YES price, NO price, volume, trades, time remaining)
7. Info row (traders count, volume, created date)
8. Price chart (Recharts area chart with time range selector)
9. Resolution rules (if defined)
10. User positions (if logged in and has positions)
11. Recent activity feed (trades list)
12. Comments section
13. Related markets

**Component inventory — Sidebar (320px, sticky):**
1. Trade panel (BUY/SELL toggle, YES/NO buttons, amount input, preview, action button)
2. Market info card (status, volume, traders, trades, closes)

**Interactions:**
- Time range pills on chart (1H, 6H, 1D, 1W, 1M, ALL) → filter chart data
- Trade panel: full interactive trading flow (see Screen 7)
- Comments: post, reply, delete (auth required for write actions)
- Related market cards → navigate to that market

**Loading state:** Chart shows `animate-pulse` skeleton. Trade panel is interactive immediately.

**Error state:** If market not found → Next.js notFound() → 404 page.

**Designer's Notes:** The two-column layout keeps the trade panel always visible on desktop — the primary CTA is never more than a glance away. On mobile, the trade panel scrolls into view after the price information, following the natural decision flow: *learn → decide → act*.

---

### Screen 4: Portfolio (Detail View)

**Layout:** Single column, max-w-6xl

**Component inventory:**
1. Page title: "Portfolio" + subtitle
2. Summary cards (3-col grid): Available Balance, Total Portfolio Value, Unrealized P/L
3. Active Positions table: Market, Side (YES/NO badge), Shares, Avg Price, Current Price, P/L
4. Recent Trades table: Date, Market, Action (BUY/SELL badge), Amount, Shares

**Interactions:**
- Market links in tables → /markets/[id]
- P/L values are color-coded (green positive, red negative)

**Empty state (guest):** Summary shows 0 pts. Tables show "No active positions" and "No trades yet" with link to browse markets.

**Designer's Notes:** The portfolio page is intentionally read-only and simple. No charts, no analytics, no "insights." Just the facts: what you own, what it's worth, what you traded. Advanced analytics can come later.

---

### Screen 5: Profile (Settings/Profile)

**Layout:** Single column, max-w-2xl (narrow)

**Component inventory:**
1. Page title: "Profile"
2. User card: Avatar (56×56, initials) + name + email + join date
3. Stats grid (3-col): Balance, Total Trades, Positions

**Interactions:**
- Currently read-only (no edit functionality)
- Guest view shows "Sign in to view your profile" with login link

**Designer's Notes:** The profile is kept intentionally minimal during early development. It's a reference page, not a social profile. No bio, no avatar upload, no achievement badges — that's feature bloat for a prediction market.

---

### Screen 6: Leaderboard (Search/Filter)

**Layout:** Single column, max-w-6xl

**Component inventory:**
1. Page title: "Leaderboard" + subtitle
2. Podium section: Top 3 users in rounded cards, #1 with ring highlight
3. Full rankings table: Rank, User (avatar + name), Balance, Trades

**Interactions:**
- Podium and table are read-only
- Avatar shows user initial in `bg-foreground text-background` circle

**Designer's Notes:** The leaderboard is simple social proof. It answers one question: "Who's the best trader?" No time filters, no category breakdowns — just the all-time ranking.

---

### Screen 7: Trade Panel (Action Completion)

**Layout:** 320px sidebar card on desktop, full-width on mobile

**Component inventory:**
1. BUY/SELL toggle (rounded-lg bg-muted pills, green/red active tint)
2. YES/NO outcome buttons (full-color when selected, ghost when not)
3. Position indicator (if user has existing shares)
4. Amount input (number, with balance/shares available label)
5. Quick amount buttons (10, 25, 50, 100 pts for buy; 25%, 50%, 75%, 100% for sell)
6. Preview card (bg-muted rounded-lg): shares, avg price, slippage, potential return
7. Action button (full-width, colored: green for YES buy, red for NO buy)

**Interactions:**
- Toggle BUY ↔ SELL → changes form between points input and shares input
- Toggle YES ↔ NO → updates prices, clears amount
- Amount input → live preview updates via `useMemo`
- Quick amounts → fills input
- Submit → server action → toast success/error → router.refresh()

**States:**
- Loading: button shows "Buying..." / "Selling..." + disabled
- Disabled: market is resolved/cancelled
- No position: sell tab shows "No shares to sell"
- Slippage warning: >5% shows red text

**Designer's Notes:** The trade panel follows a strict funnel: direction → outcome → amount → confirm. Each step reduces the decision space. The colored action button is the only high-saturation element in the entire sidebar, making it the obvious focal point.

---

### Screen 8: Login/Register (Auth)

**Layout:** Centered, max-w-sm, no sidebar

**Component inventory:**
1. Logo link (wordmark, links to landing page)
2. H1: "Sign in" / "Create an account"
3. Form fields: Email + Password (+ Name for register)
4. Submit button: `bg-foreground text-background` (full-width, black)
5. Alt link: "Don't have an account? Sign up" / "Already have an account? Sign in"
6. Back link to landing page

**Interactions:**
- Submit → server action → redirect to /markets on success
- Validation: required fields, email format
- Error: toast notification

**Designer's Notes:** Auth pages are deliberately plain. No hero images, no feature lists alongside the form, no social login buttons. Just the form. Get in, start trading.

---

## 14. Component Specifications

### 14.1 Button Hierarchy

| Level | Class | Usage |
|---|---|---|
| **Primary** | `bg-foreground text-background` | Main CTAs: "Get Started", "Create Account", "Sign In" |
| **Trade (YES)** | `bg-[var(--color-yes)] text-white` | Buy YES action button |
| **Trade (NO)** | `bg-[var(--color-no)] text-white` | Buy NO action button |
| **Secondary** | `variant="outline"` | "Browse Markets", sell actions, cancel |
| **Ghost** | `variant="ghost"` | Nav items, "Log in", dropdown triggers |
| **Quick Amount** | `variant="outline" size="sm" h-7 px-3 text-xs` | Quick fill buttons in trade panel |

### 14.2 Card Pattern

All cards follow one pattern:
```
<div className="rounded-xl border p-4 bg-card">
```
- No shadows, no elevation, no gradients
- `border` is 1px `#e5e5e5`
- Internal sections divided by `border-t` or `divide-y`
- Card headers: `px-4 py-3 border-b` with `text-sm font-medium`

### 14.3 Form Pattern

- Labels: `text-xs text-muted-foreground` above input
- Inputs: `h-9` or `h-11` (large for trade amounts), `bg-muted border-0`
- Focus: `focus-visible:ring-1 ring-foreground`
- Help text: `text-xs text-muted-foreground mt-1`
- Validation: rely on `required` + toast errors (no inline validation yet)

### 14.4 Badge Pattern

| Type | Class |
|---|---|
| **YES outcome** | `bg-[var(--color-yes)]/15 text-[var(--color-yes)]` |
| **NO outcome** | `bg-[var(--color-no)]/15 text-[var(--color-no)]` |
| **Category** | `text-[10px] font-medium uppercase tracking-wider text-muted-foreground` (text only, no background) |
| **Trade action** | `variant="outline"` (BUY YES, SELL NO) |

### 14.5 Table Pattern

```
<div className="rounded-xl border bg-card">
  <div className="px-4 py-3 border-b">
    <h3 className="text-sm font-medium">[Title]</h3>
  </div>
  <div className="p-4">
    <Table>...</Table>
  </div>
</div>
```
- Table headers: muted, small text
- Numeric columns: `text-right tabular-nums`
- Row hover: none (clean, not interactive)
- Row borders: default shadcn table styling

### 14.6 Avatar Pattern

- Size: `h-7 w-7` (top bar), `h-14 w-14` (profile), `h-8 w-8` (leaderboard), `h-6 w-6` (comments)
- Fallback: `bg-foreground text-background` with first letter of name, uppercase
- No image avatars currently (initials only)

### 14.7 Price Display Pattern

| Context | Size | Format |
|---|---|---|
| Market card | 13px, font-semibold | `72¢` (green) / `28¢` (red) |
| Market detail hero | 30px (text-3xl), font-bold | `72¢ Yes / 28¢ No` |
| Trade panel buttons | 14px, font-semibold | `Yes 72¢` / `No 28¢` |
| Trade preview | 14px, font-medium | `72¢` |
| Table cells | 14px, tabular-nums | `72¢` |
| Chart tooltip | 14px | `72¢` |

---

## 15. Accessibility

### 15.1 Color Contrast

All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text):
- Primary text (#0a0a0a on #fff): 19.5:1 — exceeds AAA
- Secondary text (#737373 on #fff): 4.8:1 — meets AA
- YES green (#16a34a on #fff): 3.5:1 — meets AA for large/bold text
- NO red (#dc2626 on #fff): 4.6:1 — meets AA

### 15.2 Font Scaling

- All sizes use relative units (Tailwind's rem-based scale)
- Layouts use flexbox and grid — content reflows at larger sizes
- No fixed-height containers that clip text

### 15.3 Keyboard Navigation

- All interactive elements receive focus via native tab order
- Focus rings: `outline-ring/50` on all focusable elements
- Dropdown menus support arrow key navigation (Radix UI)
- Sheet/modal can be dismissed with Escape

### 15.4 Screen Reader Support

- All images have alt text
- Icon-only buttons include `sr-only` labels
- Sheet has `SheetTitle` with `sr-only` class
- Form inputs have associated `Label` elements
- Tables use semantic `<Table>`, `<TableHeader>`, `<TableBody>` elements

### 15.5 Reduced Motion

- All transitions use Tailwind's `transition-colors` (color only, not layout)
- Chart animations can be disabled (Recharts `isAnimationActive={false}`)
- No auto-playing animations or carousels

---

## 16. Micro-Interactions

### 16.1 Transitions

| Element | Property | Duration | Easing |
|---|---|---|---|
| Button hover | background-color | 150ms | ease |
| Nav active state | background-color, color | 150ms | ease |
| Card hover | background-color | 150ms | ease |
| Sheet open/close | transform (translateX) | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Dropdown open | opacity, scale | 200ms | ease-out |
| Toast appear | translateY, opacity | 300ms | spring |
| Chart tooltip | opacity | 100ms | ease |

### 16.2 Feedback

| Action | Feedback |
|---|---|
| Buy shares | Green toast: "Bought 12.50 YES shares" |
| Sell shares | Green toast: "Sold 5.00 YES shares for 3.20 pts" |
| Error | Red toast with error message |
| Search submit | URL updates, page re-renders with results |
| Quick amount click | Input value updates immediately |

---

## 17. Responsive Behavior

### 17.1 Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| **Mobile** | <640px | Single column, hamburger nav, no sidebar, no balance pill |
| **Tablet** | 640–1023px | Single column with wider content, hamburger nav |
| **Desktop** | ≥1024px (lg) | Two-column with persistent 220px sidebar |

### 17.2 Key Responsive Changes

| Element | Mobile | Desktop |
|---|---|---|
| Sidebar | Sheet overlay (hamburger) | Persistent 220px column |
| Top bar | Search + hamburger | Search + balance + avatar |
| Market detail | Single column, trade panel in flow | 2-column (content + 320px sidebar) |
| Summary stats | 1-column stack | 3-column grid |
| Tables | Horizontal scroll | Full width |
| Landing hero | text-4xl, tighter spacing | text-5xl, generous spacing |

### 17.3 Content Width

- Max content: `max-w-6xl` (1152px) with `px-4 sm:px-6` padding
- Landing page: `max-w-5xl` (1024px)
- Auth pages: `max-w-sm` (384px)
- Profile: `max-w-2xl` (672px)

---

## 18. Spacing System

Based on Tailwind's 4px grid:

| Token | Value | Usage |
|---|---|---|
| `gap-0.5` | 2px | Between toggle pills |
| `gap-1.5` | 6px | Between quick amount buttons, between YES/NO card buttons |
| `gap-2` | 8px | Between icon and label in nav |
| `gap-3` | 12px | Between card items (thumbnail → content → buttons) |
| `gap-4` | 16px | Card internal padding, grid gaps |
| `gap-6` | 24px | Between sections on a page |
| `gap-8` | 32px | Between major page sections (landing page) |
| `py-3.5` | 14px | Market card row padding |
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Large card padding (profile, auth) |

---

## 19. Border Radius System

| Token | Value | Usage |
|---|---|---|
| `rounded-md` | 6px | Toggle pills, small buttons |
| `rounded-lg` | 8px | Nav items, YES/NO buttons, trade action buttons, input fields, thumbnails |
| `rounded-xl` | 12px | Cards, containers, images, chart wrapper |
| `rounded-full` | 9999px | Avatar, balance pill, sort tab pills |

**Rule:** `rounded-xl` for containers. `rounded-lg` for interactive elements inside containers. `rounded-full` for circular/pill elements.

---

# PART FOUR: BRAND APPLICATIONS

## 20. Digital Applications

### 20.1 Social Media Profiles

**Avatar:** Icon-only variant (`icon-1.svg`) on white background, cropped to circle
**Cover Images:** Clean white/light gray background with wordmark centered. No photography.

| Platform | Avatar | Cover Size |
|---|---|---|
| Twitter/X | icon-1.svg, 400×400 | 1500×500, wordmark centered |
| Discord | icon-1.svg, 512×512 | Banner: wordmark + tagline |
| GitHub | icon-1.svg, 300×300 | — |
| LinkedIn | icon-1.svg, 300×300 | 1128×191, wordmark left-aligned |

### 20.2 Open Graph / Link Preview

- **Title:** "Viking Market"
- **Description:** "Trade on what happens next."
- **Image:** 1200×630, white background, wordmark centered, tagline below
- **Theme color:** `#0a0a0a`

### 20.3 Email Signature

```
[Name]
Viking Market
[email] · prediction-vert.vercel.app
```
No logo in email signature. Text-only. Matches the minimal brand voice.

### 20.4 Presentation Template

| Slide | Layout |
|---|---|
| **Title** | Wordmark top-left, large title centered, tagline below |
| **Content** | Title top-left, body text left column, optional data right |
| **Data** | Title top-left, full-width chart/table |
| **Closing** | Wordmark centered, URL below |

Colors: Black text on white. Green/red only for trading data. No decorative elements.

---

# PART FIVE: DESIGN TOKENS (JSON)

```json
{
  "viking-market": {
    "color": {
      "primary": {
        "ink": { "value": "#0a0a0a", "description": "Primary text, buttons, active states" },
        "paper": { "value": "#ffffff", "description": "Page and card backgrounds" }
      },
      "secondary": {
        "stone": { "value": "#f5f5f5", "description": "Muted surfaces, input backgrounds" },
        "ash": { "value": "#737373", "description": "Secondary text, labels" },
        "wire": { "value": "#e5e5e5", "description": "Borders, dividers" }
      },
      "semantic": {
        "yes": { "value": "#16a34a", "description": "YES outcomes, profit, positive" },
        "no": { "value": "#dc2626", "description": "NO outcomes, loss, negative" }
      },
      "brand": {
        "primary": { "value": "#1a1a1a", "description": "Logo lockup only" }
      }
    },
    "typography": {
      "fontFamily": {
        "sans": { "value": "Geist Sans, system-ui, sans-serif" },
        "mono": { "value": "Geist Mono, monospace" }
      },
      "fontSize": {
        "micro": { "value": "0.625rem", "lineHeight": "1rem" },
        "caption": { "value": "0.75rem", "lineHeight": "1rem" },
        "body-sm": { "value": "0.8125rem", "lineHeight": "1.25rem" },
        "body": { "value": "0.875rem", "lineHeight": "1.25rem" },
        "heading-sm": { "value": "0.875rem", "lineHeight": "1.25rem" },
        "heading": { "value": "1.25rem", "lineHeight": "1.75rem" },
        "display-sm": { "value": "1.5rem", "lineHeight": "2rem" },
        "display": { "value": "2.25rem", "lineHeight": "2.5rem" },
        "display-lg": { "value": "3rem", "lineHeight": "1.1" }
      },
      "fontWeight": {
        "regular": { "value": "400" },
        "medium": { "value": "500" },
        "semibold": { "value": "600" },
        "bold": { "value": "700" }
      }
    },
    "spacing": {
      "0.5": { "value": "2px" },
      "1": { "value": "4px" },
      "1.5": { "value": "6px" },
      "2": { "value": "8px" },
      "3": { "value": "12px" },
      "3.5": { "value": "14px" },
      "4": { "value": "16px" },
      "5": { "value": "20px" },
      "6": { "value": "24px" },
      "8": { "value": "32px" },
      "10": { "value": "40px" },
      "12": { "value": "48px" },
      "16": { "value": "64px" }
    },
    "borderRadius": {
      "md": { "value": "6px" },
      "lg": { "value": "8px" },
      "xl": { "value": "12px" },
      "full": { "value": "9999px" }
    },
    "shadow": {
      "none": { "value": "none", "description": "No shadows used in the design system" }
    },
    "transition": {
      "fast": { "value": "150ms ease" },
      "normal": { "value": "200ms ease-out" },
      "sheet": { "value": "300ms cubic-bezier(0.16, 1, 0.3, 1)" }
    },
    "layout": {
      "sidebar": { "value": "220px" },
      "tradeSidebar": { "value": "320px" },
      "maxContent": { "value": "1152px" },
      "maxLanding": { "value": "1024px" },
      "maxAuth": { "value": "384px" },
      "maxProfile": { "value": "672px" },
      "topBar": { "value": "56px" }
    }
  }
}
```

---

# PART SIX: DO'S AND DON'TS

## Do's

1. **DO** use black (#0a0a0a) for all primary actions and active states
2. **DO** reserve green/red exclusively for trading outcomes (YES/NO, P&L)
3. **DO** display all prices as cents with ¢ suffix (72¢, not 72% or 0.72)
4. **DO** use `tabular-nums` on every numeric value in the UI
5. **DO** keep card styling as `rounded-xl border p-4 bg-card` — no shadows
6. **DO** use sentence case for all UI text
7. **DO** include units on all numbers (pts, shares, ¢, vol)
8. **DO** let data speak — show live market data instead of marketing copy
9. **DO** maintain the grayscale chrome so trading colors have maximum contrast
10. **DO** test every text element at WCAG AA contrast ratios
11. **DO** use the wordmark logo on white backgrounds, icon for small contexts
12. **DO** keep the voice matter-of-fact and concise

## Don'ts

1. **DON'T** add shadows, gradients, or background colors to cards or containers
2. **DON'T** use colored backgrounds for navigation or brand elements
3. **DON'T** use exclamation marks, emoji, or hype language in the UI
4. **DON'T** display probabilities as percentages — always use cent pricing
5. **DON'T** add decorative icons that don't serve an information purpose
6. **DON'T** use Title Case for headings — use sentence case
7. **DON'T** make interactive elements without clear hover/focus states
8. **DON'T** use more than the defined grayscale + green/red color palette
9. **DON'T** hide critical information behind modals or toggles
10. **DON'T** add illustrations, mascots, or decorative imagery
11. **DON'T** use the logo in any color other than black or white
12. **DON'T** change border-radius tokens — consistency is non-negotiable

---

# PART SEVEN: IMPLEMENTATION GUIDE

## For Developers

### Adding a New Page

```tsx
// Follow this template for any new page
export default async function NewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Page Title</h1>
        <p className="text-sm text-muted-foreground mt-1">Subtitle describing the page</p>
      </div>

      {/* Content sections */}
      <div className="rounded-xl border p-4 bg-card">
        {/* Section content */}
      </div>
    </div>
  );
}
```

### Adding a New Component

1. Use existing shadcn/ui primitives where possible
2. Wrap in `rounded-xl border p-4 bg-card` for container components
3. Use `cn()` for conditional classes
4. Follow the color rules: grayscale chrome, green/red only for trading
5. Add `tabular-nums` to any numeric display

### Color Usage Decision Tree

```
Is it a trading outcome (YES/NO/P&L)?
  → YES: Use --color-yes (green) or --color-no (red)
  → NO: Is it primary text or an active state?
    → YES: Use foreground (#0a0a0a)
    → NO: Is it secondary/supporting text?
      → YES: Use muted-foreground (#737373)
      → NO: Is it a surface/background?
        → YES: Use muted (#f5f5f5) or background (#ffffff)
        → NO: Is it a border or divider?
          → YES: Use border (#e5e5e5)
```

### File Structure

```
src/
  app/
    globals.css           ← Design tokens (CSS custom properties)
    layout.tsx            ← Root layout (fonts, providers)
    page.tsx              ← Landing page
    (auth)/               ← Login, register (no sidebar)
    (main)/               ← All authenticated pages (with sidebar)
    (admin)/              ← Admin pages (with sidebar + admin layout)
  components/
    brand/                ← Logo components
    charts/               ← Price chart
    layout/               ← Sidebar, TopBar, MobileSidebar, Navbar
    markets/              ← MarketCard, CategoryBadge, CommentsSection, etc.
    trading/              ← TradePanel
    ui/                   ← shadcn/ui primitives
    providers/            ← SessionProvider, ThemeProvider
```

---

*This document is the single source of truth for Viking Market's brand identity and UI/UX patterns. Every design decision should reference this document. When in doubt, choose the simpler, more neutral option.*
