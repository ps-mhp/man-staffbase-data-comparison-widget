# Settings

## Dimensions (on the right, “Dimensions” tab)

| Setting | Description |
| --- | --- |
| Name | Appears in the first column. Required. |
| Type | **Text** (free-form text, line breaks preserved), **Number** (with unit, best value if desired), **Yes/No** (checkmark or X), **List** (one entry per line, as a bulleted list), **Selection** (one value from fixed options), **Rating** (1–5 stars), **Gallery** (images to browse and enlarge; does not compare anything). Default: Text. |
| Explanation | Optional, appears in small text below the name. |
| Units | Only for numbers. One or more units, e.g., “PS” and “kW”; the unit follows each number. If there are multiple units, each element gets its own field per unit, and the page displays one row per unit. The Best Value compares the first unit. |
| Best Value | Only for numbers: **Neutral** (no marking), **Higher is better**, or **Lower is better**. Default: Neutral. Ratings are always considered “higher is better.” |
| Options | Only for dropdown menus. The values from which each element selects one. At least one. |
| Icon before the name | Optional: an icon from the icon library before the dimension’s name. |
| Symbol for Yes / No | Only for Yes/No. Icon from the icon library; default checkmark and cross. |
| Color for Yes / No | Only for Yes/No. A MAN-CI, status, or custom color; default is accent color for Yes and gray for No. A selected color remains even in dimmed rows. |
| Symbol size | Only for Yes/No. **Small** (8 × 8 px), **Normal** (10 × 10 px), or **Large** (12 × 12 px). Default: Normal. |

Under each expanded dimension: move up/down, **duplicate** (the copy inherits the type, settings, and all values and appears directly behind it), and delete.

## Elements (left and center)

| Setting | Description |
| --- | --- |
| Name | Appears above the column. Required. |
| Subtitle | Optional, one line below the name. |
| Values | One field per dimension, depending on the type. Empty means “not specified” and appears as “–”. On the page, the values are centered in their column. |

There can be any number of elements and dimensions; a maximum of 20 images per gallery. Images in a gallery are never cropped: The height of the gallery row is determined by the tallest image among all elements.

## Design (right, “Design” tab)

| Setting | Description |
| --- | --- |
| Heading | Optional; appears above the table. |
| Accent | **Red**, **Charcoal**, or **Blue**—color of checkmarks, stars, icons, and best values. Default: Red. |
| Transpose | Reverses the table: elements as rows (name on the left, remains stationary when scrolling), dimensions as columns. Hide, Top Values, “Differences Only,” and “Visible Rows” continue to apply—elements are then collapsed. Default: off. |
| Hide Identical Values | Dimensions in which all elements have the same value are grayed out. “Not Specified” counts as a separate value. Galleries are never hidden. Default: on. |
| Highlight Best Values | Highlights the best value for numerical fields with a preference setting and for ratings. If all elements have the same value, nothing is highlighted. Default: on. |

## Behavior (right, “Behavior” tab)

| Setting | Description |
| --- | --- |
| Visible Rows | How many rows (dimensions) are displayed; the rest are collapsed behind the “Show more … rows” button. **0** shows all. Default: 5. |
| “Show Differences Only” toggle | Displays a toggle above the table that hides rows with no differences. The selection is not saved. Default: off. |
