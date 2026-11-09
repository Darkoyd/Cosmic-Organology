# Cosmic Organology website

Static site built with [Eleventy](https://www.11ty.dev/) from Markdown files, uploaded to Bluehost as plain HTML.

## Editing content

All content lives in `content/`. Each `.md` file is one page **and** one node in the home page's 3D graph.

```
content/
  index.md          Home (graph centre)
  project.md        status.md  desi.md  background.md
  team.md           conversations.md  network.md  cosmos-2027.md
  img/              photos, tarot cards, logos (reference as /img/...)
  _data/site.json   site title, description, contact email
  _layouts/  assets/   design + code (no need to touch for content)
```

### A page

```yaml
---
title: DESI            # node label and page title
order: 3               # position in the menu / graph
shape: triangle        # node mark: circle | square | triangle
lede: One-line intro under the title.
sections:              # optional blocks, rendered in order
  - heading: What is DESI     # every heading becomes a satellite node in the graph
    text: |
      Normal **Markdown** text.
---
Optional free Markdown under the front matter appears right after the title.
```

**New page:** copy any `.md`, change `title` and `order`. It appears in the menu and the graph on the next build.
Add `hidden: true` to keep a page out of the menu and graph.

### Section blocks

A section has an optional `heading`, an optional `text`, and can hold one or more of these lists:

| Field        | Items look like                                                                     |
| ------------ | ----------------------------------------------------------------------------------- |
| `cards`    | `title`, `shape`, `text` (three-column grid)                                  |
| `items`    | `year`, `title`, `url`, `by`, `text` (press, precedents, talks, podcasts) |
| `timeline` | `date`, `title`, `status` (`done` / `now` / empty), `text`              |
| `members`  | `name`, `role`, `url`, `portrait`, `tarot`, `text`                      |
| `logos`    | `name`, `url`, `image`                                                        |
| `image`    | `src`, `alt`, `caption` (wide image)                                          |
| `video`    | `src` (embed URL), `caption`                                                    |

Add `style: statement` to a section to make it the big black statement block.
Empty `portrait` / `tarot` / `src` fields show grey placeholders.

## Working on the site together

The team writes; one **maintainer** checks, builds and publishes. Nobody else needs Node, the terminal or Bluehost access.

### For team members (writing and editing)

1. **Get the latest file.** Always start from the current version of the page (`content/<page>.md`) the maintainer shares, never an old copy, or recent changes get lost.
2. **Edit it in any plain-text editor.** For example VS Code, Obsidian, Typora, or TextEdit in *Format → Make Plain Text* mode. Do not use Word or Google Docs: they change quotes and spacing and break the file.
3. **Change only the text you need.** Leave the `---` lines and the field names (`title:`, `sections:`, `heading:`…) as they are.
4. **Send it back** to the maintainer with a short note of what changed, e.g. "team.md: added a profile and photos".

**One page, one person at a time.** Say in the team chat which file you are editing so two people don't overwrite each other.

**New page:** duplicate an existing page, rename it in lowercase with dashes (`field-notes.md`, which becomes `/field-notes/`), change `title` and `order`, write, send.

**Images:** send them alongside the page with lowercase-dashed names (`x-portrait.jpg`, `x-tarot.jpg`), JPG or PNG, about 2000px on the long side and under 1 MB if possible. Write the path in the page as `/img/team/x-portrait.jpg`, and include photo credits and permissions in your note.

**Unfinished text:** leave `[TODO: ...]` markers. They show on the site, so the maintainer can search for them before publishing.

### Writing rules that keep the build working

The part between the two `---` lines (front matter, YAML) is strict:

- Indent with **spaces, never tabs**, and keep items of a list aligned exactly as in the surrounding lines.
- If a value contains a colon `:` or starts with `[`, `*`, `#` or a quote, wrap it in double quotes:
  `role: "Principal Investigator: sculpture"`
- For text with several paragraphs use `text: |`, then write the paragraphs indented on the next lines, separated by a blank line.
- Lists start with `- ` (dash + space), one per item.

Below the front matter and inside `text:` fields, normal Markdown works: `**bold**`, `*italic*`, `[link text](https://...)`, blank line between paragraphs.

### For the maintainer (reviewing and publishing)

1. Put the received `.md` files in `content/` and images in `content/img/` (`content/img/team/` for portraits and tarot cards).
2. Run `npm start`, open http://localhost:8080 and check the changed pages and the home graph. If the terminal shows an error, it names the file and line: usually a tab, a missing quote around a colon, or a misaligned list item.
3. Search for leftover placeholders: `grep -rn "TODO" content/*.md`.
4. Before publishing, keep a dated backup of the current `content/` folder (or commit it with git). This is the undo history.
5. Run `npm run build` and upload the contents of `_site/` to `public_html/` on Bluehost, replacing the old files.
6. Tell the team it's live and share the updated `.md` files back to the shared folder so everyone starts from the new version.

## Build and preview

Needs Node 18+.

```sh
npm install        # once
npm start          # preview at http://localhost:8080, reloads on save
npm run build      # writes the final site to _site/
```

## Publish to Bluehost

1. `npm run build`
2. Upload the **contents** of `_site/` into `public_html/` (cPanel File Manager or an FTP client such as FileZilla).

Links are root-relative (`/desi/`), so the site must live at the domain root. For a subfolder, ask to set Eleventy's `pathPrefix`.
