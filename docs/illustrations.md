# Illustrations (Storyset)

The site uses three decorative illustrations from [Storyset](https://storyset.com).
They are optional: until a file exists, its slot renders nothing.

| Slot (file name) | Used on                       | Suggested Storyset search             | Notes                  |
| ---------------- | ----------------------------- | ------------------------------------- | ---------------------- |
| `hero.svg`       | Home, beside the main heading | “Visual data” or “Data report”        | Wide, calm composition |
| `problem.svg`    | Home, “The problem”           | “Server” or “Bug fixing”              | Something going wrong  |
| `approach.svg`   | Home, “How this lab helps”    | “Research paper” or “Data extraction” | Methodical, structured |

Use **one style for all three** so they read as a set. Recommended picks (all _Pana_ style):

- `hero.svg` → https://storyset.com/illustration/visual-data/pana
- `problem.svg` → https://storyset.com/illustration/500-internal-server-error/pana
- `approach.svg` → https://storyset.com/illustration/process/pana

Choose **Hidden** background when downloading, so the illustration sits on the page colour.

## Adding one

1. Open the illustration on storyset.com and choose the style.
2. Set the colour to **`#00BAFF`** exactly. The build swaps that colour for the
   theme's accent (`--illustration-accent`), so the illustration matches both the
   light and dark themes.
3. Download as **SVG** and save it as `src/assets/illustrations/<slot>.svg`.
4. `npm run build`. The image appears, sized by CSS, marked decorative
   (`aria-hidden`), and the footer adds the required “Illustrations by Storyset”
   link in every language.

## Licence

Storyset’s free licence requires attribution. The footer credit appears
automatically whenever at least one illustration is present. If you buy a premium
licence that waives attribution, remove the credit in `BaseLayout.astro`.
