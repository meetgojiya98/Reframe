# Reframe UI themes

## Version 1 (original)

The original warm, soft UI (cream background, teal primary).  
Fully saved in **`app/themes/globals.version-1.css`**.

**To revert to Version 1:**

1. Restore the v1 stylesheet:
   ```bash
   cp app/themes/globals.version-1.css app/globals.css
   ```
2. In `app/layout.tsx`, set `themeColor` to `"#2d8a6e"`.
3. In `tailwind.config.ts`, set `sans` back to `["var(--font-manrope)", ...]` (remove `--font-plus-jakarta`).
4. In `app/layout.tsx`, remove the Plus_Jakarta_Sans import and its `variable` from `body` className.
5. Optionally revert `components/ui/card.tsx` and `components/layout/app-shell.tsx` from Git if you want the exact v1 card/nav styles.

## Version 2

Modern, futuristic, calm: cool slate background, cyan primary, glassmorphism, soft glows.  
Saved in git history; to re-enable, restore `app/globals.css` and related files from that commit.

**Current theme: Version 1**
