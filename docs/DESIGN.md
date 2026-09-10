# Design system implementation

The supplied CoCounsel-inspired `tokens.css` is imported directly in `app/globals.css`. Navy #011B34, orange #D64000, pale blue #E3F1FD, cream #F8EADD, white surfaces, 4/8px rounding and the extracted spacing scale are the foundation. The marketing page is a visual reference, not a template for a research interface.

Clario was not bundled with a font licence. Self-hosted Source Sans 3 (SIL Open Font License, via Fontsource) is the deliberate heading/control substitution at weight 500, and the body face at 400. No Thomson Reuters logos, proprietary font files, imagery or marketing copy are imported.

Application extensions: a fixed navy research navigation, flat bordered working panels, readable tables, focused evidence drawer, category grouping, functional graph cards, a geographic map with approximate markers, and blue/cream evidence-context notices. Status combines text and color; inference uses dashed graph lines. Responsive application body and form text remain readable. Focus uses the supplied blue outline; reduced-motion disables transitions. The 900px graph can scroll horizontally on small screens, while the page itself must not overflow.

Installed Base UI/Shadcn primitives supply sidebar, tabs, selectors, sheet, tables and skeletons. The graph is application-owned functional SVG/HTML geometry. Lint keeps correctness, hooks and accessibility checks. React Compiler-specific rules are disabled because this Vite build does not use React Compiler; SVG controls use explicit keyboard roles where native HTML controls do not apply.

Browser evidence is kept in `docs/screenshots/`. Automated acceptance tests exercise evidence, factory selection, shared-component pivots, filtering, comparison, disruption, URL reload, admin lock, keyboard interaction, responsive overflow and axe WCAG checks. Self-review is distinct from independent review.
