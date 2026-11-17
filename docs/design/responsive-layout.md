# Large-screen responsive layout

The frontend scales by **CSS viewport width**, not by a monitor's diagonal measurement: inches do not determine the browser's CSS-pixel viewport, and OS/browser display scaling varies. The layout is designed to stay proportionate from a typical 20-inch desktop through 4K / large-TV canvases, without a fixed-width page strip.

## Canvas targets

| CSS viewport width | Root size | Content column (`90vw`) | Intended use |
| ---: | ---: | ---: | --- |
| 1440px | 16px | 1280px max | Reference desktop; existing layout preserved |
| 1920px | 18px | 1728px | Full HD / 20–24-inch desktop |
| 2560px | 20.7px | 2304px | QHD / large monitor |
| 3440px | 24.3px | 3096px | Ultrawide |
| 3840px | 26px | 3456px | 4K / large TV |
| 5120px | 26px (cap) | 4608px | 5K ultrawide |

The root `rem` scale grows gradually above the 1440px reference canvas and caps at 26px. Existing rem-based type, spacing, page-local editorial styles, and component dimensions therefore grow together. The content column switches to 90% of the viewport at 1536px and stays fluid above that; reading prose remains bounded to its character measure. The shared rope carousel reads the computed root scale when sizing its cards.

## Responsive verification matrix

Use the following CSS viewport widths when checking pages with browser developer tools or a real display:

- **1440px:** reference baseline; no layout or type changes from the established desktop design.
- **1920px:** root 18px; expanded content area; four-column card grids where their `3xl` breakpoint applies.
- **2560px:** root about 20.7px; fluid content width; no copy column stranded at its laptop maximum.
- **3440px:** root about 24.3px; ultrawide spacing and typography remain proportional.
- **3840px:** root 26px cap; content remains at 90vw; 65-character prose measure is preserved.
- **5120px:** root remains capped at 26px; container stays centered and bounded rather than stretching without limit.

Also check intermediate widths and both shorter and taller aspect ratios: breakpoints respond to viewport width, while hero heights continue to use viewport height. For a physical monitor check, use its actual browser viewport size; a 100-inch TV running scaled desktop output may expose fewer than 3840 CSS pixels.
