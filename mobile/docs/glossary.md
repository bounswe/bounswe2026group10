# Domain Glossary

## Dish (umbrella term)

**Dish** is the umbrella concept grouping three related but distinct entities: **Dish Genre**, **Dish Variety**, and **Recipe**. When the app searches or filters by allergen, ingredient, or region, results can include any of these three — that is why they are unified under the Dish concept.

---

## Dish Genre

The broadest category. A Dish Genre names a class of food at the highest level of abstraction.

**Examples**: Soup, Kebap, Pasta, Salad, Dessert, Pastry

---

## Dish Variety

A specific type within a Dish Genre, typically distinguished by region, culture, or preparation style.

**Examples**: Adana Kebap, Urfa Kebap, Mercimek Çorbası, Tagliatelle al Ragù

A Dish Variety belongs to exactly one Dish Genre.

---

## Recipe

A concrete, step-by-step preparation guide for a Dish Variety. Recipes are authored either by the community (home cooks) or by experts (chefs, cultural authorities).

- **Community recipe**: submitted by a regular user
- **Expert/Cultural recipe**: submitted by a verified expert or sourced from cultural archives

A Dish Variety can have multiple Recipes.

---

## Hierarchy

```
Dish Genre
  └── Dish Variety (one or many per Genre)
        └── Recipe (one or many per Variety, community or expert)
```

---

## Why they are grouped under "Dish"

Allergen filtering, ingredient search, and region-based discovery can surface results at any level of this hierarchy. A search for "gluten-free" may return:
- A Genre (e.g., Salads — generally gluten-free)
- A Variety (e.g., a specific regional dish known to be gluten-free)
- A Recipe (e.g., a specific preparation that avoids gluten)

Grouping all three under the Dish umbrella lets the system return mixed results in a single list without the user needing to understand the hierarchy.
