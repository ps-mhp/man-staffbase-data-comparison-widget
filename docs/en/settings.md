# Settings

## Dimensions (on the right, “Dimensions” tab)

| Setting | Description |
| --- | --- |
| Name | Appears in the first column. Required. |
| Type | **Text** (free-form text, line breaks preserved), **Number** (with unit, best value if desired), **Yes/No** (checkmark or X), **List** (one entry per line, as a bulleted list), **Selection** (one value from a fixed set of options), **Rating** (1–5 stars), **Gallery** (images to browse and enlarge; does not compare anything). Default: Text. |
| Explanation | Optional; appears in small text below the name. |
| Unit | Only for numbers. Appears after each number, e.g., “PS” or “%”. |
| Best Value | For numbers only: **Neutral** (no marking), **Higher is better**, or **Lower is better**. Default: Neutral. Ratings are always considered “higher is better.” |
| Options | For selection types only. The values from which each element selects one. At least one. |
| Icon before the name | Optional; an icon from the icon library before the dimension’s name. |
| Symbols for Yes / No | Only for Yes/No. Icon from the icon library; default is a checkmark and an X. |
| Color for Yes / No | Only for Yes/No. A MAN-CI color, status color, or custom color; default is accent color for Yes and gray for No. A selected color remains even in dimmed rows. |
| Symbol Size | Only for Yes/No. **Small** (8 × 8 px), **Normal** (10 × 10 px), or **Large** (12 × 12 px). Default: Normal. |

Under each expanded dimension: move up/down, **duplicate** (the copy inherits the type, settings, and all values and appears directly behind it), and delete.

## Elements (left and center)

| Setting | Description |
| --- | --- |
| Name | Appears above the column. Required. |
| Subtitle | Optional; appears one line below the name. |
| Values | One field per dimension, depending on the type. An empty field means “not specified” and appears as “–”. On the page, the values are centered within their column. |

A maximum of 12 elements, 60 dimensions, and 20 images per gallery. Images in a gallery are never cropped: The height of the gallery row is determined by the tallest image among all elements.

## Design (right, “Design” tab)

| Setting | Description |
| --- | --- |
| Heading | Optional; appears above the table. |
| Accent | **Red**, **Charcoal**, or **Blue**—color of checkmarks, stars, icons, and best values. Default: Red. |
| Hide Identical Rows | Rows in which all items have the same value are grayed out. “Not specified” counts as a separate value. Galleries are never grayed out. Default: on. |
| Highlight Best Values | Highlights the best value for preferred numbers and ratings. If all elements have the same value, nothing is highlighted. Default: on. |

## Behavior (right, “Behavior” tab)

| Setting | Description |
| “Show Differences Only” toggle | Displays a toggle above the table that hides rows with no differences. The selection is not saved. Default: off. |
