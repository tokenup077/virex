/**
 * Navigation Configuration
 *
 * @description
 * Centralized navigation configuration for header and footer.
 * All navigation items are defined here for consistency and easy maintenance.
 *
 * Items with a `feature` property will only be shown if that feature is enabled
 * in the site config's feature flags.
 */

import type { Navigation } from '../lib/types';

export const navigation: Navigation = {
  /**
   * Header Navigation
   * - main: Primary navigation links
   * - cta: Call-to-action buttons on the right
   */
  header: {
    main: [
      { label: 'サービス', href: '/service' },
      { label: '料金', href: '/price' },
      { label: 'お問い合わせ', href: '/contact' },
    ],
    cta: [],
  },

  /**
   * Footer Navigation
   * Organized into 5 columns: Product, Solutions, Resources, Company, Legal
   */
  footer: {
    product: [
      { label: 'サービス', href: '/service' },
      { label: '料金', href: '/price' },
      { label: 'FAQ', href: '/faq' },
    ],
    solutions: [],
    resources: [],
    company: [
      { label: '会社概要', href: '/about' },
      { label: 'お問い合わせ', href: '/contact' },
    ],
    legal: [
      { label: 'プライバシー', href: '/privacy' },
      { label: '利用規約', href: '/terms' },
    ],
  },
};
