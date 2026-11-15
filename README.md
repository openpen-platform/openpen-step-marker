# @openpen/step-marker

A numbered step marker tool for [OpenPen](https://github.com/openpen-platform/openpen).

Click to drop sequentially numbered circular markers (1, 2, 3, ...) for
step-by-step annotations such as walkthroughs and tutorials.

<p align="center">
  <img src=".github/readme-demo.gif" alt="OpenPen Step Marker: clicking places numbered markers 1 and 2 on a settings page, a misplaced 3 is undone and placed again, and the number stays 3" width="800" />
</p>

<p align="center"><sub>Background adapted from the Tabler admin template (https://github.com/tabler/tabler), MIT License (https://opensource.org/license/mit). Changes: text replaced, demo navigation hidden; names and data are fictional.</sub></p>

## Install

Requires OpenPen 1.0.0 or later.

Install from the plugin catalog, then restart OpenPen:

```bash
npx openpen-cli plugin install @openpen/step-marker
```

To install a build from source instead, build the plugin, then add the
directory to OpenPen and restart it:

```bash
npm install
npm run build
npx openpen-cli plugin add .
```

## Usage

1. Click the **Step Marker** button in the control bar's tools group to switch
   to the step marker tool.
2. Click where a marker should go. A circle with the next number is placed
   centered on the point where you pressed.

Numbering starts at 1 on an empty canvas and follows the number of step markers
already on the canvas. Undoing the last marker makes the next click reuse its
number.

Each marker keeps the size and colors that were active when it was placed, so
changing the settings later does not alter markers that are already on the
canvas. Deleting a marker from the middle of a sequence leaves a gap in the
numbers already placed, and the next click takes the count-based number rather
than filling the gap.

## Settings

Open OpenPen's settings and choose the **Step Marker** panel.

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| **Size** | 16 to 64 | 32 | Diameter of the marker in pixels |
| **Fill color** | any color | `#e05020` | Color of the circle |
| **Text color** | any color | `#ffffff` | Color of the number |

## License

MIT
