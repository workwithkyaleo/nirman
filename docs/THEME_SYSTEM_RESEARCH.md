# Theme system research and implementation brief

Date: 5 September 2026  
Scope: all 10 public templates, the visual-editor canvas, and storefront pages  
Target: modern browsers, WCAG 2.2 AA-oriented defaults, English and Nepali-script content

## Executive result

SiteSajilo now uses one validated customization contract across every theme. Individual templates retain their visual identity, but explicit owner choices are applied last and therefore take precedence. The same choices now reach public business pages, store pages, and the studio preview.

The work prioritizes the largest evidence-backed problems: accessible palette creation, navigation that remains available on mobile, robust focus and target sizing, layouts that survive narrow containers and zoom, bounded typography, motion preferences, and consistent storefront styling.

## What owners can customize

| Area       | Choices                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Palette    | Primary, secondary, accent, background, and text colors with live contrast status                       |
| Typography | 9 heading/body families, including Noto Devanagari options; compact, balanced, or display heading scale |
| Shape      | 5 corner radii; square, soft, or rounded image treatment                                                |
| Layout     | Narrow, standard, or wide content; compact, comfortable, or generous spacing                            |
| Hero       | Left or centered alignment; compact, standard, or full-screen height                                    |
| Navigation | Split, centered, or minimal layout; solid, glass, or contrast surface                                   |
| Components | Flat, bordered, or elevated cards; solid, outline, pill, or soft buttons                                |
| Details    | No, subtle, or strong dividers; no, subtle, or expressive motion                                        |
| Footer     | Columns, centered, or minimal                                                                           |

Each template ships with intentional defaults for these controls. Summit Studio keeps its vertical rail only for the Minimal header choice; Split and Centered produce a top header. Its rail now contains navigation instead of becoming an unexplained empty strip.

## Research findings translated into product decisions

### Accessible authoring

W3C’s authoring-tool guidance says template systems should provide accessible template options and accessibility checking when author edits can introduce a problem. That makes accessibility a property of every theme, not a separate “accessible theme.” ([W3C ATAG 2.0, template and checking guidance](https://www.w3.org/TR/ATAG20/#gl_b24))

WCAG 2.2 requires at least 4.5:1 contrast for ordinary text, and WAI explicitly says the threshold must not be rounded. The editor therefore shows a numeric, text-labeled pass/fail result, disables saving an invalid text/background combination, and repeats the same validation on the server. AI-applied theme changes are checked against the complete resulting palette too. ([WAI: Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

Focus styling is now a two-color, theme-independent ring. Public navigation and major actions have 44px targets, exceeding WCAG 2.2’s 24px Level AA minimum and matching its enhanced target guidance. Forced-color mode receives real borders because browsers can remove shadows in that mode. ([WAI: Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), [WAI: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors))

### Navigation and reflow

The former mobile CSS hid navigation links. It now uses a keyboard-operable disclosure, labeled navigation landmarks, list semantics, consistent link order, and `aria-current="page"`. Public and store pages also have a skip-to-content link. This follows WAI menu guidance to preserve menu structure across sizes and expose the current page programmatically. ([WAI: Menu Structure](https://www.w3.org/WAI/tutorials/menus/structure/), [WAI: Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html))

WCAG reflow expects ordinary vertically scrolling content to work at a width equivalent to 320 CSS pixels without requiring two-dimensional scrolling. Fixed rails now relocate on mobile, headers can grow with text, long content can wrap, and section grids become single-column based on their allocated container—not only the viewport. ([WAI: Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries))

### Typography, language, and motion

Heading presets use bounded `clamp()` values with `rem` endpoints rather than unbounded viewport-only sizing. This improves zoom behavior while retaining fluid composition. Actual 200% zoom and text-spacing testing remains necessary; a formula by itself cannot prove conformance. ([MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp), [WAI: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [WAI: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing))

Font stacks now include deliberate system and Devanagari fallbacks, and owners can select Noto Sans/Serif Devanagari. The public document language follows the site locale after navigation, helping browsers and assistive technology apply appropriate rendering and pronunciation. The existing `font-display=swap` policy remains explicit; there is no single loading strategy that is optimal for every brand/performance tradeoff. ([web.dev: Font Best Practices](https://web.dev/articles/font-best-practices), [WAI: Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page), [W3C: Devanagari Layout Requirements](https://www.w3.org/TR/2024/DNOTE-deva-lreq-20240709/))

Owners can turn motion off, choose a restrained mode, or retain expressive template motion. The operating-system `prefers-reduced-motion` setting always wins and removes nonessential animation. ([MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion))

### Images and performance

Section images reserve a presentation ratio and use `object-fit`; below-the-fold images use lazy loading and asynchronous decoding. The main product image remains high priority. These changes reduce avoidable work and geometry shifts without pretending that one crop suits every image. ([web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls), [web.dev: Responsive Images](https://web.dev/learn/design/responsive-images))

## Boundaries and recommended next milestone

This implementation does not claim complete WCAG conformance. Automated palette checking cannot determine contrast over every point of an arbitrary photograph, and conformance still needs rendered testing with browser zoom, custom text spacing, keyboard navigation, forced colors, screen readers, and real owner content.

The next valuable milestone is an image-variant pipeline that stores source dimensions and focal points, generates multiple widths, and emits accurate `width`, `height`, `srcset`, and `sizes`. Those values were not fabricated here because the current media schema does not contain the required data.

Dark/system color-scheme variants should be a separate product decision: they require paired palettes, clear saved-versus-system precedence, and validation of every effective color pair—not a CSS switch applied to arbitrary existing brand colors.

## Verification and research stop point

The implementation is covered by the Laravel test suite, focused contrast/theme tests, PHP formatting, TypeScript compilation, and the Vite production build. Browser visual and assistive-technology QA is not claimed because no Playwright journey is configured for these public pages.

Research used primary W3C/WAI standards and explanations, CSS specifications, MDN, and web.dev. It stopped once each consequential implementation decision had first-party support, the fluid-type and font-loading tradeoffs were bounded, and remaining gaps required application-specific rendered testing or a future media schema rather than more literature search.
