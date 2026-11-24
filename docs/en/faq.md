# FAQ

**Question:** “Element 1: Name missing” – what should I do?

Answer: Every element needs a name because it appears above its column. Select the element on the left and enter a name in the middle under **Name**.

**Question:** “Dimension 2: Name missing”—what should I do?

Answer: On the right, under **Dimensions**, expand the specified dimension and enter a **name**.

**Question:** “Dimension 3: Selection without options” or “Option without a name”—what does that mean?

Answer: A dimension of the **Selection** type requires at least one named option. Expand the dimension and use **Add Option** to create options, or remove empty options.

**Question:** Why does the editor say “No number—the last valid value is saved”?

Answer: The number field contains something that is not a number. Only digits, a comma or period as a decimal separator, and a minus sign are allowed. Enter the unit in the dimension, not in the value.

**Question:** Why is a row grayed out?

Answer: All elements in that row have the same value. You can disable this under **Design → Hide Identical Rows**.

**Question:** Why isn’t a best value highlighted?

Answer: Best values are only displayed for numbers with **Best Value** “Higher is better” or “Lower is better” and for ratings—and only if at least two elements have a value and not all are the same. Additionally, **Design → Highlight Best Values** must be enabled.

**Question:** A dimension does not appear on the page.

Answer: Rows in which no element has a value are hidden. Enter a value for at least one element.

**Question:** I changed the type of a dimension and the values are gone.

Answer: When you change the type, values are carried over as far as possible. Any values that don’t match (e.g., Text → Yes/No, if the text is neither “Yes” nor “No,” or anything from and to Gallery) are omitted. Click **Undo** as long as you haven’t closed the window yet.
