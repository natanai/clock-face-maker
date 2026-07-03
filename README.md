# Classroom Clock Card Maker

A static, teacher-friendly GitHub Pages website for creating printable analog clock/time labels for preschool and classroom visual schedules.

The app runs entirely in the browser with plain HTML, CSS, and JavaScript. There is no build step, no framework, and no external dependency. It also works by opening `index.html` directly from your computer.

## What it does

- Turns schedule lines into printable clock cards.
- Supports time-only entries such as `7:00` and activity entries such as `Arrival 7:00`, `Arrival - 7:00`, or `Arrival | 7:00`; the divider is optional.
- Draws every analog clock as crisp SVG using exact geometry.
- Provides print-friendly card sizes for US Letter paper and avoids page breaks inside individual cards.
- Defaults to a Garamond-style font and includes web-safe font choices for matching classroom materials.
- Stores your text and settings in `localStorage` so they are available next time in the same browser.
- Keeps all data on your device; nothing is uploaded or sent to a server.

## How to use

1. Open `index.html` in a browser, or visit the GitHub Pages site for this repository.
2. Edit the schedule text box.
3. Use one entry per line:

   ```text
   7:00
   8:30
   9:15
   ```

   Or include an activity label:

   ```text
   Arrival | 7:00
   Breakfast | 8:30
   Choice Time 9:00
   Outside Time — 4:15
   ```

4. Choose card size, columns, edge style, clock size, and font sizes.
5. Open **Advanced options** only if you need details such as changing the web-safe font, adjusting clock outline thickness, hand widths, hand lengths, numeral size, center dot size, hiding numerals, hiding tick marks, or changing AM/PM behavior.
6. Click **Generate Cards**.
7. Click **Print / Save as PDF** and use your browser's print dialog.

## Example schedule

```text
Arrival | 7:00
Breakfast | 8:30
Choice Time | 9:00
Bodily Care | 9:15
Large Group with Music and Movement | 9:45
Group Time with Materials | 10:00
Brush Teeth | 10:20
Outside Time | 10:30
Lunch | 11:30
Naptime | 12:00
Bodily Care | 2:30
Snack | 2:45
Choice Time | 3:00
Outside Time | 4:15
Departure | 5:00
```

## Why the clocks are accurate

The clocks are not screenshots, emoji, raster images, or AI-generated art. Each clock is created as SVG in JavaScript.

The app calculates hand angles with these formulas:

```text
minuteAngleDegrees = minute * 6
hourAngleDegrees = ((hour % 12) + minute / 60) * 30
```

Because the hour hand includes `minute / 60`, it moves between hour numbers exactly as real analog clocks do. For example, `8:30` places the hour hand halfway between 8 and 9.

## Printing and PDF tips

- Use **Print / Save as PDF** in the app.
- Use US Letter portrait paper for the default layout.
- If your browser offers scaling, choose 100% or default scaling first.
- Disable browser headers and footers if your print dialog includes that option.
- Print a test page before laminating or cutting many cards.

## Deploying on GitHub Pages

1. Push these files to the repository's default branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the repository root folder.
5. Save. GitHub will publish the static site after the Pages workflow completes.

## Files

- `index.html` — page structure and form controls.
- `styles.css` — responsive screen layout and print styles.
- `app.js` — parsing, settings persistence, card rendering, and SVG clock geometry.
- `favicon.svg` — simple black-and-white SVG clock icon.
- `README.md` — project documentation.

## Privacy and offline use

No data leaves the browser. The schedule and settings are stored only in the browser's local storage. After the page has loaded, the app does not need the network to generate or print cards.
