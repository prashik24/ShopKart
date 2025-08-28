// src/data/products.js

// Used by navbar + filters
export const CATEGORIES = ["Women", "Men", "Kids"];

/** ---- Women (local images) ---- */
const w1 = new URL("../assets/women/women1.png", import.meta.url).href;
const w2 = new URL("../assets/women/women2.png", import.meta.url).href;
const w3 = new URL("../assets/women/women3.png", import.meta.url).href;
const w4 = new URL("../assets/women/women4.png", import.meta.url).href;
const w5 = new URL("../assets/women/women5.png", import.meta.url).href;
const w6 = new URL("../assets/women/women6.png", import.meta.url).href;

/** ---- Men (local images) ---- */
const m1 = new URL("../assets/men/men1.png", import.meta.url).href; // tee
const m2 = new URL("../assets/men/men2.png", import.meta.url).href; // derby shoes
const m3 = new URL("../assets/men/men3.png", import.meta.url).href; // watch
const m4 = new URL("../assets/men/men4.png", import.meta.url).href; // blazer
const m5 = new URL("../assets/men/men5.png", import.meta.url).href; // sunglasses
const m6 = new URL("../assets/men/men6.png", import.meta.url).href; // backpack

/** ---- Kids (local images) ---- */
const k1 = new URL("../assets/kids/kid1.png", import.meta.url).href; // striped tee
const k2 = new URL("../assets/kids/kid2.png", import.meta.url).href; // polka dress
const k3 = new URL("../assets/kids/kid3.png", import.meta.url).href; // sneakers
const k4 = new URL("../assets/kids/kid4.png", import.meta.url).href; // unicorn backpack
const k5 = new URL("../assets/kids/kid5.png", import.meta.url).href; // sun cap
const k6 = new URL("../assets/kids/kid6.png", import.meta.url).href; // toy set

/**
 * Fields used across the app:
 * id, title, category, price, image, images, desc, brand, sizes, colors, stock
 */
