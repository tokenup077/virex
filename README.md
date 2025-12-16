# Astro SaaS Landing Theme

> **Role & Goal**
> You are an expert Astro theme author and product-minded frontend engineer.
> Your task is to build a **production-ready SaaS Landing Page Theme for Astro** that is suitable to be sold as a paid theme.

This is **not** a demo or tutorial project.
This is a **market-ready theme** focused on performance, developer experience, and clarity.

***

## 🧠 Product Requirements

### Target users

* Indie hackers
* SaaS founders
* Developers building marketing sites
* Small startups

### Core goals

* Fast to install
* Easy to customize
* Clean architecture
* Content-driven (blog, docs, changelog)
* Excellent default UX without heavy customization

***

## 🧱 Tech Stack

* Astro (latest stable)
* Astro Content Collections
* TypeScript
* Tailwind CSS v4
* MDX support for blog & docs
* No React/Vue/Svelte unless strictly necessary

***

## 📁 Project Structure (MANDATORY)

```
src/
  components/
  layouts/
  pages/
  content/
  styles/
  lib/
public/
astro.config.mjs
package.json
README.md

```

***

## 📄 Required Pages

Create **fully working pages** with realistic demo content:

### Marketing

* `/` → Landing page
* `/features`
* `/pricing`
* `/about`
* `/contact`

### Trust & Product

* `/changelog`
* `/roadmap`
* `/testimonials`

### Content

* `/blog/[...slug].astro`
* `/docs/[...slug].astro`

***

## 📚 Content Collections (REQUIRED)

Define Astro content collections with schemas:

```
content/
  blog/
  docs/
  changelog/
  testimonials/

```

Each collection must:

* Have a schema using `zod`
* Use frontmatter (no JSON hacks)
* Support drafts
* Be extensible

***

## 🧩 Layouts

Create **separate layouts** (do NOT merge them):

* `BaseLayout`
* `MarketingLayout`
* `BlogLayout`
* `DocsLayout`

Rules:

* Layouts must be minimal and composable
* Navbar & Footer must be reusable
* SEO handled at layout level

***

## 🧱 Components (Minimal but Practical)

Required components:

* `Navbar`
* `Footer`
* `Hero`
* `FeatureGrid`
* `PricingTable`
* `CTA`
* `TestimonialCard`
* `SEO`
* `ThemeToggle` (light/dark)

Do NOT over-engineer components.
Prioritize clarity and flexibility.

***

## 🎨 Styling Rules

* Support **light and dark mode**
* Use design tokens (colors, spacing, radius)
* Avoid inline styles
* Avoid hard-coded brand names
* Easy to rebrand

***

## ⚙️ Configuration & DX

Create a centralized config file:

```
src/lib/site.ts

```

It must include:

* Site name
* Description
* Social links
* Feature flags (blog, docs, etc.)

Developers should be able to:

* Rebrand the site by editing ONE file
* Enable/disable sections easily

***

## 🔍 SEO & Performance (MANDATORY)

* Meta tags
* Open Graph
* Canonical URLs
* Sitemap support
* RSS feed for blog
* Optimized images

This is a **selling point**, not optional.

***

## 📝 Demo Content Guidelines

* NO lorem ipsum
* Use realistic SaaS copy
* Treat demo content as if it were a real startup
* Content should make sense end-to-end

***

## 📖 Documentation

Generate a **README.md** that includes:

* Installation
* Project structure
* Content editing guide
* Deployment tips
* Customization guide

***

## ❌ Do NOT

* Do not include framework lock-in
* Do not add unnecessary dependencies
* Do not hardcode branding
* Do not treat this as a tutorial

***

## ✅ Final Output Expectation

Deliver a **complete Astro theme project** that:

* Can be installed and deployed immediately
* Looks professional out of the box
* Feels like a real SaaS product
* Is suitable for sale on Astro Themes marketplaces

Think like a **theme seller**, not a demo builder.