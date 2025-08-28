import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { products as ALL_PRODUCTS, CATEGORIES } from "../data/products.js";
import ProductCard from "../components/ProductCard.jsx";
import NiceSelect from "../components/NiceSelect.jsx";
import "../styles/catalog.css";

const PRICE_BUCKETS = [
  { key: "under1k", label: "Under ₹1000", test: (p) => p.price < 1000 },
  { key: "1k_1999", label: "₹1000 - ₹1999", test: (p) => p.price >= 1000 && p.price < 2000 },
  { key: "2k_2999", label: "₹2000 - ₹2999", test: (p) => p.price >= 2000 && p.price < 3000 },
  { key: "3k_plus", label: "₹3000 & Above", test: (p) => p.price >= 3000 },
];

const SORTS = [
  { key: "pop", label: "Popularity", fn: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  { key: "plh", label: "Price: Low to High", fn: (a, b) => a.price - b.price },
  { key: "phl", label: "Price: High to Low", fn: (a, b) => b.price - a.price },
  // For "Newest" you may want a createdAt field. This fallback just sorts by id string.
  { key: "new", label: "Newest", fn: (a, b) => String(b.id).localeCompare(String(a.id)) },
];

export default function Catalog() {
  const { category } = useParams();

  const [catFilter, setCatFilter] = useState(() =>
    category && CATEGORIES.includes(category) ? new Set([category]) : new Set(CATEGORIES)
  );
  const [priceKeys, setPriceKeys] = useState(new Set());
  const [sortKey, setSortKey] = useState("pop");
  const [query, setQuery] = useState("");

  // If the route is /catalog/:category ensure only that category is selected initially
  useEffect(() => {
    if (category && CATEGORIES.includes(category)) setCatFilter(new Set([category]));
  }, [category]);

  // Apply filters except category (to compute per-category counts)
  const nonCatFiltered = useMemo(() => {
    let list = ALL_PRODUCTS.slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.brand ? p.brand.toLowerCase().includes(q) : false)
      );
    }

    if (priceKeys.size > 0) {
      list = list.filter((p) =>
        [...priceKeys].some((k) => PRICE_BUCKETS.find((b) => b.key === k)?.test(p))
      );
    }

    return list;
  }, [query, priceKeys]);

  // counts per category after search/price filter
  const countsByCat = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    nonCatFiltered.forEach((p) => {
      if (map[p.category] != null) map[p.category] += 1;
    });
    return map;
  }, [nonCatFiltered]);

  // final list including category filter + sort
  const filtered = useMemo(() => {
    let list = nonCatFiltered.slice();
    if (catFilter.size > 0) list = list.filter((p) => catFilter.has(p.category));
    const sorter = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];
    list.sort(sorter.fn);
    return list;
  }, [nonCatFiltered, catFilter, sortKey]);

  const clearFilters = () => {
    setCatFilter(new Set(category && CATEGORIES.includes(category) ? [category] : CATEGORIES));
    setPriceKeys(new Set());
    setQuery("");
    setSortKey("pop");
  };

  const selectedCats = catFilter.size ? [...catFilter] : CATEGORIES;

  return (
    <main className="main">
      {/* Toolbar with category count chips + search + custom select */}
      <div className="catalog-toolbar tinted">
        <div className="breadcrumb">
          <div className="cat-counts">
            {selectedCats.map((c) => (
              <div className="cat-chip" key={c}>
                <span className="cat-name">{c}</span>
                <span className="cat-sep">:</span>
                <span className="cat-num">{countsByCat[c]}</span>
                <span className="cat-label">items</span>
              </div>
            ))}
          </div>
        </div>

        <div className="toolbar-actions">
          <input
            className="input list-search"
            placeholder={`Search in ${selectedCats.length === 1 ? selectedCats[0] : "catalog"}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <NiceSelect
            value={sortKey}
            onChange={(v) => setSortKey(v)}
            label="Sort products"
            options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
          />
        </div>
      </div>

      <div className="catalog">
        {/* Left filter panel */}
        <aside className="filters colored" aria-label="Filters">
          <h4 className="filter-title">FILTERS</h4>

          <div className="filter-group">
            <h4>Categories</h4>
            {CATEGORIES.map((c) => (
              <label key={c} className="check">
                <input
                  type="checkbox"
                  checked={catFilter.has(c)}
                  onChange={(e) => {
                    const next = new Set(catFilter);
                    if (e.target.checked) next.add(c);
                    else next.delete(c);
                    setCatFilter(next);
                  }}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Price</h4>
            {PRICE_BUCKETS.map((b) => (
              <label key={b.key} className="check">
                <input
                  type="checkbox"
                  checked={priceKeys.has(b.key)}
                  onChange={(e) => {
                    const next = new Set(priceKeys);
                    if (e.target.checked) next.add(b.key);
                    else next.delete(b.key);
                    setPriceKeys(next);
                  }}
                />
                <span>{b.label}</span>
              </label>
            ))}
          </div>

          <button className="btn" onClick={clearFilters}>Clear Filters</button>
        </aside>

        {/* Product grid */}
        <section>
          <div className="grid grid-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