export const products = [
  // =============== WOMEN ===============
  {
    id: "W001",
    title: "Ivory Tailored Blazer",
    category: "Women",
    brand: "ShopKart Studio",
    price: 2999,
    image: w1,
    images: [w1],
    desc:
      "Single-breasted blazer with slim notch lapel and smooth lining. Works with denim or trousers.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory"],
    stock: 24,
  },
  {
    id: "W002",
    title: "Minimal Tote Bag",
    category: "Women",
    brand: "ShopKart Essentials",
    price: 1299,
    image: w2,
    images: [w2],
    desc:
      "Roomy faux-leather tote with soft handles and a structured base. Fits most 13-inch laptops easy to carry.",
    sizes: [],
    colors: ["Beige"],
    stock: 50,
  },
  {
    id: "W003",
    title: "Pointed Stiletto Heels",
    category: "Women",
    brand: "SK Heels",
    price: 1899,
    image: w3,
    images: [w3],
    desc:
      "Classic pointed pumps with cushioned footbed and ~9 cm heel height for polished looks easy to carry and wear.",
    sizes: ["36", "37", "38", "39", "40", "41"],
    colors: ["Nude"],
    stock: 32,
  },
  {
    id: "W004",
    title: "Embroidered Maroon Kurti",
    category: "Women",
    brand: "Indie Threads",
    price: 999,
    image: w4,
    images: [w4],
    desc:
      "Straight-fit kurti with contrast yoke embroidery, side slits and breathable cotton blend.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Maroon"],
    stock: 40,
  },
  {
    id: "W005",
    title: "Kundan Necklace Set",
    category: "Women",
    brand: "SK Jewelry",
    price: 2499,
    image: w5,
    images: [w5],
    desc:
      "Antique-gold toned kundan set with earrings. A statement piece for festive wear.",
    sizes: [],
    colors: ["Gold / Red"],
    stock: 18,
  },
  {
    id: "W006",
    title: "Bit Loafers",
    category: "Women",
    brand: "ShopKart Studio",
    price: 2299,
    image: w6,
    images: [w6],
    desc:
      "Almond-toe loafers with metal bit detail and low stacked heel. Soft suede-finish upper.",
    sizes: ["36", "37", "38", "39", "40", "41"],
    colors: ["Taupe"],
    stock: 28,
  },

  // =============== MEN (renamed) ===============
  {
    id: "M101",
    title: "Men’s Crew-Neck T-Shirt",
    category: "Men",
    brand: "ShopKart Men",
    price: 1299,
    image: m1,
    images: [m1],
    desc:
      "Soft crew neck tee with a clean fit everyday essential in a breathable cotton-rich knit.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Sage", "Black", "White"],
    stock: 35,
  },
  {
    id: "M102",
    title: "Classic Derby Shoes",
    category: "Men",
    brand: "ShopKart Men",
    price: 1499,
    image: m2,
    images: [m2],
    desc:
      "Timeless derby with cushioned insole and grippy outsole dress up or down with ease.",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Tan"],
    stock: 42,
  },
  {
    id: "M103",
    title: "Analog Leather Watch",
    category: "Men",
    brand: "ShopKart Men",
    price: 1999,
    image: m3,
    images: [m3],
    desc:
      "Minimal dial with a textured leather strap smart everyday companion.",
    sizes: [],
    colors: ["Brown / Silver"],
    stock: 26,
  },
  {
    id: "M104",
    title: "Structured Blazer",
    category: "Men",
    brand: "ShopKart Men",
    price: 2299,
    image: m4,
    images: [m4],
    desc:
      "Tailored blazer with notch lapels and full lining sharp for work and occasions.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Rust"],
    stock: 20,
  },
  {
    id: "M105",
    title: "Aviator Sunglasses",
    category: "Men",
    brand: "ShopKart Men",
    price: 799,
    image: m5,
    images: [m5],
    desc:
      "UV-protected lenses in a lightweight metal frame classic aviator silhouette.",
    sizes: [],
    colors: ["Gold / Brown"],
    stock: 60,
  },
  {
    id: "M106",
    title: "Urban Daypack",
    category: "Men",
    brand: "ShopKart Men",
    price: 1099,
    image: m6,
    images: [m6],
    desc:
      "Everyday backpack with flap closure, twin pockets and padded shoulder straps.",
    sizes: [],
    colors: ["Charcoal"],
    stock: 38,
  },

  // =============== KIDS (renamed) ===============
  {
    id: "K201",
    title: "Striped Cotton Tee",
    category: "Kids",
    brand: "MiniClub",
    price: 399,
    image: k1,
    images: [k1],
    desc:
      "Soft, breathable jersey tee with bright stripes perfect for play soft and comfortable.",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: ["Multicolor"],
    stock: 48,
  },
  {
    id: "K202",
    title: "Polka-Dot Dress",
    category: "Kids",
    brand: "Playwear",
    price: 549,
    image: k2,
    images: [k2],
    desc:
      "Cute polka-dot frock with soft lining and easy snap closure for all-day comfort.",
    sizes: ["2-3Y", "4-5Y", "6-7Y"],
    colors: ["Yellow"],
    stock: 34,
  },
  {
    id: "K203",
    title: "Hook-and-Loop Sneakers",
    category: "Kids",
    brand: "TinySteps",
    price: 899,
    image: k3,
    images: [k3],
    desc:
      "Easy-on sneakers with hook-and-loop straps and cushioned sole for active days.",
    sizes: ["9C", "10C", "11C", "12C", "13C"],
    colors: ["Yellow / Teal"],
    stock: 29,
  },
  {
    id: "K204",
    title: "Unicorn Mini Backpack",
    category: "Kids",
    brand: "CarryFun",
    price: 999,
    image: k4,
    images: [k4],
    desc:
      "Adorable backpack with roomy compartment, front pocket and comfy straps.",
    sizes: [],
    colors: ["Pink"],
    stock: 22,
  },
  {
    id: "K205",
    title: "Sun-Print Cap",
    category: "Kids",
    brand: "Sunny Days",
    price: 799,
    image: k5,
    images: [k5],
    desc:
      "Curved brim cap with adjustable back strap shaded fun outdoors.",
    sizes: ["Free Size"],
    colors: ["Teal"],
    stock: 31,
  },
  {
    id: "K206",
    title: "Activity Toy Set",
    category: "Kids",
    brand: "PlaySet",
    price: 899,
    image: k6,
    images: [k6],
    desc:
      "Colorful stacking and music toys to spark imagination and motor skills.",
    sizes: [],
    colors: ["Multicolor"],
    stock: 36,
  },
];
