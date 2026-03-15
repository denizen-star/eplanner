# Payment Information - 5 Wireframe Layout Options

Five alternative layouts to make the Payment Information section visually cleaner and more polished.

---

## Option A: Minimal Card with Stepped Flow

```
+------------------------------------------------------------------+
| PAYMENT INFORMATION                                              |
|                                                                  |
|  Free Event  [====o    ]  Paid Event                             |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | Cost type      ( ) Fixed Cost    (●) Split Cost             |  |
|  |                                                            |  |
|  | [ Total cost of event________________________ ]             |  |
|  |   The app will display the estimated cost per person...     |  |
|  |                                                            |  |
|  | ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  |  |
|  | Collection date (optional)                                 |  |
|  | [ mm/dd/yyyy                              ]                |  |
|  |   Date participants should expect to pay...                |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  [!] Kervinapps does not facilitate or process payments...      |
+------------------------------------------------------------------+
```

**Concept:** Single blue-tinted card, generous padding. Cost type and options on one line. Inputs full-width within the card. Subtle divider between cost and collection date. Disclaimer as a light banner below, not a heavy box.

---

## Option B: Inline Compact (Horizontal Dense)

```
+------------------------------------------------------------------+
| PAYMENT INFORMATION                                              |
|                                                                  |
|  Free  [=o=]  Paid     Cost: ( ) Fixed  (●) Split                |
|                                                                  |
|  Amount: [______________]  or  Collection: [__________]          |
|         ^shown when Fixed              ^shown when Split          |
|                                                                  |
|  The app will display the estimated cost per person...            |
|                                                                  |
|  [i] Kervinapps does not facilitate or process payments...       |
+------------------------------------------------------------------+
```

**Concept:** Everything on 2-3 lines. Toggle and cost type share the top row. Amount and collection date appear contextually on the same row. No blue box; rely on spacing and typography. Very compact.

---

## Option C: Pill Segments + Floating Inputs

```
+------------------------------------------------------------------+
| PAYMENT INFORMATION                                              |
|                                                                  |
|  Free Event                    Paid Event                         |
|        [========( o )========]                                    |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  [ Fixed Cost ]  [ Split Cost ]   <- pill buttons, one     |  |
|  |       ^selected style                                        |  |
|  |                                                            |  |
|  |       [ Amount per person        ]  <- floats right        |  |
|  |       or                                                      |  |
|  |       [ Total cost              ]  [ Collection date    ]  |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Kervinapps does not facilitate or process payments...           |
|  (small, muted, no red box)                                       |
+------------------------------------------------------------------+
```

**Concept:** Cost type as large pill/segmented buttons (like iOS). Inputs float or align to the right. No nested boxes; single card. Disclaimer as subtle footer text, not a warning box.

---

## Option D: Two-Row Accordion Feel

```
+------------------------------------------------------------------+
| PAYMENT INFORMATION                                              |
|                                                                  |
|  [ Free Event ]  [ Paid Event ]   <- tab-like, Paid selected      |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | Row 1:  Cost Type  ( ) Fixed  (●) Split                    |  |
|  | Row 2:  [________________]  [________]                      |  |
|  |         Amount/Total              Collection (Split only)    |  |
|  | Row 3:  Helper text in one line, smaller                    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Kervinapps does not facilitate or process payments.             |
+------------------------------------------------------------------+
```

**Concept:** Tab-style for Free/Paid instead of toggle. Blue box has 3 clear rows. Row 2 shows both amount and collection in one line when Split; amount only when Fixed. Less vertical stacking.

---

## Option E: Sidebar Label + Content

```
+------------------------------------------------------------------+
| PAYMENT INFORMATION                                              |
|                                                                  |
|  Free Event  [====o    ]  Paid Event                             |
|                                                                  |
|  +----------+--------------------------------------------------+  |
|  | Cost     | ( ) Fixed Cost   (●) Split Cost                   |  |
|  | Type     |                                                  |  |
|  |          | [ Total cost of event____________ ]               |  |
|  |          | The app will display the estimated cost...       |  |
|  |----------|--------------------------------------------------|  |
|  | Collect  | [ mm/dd/yyyy                    ]                 |  |
|  | (opt)    | Date participants should expect to pay...        |  |
|  +----------+--------------------------------------------------+  |
|                                                                  |
|  Kervinapps does not facilitate or process payments...           |
+------------------------------------------------------------------+
```

**Concept:** Left column for section labels (Cost Type, Collection). Right column for inputs and options. Table-like but soft. Clear visual hierarchy. Disclaimer as text, not a box.

---

## Summary

| Option | Style              | Best for                          |
|--------|--------------------|-----------------------------------|
| A      | Stepped, single card| Familiar, easy to scan            |
| B      | Inline compact     | Space-saving, power users         |
| C      | Pill segments      | Modern, app-like                 |
| D      | Tab + rows         | Clear structure, less nesting     |
| E      | Sidebar labels     | Dense forms, consistent alignment  |

Pick one to implement, or combine elements (e.g., Option C pills + Option A disclaimer treatment).
