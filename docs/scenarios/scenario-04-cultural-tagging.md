# Scenario 4 — Discovering Recipes by Cultural Event

**Feature:** Cultural Tagging
**Persona:** *Learner* — a curious home cook based in Turkey

## Story
A user opens the navigator and searches for recipes from **Japan**. Browsing the results, they tap into **Mochitsuki** and read its story — a Japanese New Year tradition of pounding rice into mochi as a community ritual. In the story they spot a chip labelled **Social Gathering**, one of the recipe's cultural tags.

Now curious about *social-gathering* foods in their own region, they go back to the navigator and open the filter sheet. They set:

- **Region:** Turkey
- **Cultural Tag:** Social Gathering

The cultural-tag chip list narrows to Turkey-relevant tags as soon as the region is chosen. Applying the filter, the results cascade: **Stews / Salads** genres surface, with **Çiğ Köfte** as one of the dish varieties, and a recipe for **Çiğ Köfte** tagged **Sıra Gecesi** appears.

The user opens the recipe and reads its story, learning that *sıra gecesi* is a Şanlıurfa tradition where friends gather, take turns hosting, share folk music and food — and çiğ köfte is the centrepiece of the night.

## Step-by-Step
1. User taps **Search** in the bottom nav.
2. Sets **Region = Japan** in the filter sheet, applies.
3. Taps **Mochitsuki** in the variety results → Dish Variety detail.
4. Opens the featured Mochitsuki recipe → Recipe Detail.
5. Reads the *Story* section; sees the *Social Gathering* chip below it.
6. Returns to Search; opens filter sheet again.
7. Changes **Region** to **Turkey** — cultural-tag list re-renders to Turkey-scoped tags.
8. Selects **Cultural Tag = Social Gathering**, applies.
9. Sees cascaded results: genres → varieties → recipes containing tag *social-gathering* in the Turkey region.
10. Taps the **Çiğ Köfte for Sıra Gecesi** recipe.
11. Reads its story and learns about *sıra gecesi*.

## Requirements Exercised
- 1.4.1 / 1.4.3 — Region and tag filters in search
- 1.4.4 — Filter results update dynamically
- 1.2.1 — Recipe story is rendered
- 2.x — Cross-cultural discovery / heritage exposition (cultural-tagging feature)

## Success Criteria
- Cultural-tag chips appear in the recipe's Story section and are tappable.
- Filter sheet exposes a *Cultural Tag* multi-select that re-scopes when *Region* changes.
- Filtered results obey the cascade rule (recipe → variety → genre).
- The Çiğ Köfte / *Sıra Gecesi* story is reachable in ≤ 4 taps from the Mochitsuki recipe.
