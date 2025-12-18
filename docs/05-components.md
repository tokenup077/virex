# Components

All components include JSDoc documentation with usage examples. Check the source files for detailed prop documentation.

## Icon System

The theme uses [astro-icon](https://github.com/natemoo-re/astro-icon) with [Iconify](https://iconify.design/) for icons. This provides access to 200,000+ icons from 100+ icon sets.

### Installed Icon Sets

- **Lucide** (`lucide:*`) - Clean, consistent icons for UI (primary)
- **Simple Icons** (`simple-icons:*`) - Brand logos (Discord, etc.)

### Usage

```astro
---
import { Icon } from 'astro-icon/components';
---

<!-- Basic usage -->
<Icon name="lucide:zap" />

<!-- With custom size -->
<Icon name="lucide:github" class="w-8 h-8" />

<!-- With custom styling -->
<Icon name="lucide:shield" class="w-6 h-6 text-primary" />

<!-- Brand icons -->
<Icon name="simple-icons:discord" class="w-5 h-5" />
```

### Common Icons Used

| Icon | Name | Usage |
|------|------|-------|
| Zap| `lucide:zap` | Features, speed |
| Shield | `lucide:shield` | Security |
| Globe | `lucide:globe` | Global, web |
| Chart | `lucide:bar-chart` | Analytics |
| Users | `lucide:users` | Team, users |
| Mail | `lucide:mail` | Email |
| Check | `lucide:check` | Checkmarks |
| Sun | `lucide:sun` | Light mode |
| Moon | `lucide:moon` | Dark mode |

### Adding More Icon Sets

Install additional Iconify icon packs:

```bash
# Heroicons
npm install @iconify-json/heroicons

# Tabler Icons
npm install @iconify-json/tabler

# Material Design Icons
npm install @iconify-json/mdi
```

Then use them with their prefix:

```astro
<Icon name="heroicons:home" />
<Icon name="tabler:settings" />
<Icon name="mdi:account" />
```

### Browse Icons

- [Lucide Icons](https://lucide.dev/icons/) - Browse all Lucide icons
- [Iconify](https://icon-sets.iconify.design/) - Search all available icon sets

## Contact Form

Located at `src/components/forms/ContactForm.astro`. Includes client-side validation, loading states, and multiple backend support.

### Demo Mode (Default)

```astro
<ContactForm />
```

Simulates success without submitting. Good for development.

### Netlify Forms

```astro
<ContactForm netlify formName="contact" />
```

No additional setup needed when deploying to Netlify.

### Formspree

```astro
<ContactForm action="https://formspree.io/f/YOUR_FORM_ID" method="POST" />
```

Get your form ID at [formspree.io](https://formspree.io/).

### Custom API Endpoint

```astro
<ContactForm action="https://api.yoursite.com/contact" method="POST" />
```

Your endpoint should accept `FormData` with fields: `firstName`, `lastName`, `email`, `subject`, `message`.

### Form Fields

The form submits these fields:
- `firstName` (required, min 2 chars)
- `lastName` (required, min 2 chars)
- `email` (required, valid email)
- `subject` (required, select dropdown)
- `message` (required, min 10 chars)

### Validation

- Real-time validation on blur and input
- Honeypot field for spam protection
- Loading state during submission
- Success/error feedback messages

## Layout Components

### Navbar

`src/components/layout/Navbar.astro`

- Responsive with mobile menu
- Respects feature flags (hides disabled sections)
- Includes theme toggle button
- Shows/hides based on scroll direction (optional)

### Footer

`src/components/layout/Footer.astro`

- Navigation links (respects feature flags)
- Social media links
- Copyright notice

### AnnouncementBar

`src/components/layout/AnnouncementBar.astro`

- Dismissible with localStorage persistence
- Three variants: `primary`, `secondary`, `gradient`
- Optional link

## Section Components

### Hero

```astro
<Hero
  title="Main headline"
  subtitle="Supporting text"
  primaryCTA={{ label: "Get Started", href: "/pricing" }}
  secondaryCTA={{ label: "Learn More", href: "/docs" }}
/>
```

### FeatureGrid

```astro
<FeatureGrid features={[
  { icon: "lucide:zap", title: "Fast", description: "Lightning quick" },
  { icon: "lucide:shield", title: "Secure", description: "Enterprise ready" },
]} />
```

### PricingTable

Displays pricing plans with feature lists and CTA buttons.

### CTA

```astro
<CTA
  title="Ready to start?"
  description="Get started today."
  action={{ label: "Sign Up", href: "/pricing" }}
/>
```

### LogoCloud

`src/components/sections/LogoCloud.astro`

Displays client/partner logos to build trust and credibility. Supports multiple display variants.

```astro
---
import LogoCloud from '../components/sections/LogoCloud.astro';

const logos = [
  { name: "Acme Inc", src: "/images/logos/logoipsum-1.svg" },
  { name: "Globex", src: "/images/logos/logoipsum-2.svg", href: "https://example.com" },
  // ... more logos
];
---

<!-- Default variant (static row) -->
<LogoCloud
  title="Trusted by innovative teams"
  logos={logos}
/>

<!-- Marquee variant (animated scroll) -->
<LogoCloud
  logos={logos}
  variant="marquee"
  speed="slow"
  pauseOnHover={true}
/>

<!-- Grid variant -->
<LogoCloud
  title="Our partners"
  logos={logos}
  variant="grid"
  columns={4}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Optional section title |
| `logos` | `Logo[]` | Required | Array of logo objects |
| `variant` | `'default' \| 'marquee' \| 'grid'` | `'default'` | Display variant |
| `columns` | `2 \| 3 \| 4 \| 5 \| 6` | `4` | Columns for grid variant |
| `speed` | `'slow' \| 'normal' \| 'fast'` | `'normal'` | Marquee animation speed |
| `pauseOnHover` | `boolean` | `true` | Pause marquee on hover |
| `logoSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Logo size |
| `grayscale` | `boolean` | `true` | Grayscale logos (colored on hover) |

**Logo Object:**

```typescript
interface Logo {
  name: string;    // Company name (used for alt text)
  src: string;     // Path to logo image
  href?: string;   // Optional link URL
}
```

**Placeholder logos** are provided in `public/images/logos/`. Replace them with your actual client logos.

### Newsletter

`src/components/sections/Newsletter.astro`

Standalone newsletter subscription component. Can be placed anywhere on the site.

```astro
---
import Newsletter from '../components/sections/Newsletter.astro';
---

<!-- Default (uses config values) -->
<Newsletter />

<!-- Custom content -->
<Newsletter
  title="Join our community"
  description="Get weekly tips and updates."
  buttonText="Join Now"
/>

<!-- With custom action endpoint -->
<Newsletter action="https://api.example.com/subscribe" />

<!-- Compact variant -->
<Newsletter variant="compact" />

<!-- Card variant with primary background -->
<Newsletter variant="card" background="primary" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Config value | Section title |
| `description` | `string` | Config value | Section description |
| `placeholder` | `string` | Config value | Input placeholder |
| `buttonText` | `string` | Config value | Submit button text |
| `successMessage` | `string` | Config value | Success message |
| `errorMessage` | `string` | Config value | Error message |
| `privacyNote` | `string` | Config value | Privacy note text |
| `action` | `string` | `''` | Form action URL (empty for demo mode) |
| `variant` | `'default' \| 'compact' \| 'card'` | `'default'` | Visual variant |
| `background` | `'surface' \| 'transparent' \| 'primary'` | `'surface'` | Background style |

**Integration Examples:**

```astro
<!-- Mailchimp -->
<Newsletter action="https://YOUR_DOMAIN.us1.list-manage.com/subscribe/post?u=XXX&id=YYY" />

<!-- ConvertKit -->
<Newsletter action="https://app.convertkit.com/forms/FORM_ID/subscriptions" />

<!-- Custom API -->
<Newsletter action="/api/newsletter" />
```

By default, the Newsletter only appears on the homepage. Add it to any page by importing the component.

## Common Components

### SEO

`src/components/common/SEO.astro`

Handles meta tags, Open Graph, Twitter Cards, and JSON-LD. Used in layouts.

```astro
<SEO
  title="Page Title"
  description="Page description"
  image="/images/custom-og.png"
  type="article"
/>
```

### OptimizedImage

`src/components/common/OptimizedImage.astro`

Smart image optimization wrapper for local and remote images.

## UI Components

### ThemeToggle

`src/components/ui/buttons/ThemeToggle.astro`

Light/dark mode toggle with localStorage persistence.

### TestimonialCard

`src/components/ui/cards/TestimonialCard.astro`

Displays customer testimonials with avatar, quote, and attribution.

### Pagination

`src/components/ui/navigation/Pagination.astro`

Page navigation for blog listings.

```astro
<Pagination
  currentPage={1}
  totalPages={5}
  basePath="/blog"
/>
```

## Utility Functions

The theme includes helper functions in `src/lib/`:

### Reading Time

```typescript
import { calculateReadingTime } from '@/lib/utils';

const minutes = calculateReadingTime(post.body);
// Returns: 5 (minutes, based on 200 words/min)
```

### Date Formatting

```typescript
import { formatDate } from '@/lib/utils';

formatDate(new Date());
// Returns: "Jan 15, 2025"

formatDate(new Date(), { dateStyle: 'long' });
// Returns: "January 15, 2025"

formatDate(new Date(), { dateStyle: 'full' });
// Returns: "Wednesday, January 15, 2025"
```

### Form Validation

```typescript
import { required, minLength, email, selected } from '@/lib/validation';

const validators = {
  name: required('Name'),           // "Name is required"
  message: minLength(10, 'Message'), // "Message must be at least 10 characters"
  email: email(),                   // "Please enter a valid email address"
  subject: selected('Subject'),     // "Please select a Subject"
};
```
