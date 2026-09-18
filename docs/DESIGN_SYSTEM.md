# Design System

## Choice

Use **Nuxt UI v4** as the default component and design-system foundation for the Nuxt frontend.

Reasons:

- first-class Nuxt integration
- large production-ready component set
- accessible primitives through Reka UI
- Tailwind CSS based theming and semantic tokens
- dark/light mode support
- strong TypeScript support
- built-in integration with Nuxt Icon / Iconify
- suitable for reusable product templates without forcing Material Design
- free and open source

Do not add another general-purpose component library (Vuetify, PrimeVue, shadcn-vue, etc.) without an explicit architectural reason. Avoid mixing competing design systems.

## Principle

The template provides a consistent design foundation, not a fixed product brand.

A product created from this template should be able to change its brand colors, typography, radius, and selected visual details without rewriting components.

Use semantic design tokens instead of hard-coded product colors throughout feature code.

Examples:

- primary
- secondary
- success
- warning
- error
- info
- neutral
- default/elevated/accented backgrounds
- default/muted/dimmed/highlighted text

Prefer theme configuration in the central Nuxt UI/Tailwind theme rather than per-component arbitrary values.

## Component strategy

Use Nuxt UI components directly for generic primitives such as:

- buttons
- inputs
- selects
- checkboxes
- dialogs/modals
- drawers/slideover
- cards
- tables
- dropdowns
- tooltips
- tabs
- badges
- alerts
- navigation primitives
- pagination
- form fields

Do **not** wrap every Nuxt UI component in an application-specific wrapper. Unnecessary wrappers create another API to maintain and make agents more likely to duplicate behavior.

Create a shared application component only when it adds genuine product semantics or repeated behavior.

Good examples:

- `AppPageHeader.vue`
- `AppEmptyState.vue`
- `AppConfirmDialog.vue`
- `AppUserAvatar.vue`

Feature-specific components stay inside their feature slice.

Examples:

- `GigCard.vue`
- `ApplyToGigForm.vue`
- `ApplicationStatus.vue`

Do not promote a component to `shared/components` simply because two files use it. Promote it when it is genuinely generic across unrelated feature slices.

## Styling

Use Nuxt UI semantic tokens and Tailwind utility classes.

Avoid:

- scattered hard-coded hex colors
- large feature-specific global CSS files
- arbitrary z-index values
- physical directional classes when logical direction is required
- component-level theme overrides repeated across the application

Prefer central tokens for:

- colors
- typography
- spacing conventions
- border radius
- shadows
- container width
- focus treatment

Product-specific branding should mainly be applied through the central theme configuration.

## RTL and Arabic

English and Arabic are first-class languages.

All reusable UI must work in both LTR and RTL.

Rules:

- set document `lang` and `dir` from the active locale
- prefer logical CSS concepts (`start`, `end`, inline/block direction) over hard-coded `left` and `right`
- verify directional icons such as arrows and chevrons in RTL
- verify dialogs, dropdowns, tables, pagination, breadcrumbs, navigation, and form layouts in Arabic
- avoid manually mirroring components unless the underlying library cannot handle direction correctly
- include Arabic text in relevant component/E2E tests where direction or layout matters

Typography must support Arabic correctly. Configure fonts centrally through Nuxt's font tooling. Do not choose an English-only font for the primary UI stack.

## Forms

Use the form primitives and validation integration supported by Nuxt UI.

Keep these concerns separate:

- transport/request validation on the backend remains authoritative
- frontend form validation gives immediate UX feedback
- business/security rules remain authoritative on the backend

Do not reproduce complex backend business rules in form components.

## Icons

Use Nuxt Icon / Iconify through Nuxt UI unless a concrete feature requires a different asset.

Prefer one coherent icon family for normal application UI rather than mixing visual styles across screens.

Directional icons must be verified under RTL.

## Responsive design

Default to mobile-first responsive layouts because products built from this template may be PWAs.

Every feature should be usable on narrow mobile screens unless the requirements explicitly state otherwise.

Avoid fixed widths that make common flows unusable on mobile. Use the central container and breakpoint system.

## Accessibility

Nuxt UI provides accessible primitives, but application-level accessibility is still required.

Agents must consider:

- semantic HTML
- keyboard navigation
- visible focus states
- form labels and descriptions
- accessible names for icon-only controls
- contrast
- error announcements
- dialog focus behavior
- loading/disabled states

Do not replace accessible library primitives with custom implementations merely for visual convenience.

## Loading, empty, error, and disabled states

Feature UI must deliberately handle meaningful states rather than implementing only the happy path.

Consider:

- initial loading
- background refresh
- empty result
- validation error
- server error
- offline/degraded network
- disabled/unauthorized action
- optimistic/pending mutation

Use shared patterns when the state is generic, but keep feature-specific wording and behavior in the feature slice.

## Dark mode

The template should support system/light/dark color mode through the design system.

Feature components should use semantic tokens so they work in all modes without feature-specific dark-mode patches whenever possible.

A product may decide to expose or hide the color-mode selector, but components should remain compatible.

## Design consistency for agents

Before building a new UI component:

1. Check whether Nuxt UI already provides the primitive.
2. Check `shared/components` for an existing application-level pattern.
3. Check neighboring feature slices for the established visual convention.
4. Only create a new primitive when the existing design system cannot express the requirement cleanly.

Do not invent new button styles, colors, spacing scales, modal patterns, cards, input styles, or status colors independently inside a feature slice.

## Per-product customization

Projects created from this template should customize branding centrally, primarily through:

- `app/app.config.ts`
- the main Tailwind/Nuxt UI stylesheet
- locale/font configuration
- application metadata/icons/manifest

Feature slices should rarely need changes when a product changes its brand theme.