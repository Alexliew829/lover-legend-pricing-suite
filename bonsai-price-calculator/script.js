// Lover Legend Bonsai Price Calculator V6.3
const retailInput = document.getElementById("retailPrice");
const clearBtn = document.getElementById("clearBtn");

const livePriceEl = document.getElementById("livePrice");
const sameRackPriceEl = document.getElementById("sameRackPrice");
const pickupPriceEl = document.getElementById("pickupPrice");
const minimumPriceEl = document.getElementById("minimumPrice");
const tiktokPriceEl = document.getElementById("tiktokPrice");
const currencySelect = document.getElementById("currencySelect");
const foreignPriceEl = document.getElementById("foreignPrice");
const rateLineEl = document.getElementById("rateLine");
const pullRefreshEl = document.getElementById("pullRefresh");
const indonesiaShippingEl = document.getElementById("indonesiaShipping");
const taiwanShippingEl = document.getElementById("taiwanShipping");
const sgSectionEl = document.querySelector(".sg-section");
const domesticOnlyEls = document.querySelectorAll(".domestic-only");

const productIdInput = document.getElementById("productIdInput");
const productNameEl = document.getElementById("productName");
const productDropdownEl = document.getElementById("productDropdown");
const clearProductBtn = document.getElementById("clearProductBtn");
const PRODUCT_API_URL = "https://script.google.com/macros/s/AKfycbxWKdEC7vy_7pZ2_CPie-9L5DeIofPggZlLuwB7gW-31HqWXEOxshtCR-HB-m5qLYS6/exec";
const PRODUCT_PRICING_CACHE_KEY = "ll_bonsai_product_pricing_v63";
let productPricingList = [];
let productPricingLoaded = false;
let productPricingLoading = null;
let selectedProduct = null;

const EXPORT_CERT_RM = 200;
const PAYMENT_BUFFER = 0.03;

// Fallback only. The page will replace these with the latest online rates when available.
let exchangeRates = {
  IDR: 4389.41,
  TWD: 7.85,
  USD: 0.237
};
let rateLoadedFromWeb = false;

function resetCurrencyToDefault() {
  currencySelect.value = "MYR";
}

function cleanNumber(value) {
  return Number(String(value).replace(/[^0-9.]/g, "")) || 0;
}

function roundToNearest50(value) {
  return Math.round(value / 50) * 50;
}

function roundToNearest10(value) {
  return Math.round(value / 10) * 10;
}

function roundDown100(value) {
  return Math.floor(value / 100) * 100;
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

function formatRM(value) {
  return "RM" + Number(value).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatIDR(value) {
  return "Rp" + Math.round(value).toLocaleString("id-ID");
}

function getLivePrice(retail) {
  if (retail <= 500) return retail;
  return roundDown100(retail * 0.92);
}


// V6.3 accepted pricing logic:
// 1) TikTok = retail -18% (x0.82), rounded to nearest RM10.
// 2) Live price keeps the proven V6.3 rule above.
// 3) Suggested minimum = live x80%, rounded to nearest RM10.
// 4) Product mode preserves the exact Import minimum and finds the first safe retail price ending in 80.
function getSuggestedMinimumFromLive(livePrice) {
  return livePrice > 0 ? roundToNearest10(livePrice * 0.80) : 0;
}

function getRoundedTikTokPrice(retail) {
  return retail > 0 ? roundToNearest10(retail * 0.82) : 0;
}

function reversePriceFromMinimum(importMinimum) {
  const target = Math.max(0, Number(importMinimum) || 0);
  if (target <= 0) return { retail: 0, live: 0, suggestedMinimum: 0 };

  // V6.3 low-price product reverse rule:
  // Import minimum -> /80% -> live rounded to nearest RM10.
  // When that live price is <= RM500, retail must be the next STRICTLY HIGHER ...80 price.
  // Examples: 210 -> 260 -> 280, 300 -> 380 -> 480, 380 -> 480 -> 580.
  const directLive = roundToNearest10(target / 0.80);
  if (directLive <= 500) {
    const nextRetail80 = Math.floor((directLive + 20) / 100) * 100 + 80;
    const retail = nextRetail80 <= directLive ? nextRetail80 + 100 : nextRetail80;
    return { retail, live: directLive, suggestedMinimum: getSuggestedMinimumFromLive(directLive) };
  }

  // Higher-price products keep the accepted safe reverse logic:
  // generate ...80 retail prices and choose the first combination whose live x80%
  // is not below the exact Import minimum.
  const maxRetail = Math.max(1000000, Math.ceil(target * 4));
  for (let retail = 80; retail <= maxRetail; retail += 100) {
    const live = getLivePrice(retail);
    const suggestedMinimum = getSuggestedMinimumFromLive(live);
    if (suggestedMinimum >= target) {
      return { retail, live, suggestedMinimum };
    }
  }
  const fallbackRetail = Math.ceil((target / 0.80 / 0.92) / 100) * 100 + 80;
  const fallbackLive = getLivePrice(fallbackRetail);
  return { retail: fallbackRetail, live: fallbackLive, suggestedMinimum: getSuggestedMinimumFromLive(fallbackLive) };
}

function normalizeProductId(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, "").trim();
}

function normalizeProductSearch(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, "").trim();
}

const PRODUCT_PREFIX_RULES_V61 = [["黄杨","BX"],["凌珊","BB"],["罗汉松","PD"],["李氏樱桃","SK"],["水梅","JL"],["酸豆","AS"],["寿娘子","SC"],["三角梅","BV"],["七里香","MR"],["九里香","MR"],["仙丹","IX"],["福建茶","HK"]];
const LEGACY_PRODUCT_ID_ALIASES_V61 = Object.freeze({
  PS0001: "BX0001",
  PS0002: "AS0002",
  PZ0006: "BX0006"
});

function compatibleProductIdsV61(product) {
  const current = normalizeProductId(product?.id);
  const match = current.match(/^[A-Z]{2}(\d{4})$/);
  if (!match) return [current];
  // PS is the current, valid prefix for flowerpots. Do not manufacture a PZ
  // alias for a genuine PS product; only explicit historical aliases below
  // may point from PS to a migrated bonsai.
  if (current.startsWith("PS")) return [current];
  const compactName = String(product?.name || "").replace(/\s+/g, "");
  const rule = PRODUCT_PREFIX_RULES_V61.find(([name]) => compactName.includes(name));
  const knownLegacyIds = Object.keys(LEGACY_PRODUCT_ID_ALIASES_V61)
    .filter(oldId => LEGACY_PRODUCT_ID_ALIASES_V61[oldId] === current);
  return [...new Set([
    current,
    `PZ${match[1]}`,
    rule ? `${rule[1]}${match[1]}` : "",
    ...knownLegacyIds
  ].filter(Boolean))];
}

function formatPriceInput(value) {
  return Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setProductMode(product) {
  selectedProduct = product || null;
  document.body.classList.toggle("product-mode", Boolean(selectedProduct));
  retailInput.readOnly = Boolean(selectedProduct);
  if (!selectedProduct) {
    if (productNameEl) { productNameEl.textContent = ""; productNameEl.hidden = true; }
    return;
  }

  const minimum = Math.max(0, Number(selectedProduct.minimumPrice) || 0);
  const prices = reversePriceFromMinimum(minimum);

  // V6.3: never inherit the previous product's generated prices.
  // This is especially important when the newly typed exact PZ has minimumPrice = 0/blank.
  retailInput.value = prices.retail > 0 ? formatPriceInput(prices.retail) : "";
  livePriceEl.value = prices.live > 0 ? formatPriceInput(prices.live) : "";
  if (productNameEl) {
    productNameEl.innerHTML = "";
    const idPart = document.createElement("span");
    idPart.className = "product-name-id";
    idPart.textContent = selectedProduct.id;
    const sep = document.createTextNode(" · ");
    const namePart = document.createElement("span");
    namePart.className = "product-name-text";
    namePart.textContent = selectedProduct.name || "";
    productNameEl.appendChild(idPart);
    productNameEl.appendChild(sep);
    productNameEl.appendChild(namePart);
    productNameEl.hidden = false;
  }
  calculate();
}

async function fetchProductPricingOnce() {
  const response = await fetch(PRODUCT_API_URL, {
    method: "POST",
    redirect: "follow",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "publicProductPricing" })
  });
  if (!response.ok) throw new Error("Product pricing connection failed");
  const data = await response.json();
  if (!data || !data.ok || !Array.isArray(data.products)) throw new Error("Invalid product pricing data");
  return data.products;
}

function normalizeProductPricingList(rawProducts) {
  return (Array.isArray(rawProducts) ? rawProducts : []).map(function (product) {
    return {
      id: String(product.id || "").trim(),
      normalizedId: normalizeProductId(product.id),
      name: String(product.name || "").trim(),
      normalizedName: normalizeProductSearch(product.name),
      minimumPrice: Math.max(0, Number(product.minimumPrice) || 0),
      compatibleIds: compatibleProductIdsV61(product)
    };
  }).filter(function (product) { return product.normalizedId; });
}

function hydrateProductPricingCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCT_PRICING_CACHE_KEY) || "null");
    if (!cached || !Array.isArray(cached.products) || !cached.products.length) return false;
    const hydrated = normalizeProductPricingList(cached.products);
    if (!hydrated.length) return false;
    productPricingList = hydrated;
    productPricingLoaded = true;
    return true;
  } catch (error) {
    return false;
  }
}

function saveProductPricingCache(products) {
  try {
    localStorage.setItem(PRODUCT_PRICING_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      products: (Array.isArray(products) ? products : []).map(function (product) {
        return {
          id: String(product.id || "").trim(),
          name: String(product.name || "").trim(),
          minimumPrice: Math.max(0, Number(product.minimumPrice) || 0)
        };
      })
    }));
  } catch (error) {}
}

function refreshSelectedProductFromLatestList() {
  if (!selectedProduct) return;
  const id = normalizeProductId(selectedProduct.id);
  const latest = productPricingList.find(function (product) {
    return product.normalizedId === id;
  });
  if (!latest) return;
  if (Number(latest.minimumPrice) !== Number(selectedProduct.minimumPrice) || latest.name !== selectedProduct.name) {
    setProductMode(latest);
  } else {
    selectedProduct = latest;
  }
}

async function loadProductPricing(forceRetry) {
  if (productPricingLoaded && !forceRetry) return productPricingList;
  if (productPricingLoading) return productPricingLoading;

  productPricingLoading = (async function () {
    let rawProducts;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        rawProducts = await fetchProductPricingOnce();
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise(function (resolve) { setTimeout(resolve, 450); });
      }
    }
    if (!rawProducts) throw lastError || new Error("Product pricing unavailable");

    productPricingList = normalizeProductPricingList(rawProducts);
    productPricingLoaded = true;
    saveProductPricingCache(rawProducts);
    refreshSelectedProductFromLatestList();
    return productPricingList;
  })().catch(function (error) {
    // Keep a successfully hydrated local cache usable even if the cloud refresh fails.
    if (!productPricingList.length) productPricingLoaded = false;
    throw error;
  }).finally(function () {
    productPricingLoading = null;
  });
  return productPricingLoading;
}

function closeProductDropdown() {
  if (!productDropdownEl) return;
  productDropdownEl.hidden = true;
  productDropdownEl.innerHTML = "";
}

function chooseProduct(product) {
  if (!product || !productIdInput) return;
  productIdInput.value = product.id;
  closeProductDropdown();
  setProductMode(product);
}

function renderProductMatches(query) {
  if (!productDropdownEl) return;
  const normalized = normalizeProductSearch(query);
  if (!normalized) { closeProductDropdown(); return; }

  // V6.3: one input searches Product ID OR product name, like the pricing calculator search.
  // No fuzzy/reversed-letter matching: typed text must appear in the original order.
  const matches = productPricingList.filter(function (product) {
    const id = product.normalizedId || "";
    const name = product.normalizedName || "";
    const aliases = product.compatibleIds || [id];
    const idWithoutPrefix = aliases.map(value => value.replace(/^[A-Z]{2}/, ""));
    return aliases.some(value => value.startsWith(normalized)) ||
      idWithoutPrefix.some(value => value.startsWith(normalized)) ||
      name.includes(normalized);
  }).slice(0, 20);

  productDropdownEl.innerHTML = "";
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "product-option-empty";
    empty.textContent = "找不到产品 / Product not found";
    productDropdownEl.appendChild(empty);
    productDropdownEl.hidden = false;
    return;
  }
  matches.forEach(function (product) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-option";
    const strong = document.createElement("strong");
    strong.textContent = product.id;
    const name = document.createTextNode(" · " + (product.name || ""));
    button.appendChild(strong);
    button.appendChild(name);
    button.addEventListener("click", function () { chooseProduct(product); });
    productDropdownEl.appendChild(button);
  });
  productDropdownEl.hidden = false;
}

function resolveProductInputFromMemory(normalized) {
  if (!normalized || !productPricingList.length) return false;
  const exactCurrent = productPricingList.find(function (product) {
    return product.normalizedId === normalized;
  });
  const aliasMatches = exactCurrent ? [] : productPricingList.filter(function (product) {
    return (product.compatibleIds || [product.normalizedId]).includes(normalized);
  });
  const exact = exactCurrent || (aliasMatches.length === 1 ? aliasMatches[0] : null);
  if (exact) {
    chooseProduct(exact);
    return true;
  }
  if (selectedProduct) {
    setProductMode(null);
    retailInput.value = "";
    livePriceEl.value = "";
    calculate();
  }
  renderProductMatches(productIdInput.value);
  return true;
}

async function handleProductIdInput() {
  if (!productIdInput) return;
  const normalized = normalizeProductSearch(productIdInput.value);
  if (!normalized) {
    closeProductDropdown();
    setProductMode(null);
    retailInput.value = "";
    livePriceEl.value = "";
    calculate();
    return;
  }

  // V6.3 speed path: search the last successful local cache immediately.
  if (resolveProductInputFromMemory(normalized)) return;

  try {
    await loadProductPricing(false);
    resolveProductInputFromMemory(normalized);
  } catch (error) {
    if (selectedProduct) {
      setProductMode(null);
      retailInput.value = "";
      livePriceEl.value = "";
      calculate();
    }
    if (productDropdownEl) {
      productDropdownEl.innerHTML = '<div class="product-option-empty">产品资料暂时无法读取 / Product data unavailable</div>';
      productDropdownEl.hidden = false;
    }
  }
}

function formatRate(currency, rate) {
  if (currency === "IDR") {
    return "Rate: 1 MYR = Rp" + Number(rate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  if (currency === "TWD") {
    return "Rate: 1 MYR = NT$" + Number(rate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  return "Rate: 1 MYR = US$" + Number(rate).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
}

function formatIDRCompact(value) {
  if (value <= 0) return "0 jt";
  const rounded = roundUp(value, 100000);
  const juta = rounded / 1000000;
  const decimals = Number.isInteger(juta) ? 0 : 1;
  return juta.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 1
  }) + " jt";
}

function formatForeignPrice(currency, value) {
  // V6.3: MYR/TWD are already named in the currency selector, so the large
  // number does not repeat RM or NT$. This prevents high values being clipped.
  if (currency === "MYR") {
    return Number(value || 0).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  if (value <= 0) {
    if (currency === "IDR") return "0 jt";
    if (currency === "TWD") return "0";
    return "US$0";
  }
  if (currency === "IDR") return formatIDRCompact(value);
  if (currency === "TWD") return roundUp(value, 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return "US$" + roundUp(value, 1).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function updateForeignPrice(livePrice) {
  const currency = currencySelect.value;

  if (currency === "MYR") {
    foreignPriceEl.textContent = formatForeignPrice("MYR", livePrice);
    rateLineEl.textContent = "马币 / Ringgit Malaysia";
    return;
  }

  const rate = exchangeRates[currency];
  const protectedMYR = livePrice > 0 ? (livePrice + EXPORT_CERT_RM) / (1 - PAYMENT_BUFFER) : 0;
  const converted = protectedMYR * rate;
  foreignPriceEl.textContent = formatForeignPrice(currency, converted);
  rateLineEl.textContent = formatRate(currency, rate);
}

function updateModeVisibility() {
  const indonesiaMode = currencySelect.value === "IDR";
  const taiwanMode = currencySelect.value === "TWD";
  const exportFreightMode = indonesiaMode || taiwanMode;
  domesticOnlyEls.forEach(function (el) { el.hidden = exportFreightMode; });
  if (sgSectionEl) sgSectionEl.hidden = exportFreightMode;
  if (indonesiaShippingEl) indonesiaShippingEl.hidden = !indonesiaMode;
  if (taiwanShippingEl) taiwanShippingEl.hidden = !taiwanMode;
}

function hasRetailPrice() {
  return retailInput.value.trim() !== "" && cleanNumber(retailInput.value) > 0;
}

function getManualLivePrice() {
  return cleanNumber(livePriceEl.value);
}

function setLiveInputMode(retailMode, livePrice) {
  livePriceEl.readOnly = retailMode;
  livePriceEl.classList.toggle("auto-live", retailMode);
  if (retailMode) {
    livePriceEl.value = Number(livePrice).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

function calculate() {
  const retailMode = hasRetailPrice();
  const retail = retailMode ? cleanNumber(retailInput.value) : 0;
  const tiktokPrice = getRoundedTikTokPrice(retail);
  const livePrice = retailMode ? getLivePrice(retail) : getManualLivePrice();

  setLiveInputMode(retailMode, livePrice);

  const sameRackDiscount = livePrice >= 500 ? "-RM30.00" : "-";
  let pickupDiscount;
  if (livePrice >= 2000) pickupDiscount = 100;
  else if (livePrice >= 500) pickupDiscount = 50;
  else pickupDiscount = 20;

  const pickupPrice = livePrice > 0 ? Math.max(0, livePrice - pickupDiscount) : 0;
  const minimumPrice = selectedProduct
    ? Math.max(0, Number(selectedProduct.minimumPrice) || 0)
    : getSuggestedMinimumFromLive(livePrice);

  sameRackPriceEl.textContent = sameRackDiscount;
  pickupPriceEl.textContent = formatRM(pickupPrice);
  minimumPriceEl.textContent = formatRM(minimumPrice);
  tiktokPriceEl.textContent = retailMode ? "(" + formatMoney(tiktokPrice) + ")" : "";
  updateForeignPrice(livePrice);
  updateModeVisibility();
  calculateIndonesiaShipping();
  calculateTaiwanShipping();
}

async function loadExchangeRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/MYR", { cache: "no-store" });
    if (!response.ok) throw new Error("Rate request failed");
    const data = await response.json();
    if (data && data.rates && Number(data.rates.IDR) > 0 && Number(data.rates.TWD) > 0 && Number(data.rates.USD) > 0) {
      exchangeRates = {
        IDR: Number(data.rates.IDR),
        TWD: Number(data.rates.TWD),
        USD: Number(data.rates.USD)
      };
      rateLoadedFromWeb = true;
    }
  } catch (error) {
    rateLoadedFromWeb = false;
  }
  calculate();
}

// Indonesia inland estimate V6.3.
// Reference model for large-cargo pre-sale quoting. J&T Cargo's official checker uses
// origin, destination, weight and dimensions; this static GitHub Pages app has no live tariff API.
// Cargo volumetric weight uses L*W*H/5000. Rates below are conservative market-reference bands,
// NOT official J&T Cargo tariffs. Final freight must still be confirmed by the logistics company.
const INDO_ZONE = {
  JAKARTA:[3500,50], BANTEN:[4500,50], WEST_JAVA:[5000,50], CENTRAL_JAVA:[6000,50],
  YOGYAKARTA:[6000,50], EAST_JAVA:[6500,50], BALI:[8000,50], ACEH:[10500,100],
  NORTH_SUMATRA:[8500,100], WEST_SUMATRA:[9000,100], RIAU:[9000,100], RIAU_ISLANDS:[11500,100],
  JAMBI:[9000,100], SOUTH_SUMATRA:[8000,100], BANGKA:[10500,100], BENGKULU:[9500,100],
  LAMPUNG:[7000,50], WEST_KALIMANTAN:[12000,100], CENTRAL_KALIMANTAN:[13000,100],
  SOUTH_KALIMANTAN:[12000,100], EAST_KALIMANTAN:[13500,100], NORTH_KALIMANTAN:[16000,100],
  NORTH_SULAWESI:[15500,100], GORONTALO:[16500,100], CENTRAL_SULAWESI:[16000,100],
  WEST_SULAWESI:[16500,100], SOUTH_SULAWESI:[12000,100], SOUTHEAST_SULAWESI:[16500,100],
  WEST_NUSA:[11500,100], EAST_NUSA:[16500,100], MALUKU:[21000,100], NORTH_MALUKU:[22000,100],
  PAPUA:[28000,100], WEST_PAPUA:[26000,100], CENTRAL_PAPUA:[30000,100], REMOTE:[32000,100]
};

function formatIndonesiaSeaInput() {
  const el = document.getElementById("indoSeaRm");
  if (!el) return;
  const value = Math.max(0, cleanNumber(el.value));
  el.value = value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// V6.3: exact 5-digit Indonesia Postcode -> province detection.
// No broad numeric ranges are used. A national postcode dataset is loaded once,
// converted to an exact postcode->province map, then cached on the device.
const POSTCODE_PROVINCE_MAP = {
  "ACEH":"ACEH", "SUMATERA UTARA":"NORTH_SUMATRA", "SUMATERA BARAT":"WEST_SUMATRA",
  "RIAU":"RIAU", "KEPULAUAN RIAU":"RIAU_ISLANDS", "JAMBI":"JAMBI",
  "SUMATERA SELATAN":"SOUTH_SUMATRA", "BENGKULU":"BENGKULU", "LAMPUNG":"LAMPUNG",
  "KEPULAUAN BANGKA BELITUNG":"BANGKA", "BANGKA BELITUNG":"BANGKA",
  "DKI JAKARTA":"JAKARTA", "JAWA BARAT":"WEST_JAVA", "JAWA TENGAH":"CENTRAL_JAVA",
  "DI YOGYAKARTA":"YOGYAKARTA", "DAERAH ISTIMEWA YOGYAKARTA":"YOGYAKARTA",
  "JAWA TIMUR":"EAST_JAVA", "BANTEN":"BANTEN", "BALI":"BALI",
  "NUSA TENGGARA BARAT":"WEST_NUSA", "NUSA TENGGARA TIMUR":"EAST_NUSA",
  "KALIMANTAN BARAT":"WEST_KALIMANTAN", "KALIMANTAN TENGAH":"CENTRAL_KALIMANTAN",
  "KALIMANTAN SELATAN":"SOUTH_KALIMANTAN", "KALIMANTAN TIMUR":"EAST_KALIMANTAN",
  "KALIMANTAN UTARA":"NORTH_KALIMANTAN", "SULAWESI UTARA":"NORTH_SULAWESI",
  "GORONTALO":"GORONTALO", "SULAWESI TENGAH":"CENTRAL_SULAWESI",
  "SULAWESI BARAT":"WEST_SULAWESI", "SULAWESI SELATAN":"SOUTH_SULAWESI",
  "SULAWESI TENGGARA":"SOUTHEAST_SULAWESI", "MALUKU":"MALUKU",
  "MALUKU UTARA":"NORTH_MALUKU", "PAPUA BARAT":"WEST_PAPUA", "PAPUA BARAT DAYA":"WEST_PAPUA",
  "PAPUA":"PAPUA", "PAPUA TENGAH":"CENTRAL_PAPUA", "PAPUA PEGUNUNGAN":"CENTRAL_PAPUA",
  "PAPUA SELATAN":"CENTRAL_PAPUA"
};

const PROVINCE_CODE_MAP = {
  "11":["ACEH","ACEH"], "12":["NORTH_SUMATRA","SUMATERA UTARA"], "13":["WEST_SUMATRA","SUMATERA BARAT"],
  "14":["RIAU","RIAU"], "15":["JAMBI","JAMBI"], "16":["SOUTH_SUMATRA","SUMATERA SELATAN"],
  "17":["BENGKULU","BENGKULU"], "18":["LAMPUNG","LAMPUNG"], "19":["BANGKA","KEPULAUAN BANGKA BELITUNG"],
  "21":["RIAU_ISLANDS","KEPULAUAN RIAU"], "31":["JAKARTA","DKI JAKARTA"], "32":["WEST_JAVA","JAWA BARAT"],
  "33":["CENTRAL_JAVA","JAWA TENGAH"], "34":["YOGYAKARTA","DI YOGYAKARTA"], "35":["EAST_JAVA","JAWA TIMUR"],
  "36":["BANTEN","BANTEN"], "51":["BALI","BALI"], "52":["WEST_NUSA","NUSA TENGGARA BARAT"],
  "53":["EAST_NUSA","NUSA TENGGARA TIMUR"], "61":["WEST_KALIMANTAN","KALIMANTAN BARAT"],
  "62":["CENTRAL_KALIMANTAN","KALIMANTAN TENGAH"], "63":["SOUTH_KALIMANTAN","KALIMANTAN SELATAN"],
  "64":["EAST_KALIMANTAN","KALIMANTAN TIMUR"], "65":["NORTH_KALIMANTAN","KALIMANTAN UTARA"],
  "71":["NORTH_SULAWESI","SULAWESI UTARA"], "72":["CENTRAL_SULAWESI","SULAWESI TENGAH"],
  "73":["SOUTH_SULAWESI","SULAWESI SELATAN"], "74":["SOUTHEAST_SULAWESI","SULAWESI TENGGARA"],
  "75":["GORONTALO","GORONTALO"], "76":["WEST_SULAWESI","SULAWESI BARAT"], "81":["MALUKU","MALUKU"],
  "82":["NORTH_MALUKU","MALUKU UTARA"], "91":["WEST_PAPUA","PAPUA BARAT"], "92":["WEST_PAPUA","PAPUA BARAT DAYA"],
  "94":["PAPUA","PAPUA"], "95":["CENTRAL_PAPUA","PAPUA SELATAN"], "96":["CENTRAL_PAPUA","PAPUA TENGAH"],
  "97":["CENTRAL_PAPUA","PAPUA PEGUNUNGAN"]
};


// V6.3: representative postcode used only when the presenter manually changes region.
// A real customer postcode entered by the user still takes priority and is precisely detected.
const REGION_DEFAULT_POSTCODE = {
  JAKARTA:"10310", BANTEN:"15111", WEST_JAVA:"16110", CENTRAL_JAVA:"50111", YOGYAKARTA:"55111", EAST_JAVA:"60111",
  BALI:"80111", ACEH:"23111", NORTH_SUMATRA:"20111", WEST_SUMATRA:"25111", RIAU:"28111", RIAU_ISLANDS:"29111",
  JAMBI:"36111", SOUTH_SUMATRA:"30111", BANGKA:"33111", BENGKULU:"38111", LAMPUNG:"35111",
  WEST_NUSA:"83111", EAST_NUSA:"85111", WEST_KALIMANTAN:"78111", CENTRAL_KALIMANTAN:"73111", SOUTH_KALIMANTAN:"70111",
  EAST_KALIMANTAN:"75111", NORTH_KALIMANTAN:"77111", NORTH_SULAWESI:"95111", GORONTALO:"96111", CENTRAL_SULAWESI:"94111",
  WEST_SULAWESI:"91511", SOUTH_SULAWESI:"90111", SOUTHEAST_SULAWESI:"93111", MALUKU:"97111", NORTH_MALUKU:"97711",
  PAPUA:"99111", WEST_PAPUA:"98311", CENTRAL_PAPUA:"98811"
};
let provinceChangeFromPostcode = false;

function applyRepresentativePostcodeForRegion() {
  const select=document.getElementById("indoProvince"), input=document.getElementById("indoPostcode"), status=document.getElementById("postcodeStatus");
  if(!select || !input || provinceChangeFromPostcode) return;
  const pc=REGION_DEFAULT_POSTCODE[select.value];
  postcodeLookupToken++;
  if(pc) {
    input.value=pc;
    if(status){ status.textContent=""; status.className="postcode-status"; status.hidden=true; }
  } else {
    input.value="";
    if(status){ status.textContent=""; status.className="postcode-status"; status.hidden=true; }
  }
  calculateIndonesiaShipping();
}

const POSTCODE_DATA_URL = "https://raw.githubusercontent.com/cahyadsn/wilayah_kodepos/main/json/wilayah_kodepos.min.json";
const POSTCODE_CACHE_KEY = "ll_id_postcode_exact_v52";
let exactPostcodeMap = null;
let exactPostcodePromise = null;
let postcodeLookupToken = 0;

function makeExactMapFromDataset(data) {
  const out = Object.create(null);
  const add = (regionCode, postcode) => {
    const pc=String(postcode||"").match(/^\d{5}$/)?.[0];
    const prov=String(regionCode||"").match(/^(\d{2})/)?.[1];
    if(pc && prov && PROVINCE_CODE_MAP[prov]) out[pc]=PROVINCE_CODE_MAP[prov];
  };
  const walk = (v, parentKey="") => {
    if(Array.isArray(v)){ v.forEach(x=>walk(x,parentKey)); return; }
    if(!v || typeof v!=="object") return;
    for(const [k,val] of Object.entries(v)){
      if(typeof val==="string" || typeof val==="number"){
        if(/^\d{2}(?:\.\d{2}){2}\.\d{4}$/.test(k)) add(k,val);
      } else walk(val,k);
    }
    const region=v.kode || v.code || v.village_code || v.villageCode || parentKey;
    const pc=v.kodepos || v.postal_code || v.postalCode || v.zip_code || v.zipCode;
    if(region && pc) add(region,pc);
  };
  walk(data);
  return out;
}

async function loadExactPostcodeMap(){
  if(exactPostcodeMap) return exactPostcodeMap;
  if(exactPostcodePromise) return exactPostcodePromise;
  exactPostcodePromise=(async()=>{
    try{
      const cached=localStorage.getItem(POSTCODE_CACHE_KEY);
      if(cached){ exactPostcodeMap=JSON.parse(cached); return exactPostcodeMap; }
    }catch(e){}
    try{
      const res=await fetch(POSTCODE_DATA_URL,{cache:"force-cache"});
      if(!res.ok) throw new Error("dataset failed");
      const map=makeExactMapFromDataset(await res.json());
      if(Object.keys(map).length<1000) throw new Error("dataset invalid");
      exactPostcodeMap=map;
      try{ localStorage.setItem(POSTCODE_CACHE_KEY,JSON.stringify(map)); }catch(e){}
      return map;
    }catch(e){ return null; }
  })();
  return exactPostcodePromise;
}

function findProvinceName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) { for (const item of value) { const found=findProvinceName(item); if(found) return found; } return ""; }
  if (typeof value === "object") {
    for (const key of ["province_name","provinceName","province","provinsi","province_label"]) {
      if (value[key]) { if (typeof value[key] === "string") return value[key]; const nested=findProvinceName(value[key]); if(nested) return nested; }
    }
    for (const key of ["data","results","items","postal_codes","postalCodes"]) { if (value[key]) { const nested=findProvinceName(value[key]); if(nested) return nested; } }
  }
  return "";
}

async function autoDetectProvinceFromPostcode() {
  const input=document.getElementById("indoPostcode"), select=document.getElementById("indoProvince"), status=document.getElementById("postcodeStatus");
  if(!input || !select) return;
  const pc=input.value.replace(/\D/g,"").slice(0,5); input.value=pc;
  const token=++postcodeLookupToken;
  if(pc.length!==5){ if(status){status.textContent=""; status.className="postcode-status"; status.hidden=true;} return; }
  if(status){status.textContent=""; status.className="postcode-status"; status.hidden=true;}

  const map=await loadExactPostcodeMap();
  if(token!==postcodeLookupToken) return;
  const exact=map && map[pc];
  if(exact && Array.from(select.options).some(o=>o.value===exact[0])){
    provinceChangeFromPostcode=true; select.value=exact[0]; provinceChangeFromPostcode=false;
    if(status){status.textContent=""; status.className="postcode-status"; status.hidden=true;}
    calculateIndonesiaShipping(); return;
  }

  // Exact online fallback. Never guess a province from a broad postcode number range.
  try {
    const res=await fetch("https://carikodepos.id/api/postal-codes?search="+encodeURIComponent(pc)+"&limit=10", {cache:"no-store"});
    if(!res.ok) throw new Error("lookup failed");
    const provinceName=findProvinceName(await res.json()).trim().toUpperCase();
    if(token!==postcodeLookupToken) return;
    const key=POSTCODE_PROVINCE_MAP[provinceName];
    if(key && Array.from(select.options).some(o=>o.value===key)){
      provinceChangeFromPostcode=true; select.value=key; provinceChangeFromPostcode=false;
      if(status){status.textContent=""; status.className="postcode-status"; status.hidden=true;}
      calculateIndonesiaShipping();
    } else if(status){ status.hidden=false; status.textContent="未找到精确资料，请手动选择地区 / Pilih kawasan"; status.className="postcode-status warning"; }
  } catch(e) {
    if(token!==postcodeLookupToken) return;
    if(status){status.hidden=false; status.textContent="未找到精确资料，请手动选择地区 / Pilih kawasan"; status.className="postcode-status warning";}
  }
}

function calculateIndonesiaShipping() {
  const sec = indonesiaShippingEl;
  if (!sec) return;
  const get = function(id){ return document.getElementById(id); };
  const sea = Math.max(0, cleanNumber(get("indoSeaRm").value));
  const l = Math.max(1, cleanNumber(get("indoL").value));
  const w = Math.max(1, cleanNumber(get("indoW").value));
  const h = Math.max(1, cleanNumber(get("indoH").value));
  const kg = Math.max(0.1, cleanNumber(get("indoKg").value));
  const province = get("indoProvince").value;
  const postcode = get("indoPostcode").value.replace(/\D/g, "").slice(0,5);
  if (get("indoPostcode").value !== postcode) get("indoPostcode").value = postcode;

  const volKg = (l * w * h) / 5000;
  const chargeKg = Math.max(kg, volKg);
  const z = INDO_ZONE[province] || INDO_ZONE.REMOTE;
  const billKg = Math.max(chargeKg, z[1]);
  let inlandIdr = z[0] * billKg;

  // V6.3: region-based commercial safety buffer for pre-sale quotes.
  // This buffer is NOT an official tax/fee. It protects against inland cargo price variation,
  // handling and other possible surcharges before the logistics company confirms the final charge.
  const BUFFER_15 = new Set(["JAKARTA","BANTEN","WEST_JAVA","CENTRAL_JAVA","YOGYAKARTA","EAST_JAVA"]);
  const BUFFER_20 = new Set(["NORTH_SUMATRA","WEST_SUMATRA","RIAU","RIAU_ISLANDS","JAMBI","SOUTH_SUMATRA","BANGKA","BENGKULU","LAMPUNG","BALI"]);
  const BUFFER_25 = new Set(["WEST_KALIMANTAN","CENTRAL_KALIMANTAN","SOUTH_KALIMANTAN","EAST_KALIMANTAN","NORTH_KALIMANTAN","NORTH_SULAWESI","GORONTALO","CENTRAL_SULAWESI","WEST_SULAWESI","SOUTH_SULAWESI","SOUTHEAST_SULAWESI","WEST_NUSA","EAST_NUSA"]);
  let safetyBuffer = 0.30; // Aceh, Maluku, Papua and unknown/remote areas
  if (BUFFER_15.has(province)) safetyBuffer = 0.15;
  else if (BUFFER_20.has(province)) safetyBuffer = 0.20;
  else if (BUFFER_25.has(province)) safetyBuffer = 0.25;
  inlandIdr *= (1 + safetyBuffer);

  // Extra protection for unusually tall/oversize cargo.
  const maxSide = Math.max(l,w,h);
  if (maxSide > 120) inlandIdr *= 1.10;
  if (maxSide > 180) inlandIdr *= 1.12;
  inlandIdr = roundUp(inlandIdr, 50000);

  const idrRate = exchangeRates.IDR > 0 ? exchangeRates.IDR : 4389.41;
  const inlandRm = roundUp(inlandIdr / idrRate, 10);
  const totalRm = roundUp(sea + inlandRm, 10);
  const totalIdr = roundUp(totalRm * idrRate, 50000);

  get("indoSeaOut").textContent = formatRM(sea);
  get("indoInlandOut").textContent = formatRM(inlandRm);
  get("indoVolOut").textContent = volKg.toLocaleString("en-MY", {minimumFractionDigits:1, maximumFractionDigits:1}) + " kg";
  get("indoChargeOut").textContent = chargeKg.toLocaleString("en-MY", {minimumFractionDigits:1, maximumFractionDigits:1}) + " kg";
  get("indoTotalIdr").textContent = formatIDR(totalIdr);
  get("indoTotalRm").textContent = "约 " + formatRM(totalRm) + " / Anggaran " + formatRM(totalRm);

  const note = get("indoNote");
  const pc = postcode.length === 5 ? " Postcode <strong>" + postcode + "</strong> 已记录。" : "";
  note.innerHTML = "J&T Cargo 市场参考估算，不是 J&T 官方实时报价。" + pc + " 实际收费以物流公司确认为准。<br>Anggaran rujukan pasaran J&T Cargo, bukan kadar rasmi masa nyata. Caj sebenar tertakluk kepada pengesahan syarikat logistik.";
}

// Taiwan freight estimate V6.3. 3-digit district prefixes are sufficient for city/county routing.
const TW_PREFIX = {"100":"TAIPEI","103":"TAIPEI","104":"TAIPEI","105":"TAIPEI","106":"TAIPEI","108":"TAIPEI","110":"TAIPEI","111":"TAIPEI","112":"TAIPEI","114":"TAIPEI","115":"TAIPEI","116":"TAIPEI","200":"KEELUNG","201":"KEELUNG","202":"KEELUNG","203":"KEELUNG","204":"KEELUNG","205":"KEELUNG","206":"KEELUNG","207":"NEW_TAIPEI","208":"NEW_TAIPEI","220":"NEW_TAIPEI","221":"NEW_TAIPEI","222":"NEW_TAIPEI","223":"NEW_TAIPEI","224":"NEW_TAIPEI","226":"NEW_TAIPEI","231":"NEW_TAIPEI","232":"NEW_TAIPEI","233":"NEW_TAIPEI","234":"NEW_TAIPEI","235":"NEW_TAIPEI","236":"NEW_TAIPEI","237":"NEW_TAIPEI","238":"NEW_TAIPEI","239":"NEW_TAIPEI","241":"NEW_TAIPEI","242":"NEW_TAIPEI","243":"NEW_TAIPEI","244":"NEW_TAIPEI","247":"NEW_TAIPEI","248":"NEW_TAIPEI","249":"NEW_TAIPEI","260":"YILAN","300":"HSINCHU","302":"HSINCHU","320":"TAOYUAN","330":"TAOYUAN","350":"MIAOLI","400":"TAICHUNG","500":"CHANGHUA","540":"NANTOU","600":"CHIAYI","630":"YUNLIN","700":"TAINAN","800":"KAOHSIUNG","900":"PINGTUNG","950":"TAITUNG","970":"HUALIEN"};
const TW_DEFAULT_PC={KAOHSIUNG:"800",TAINAN:"700",CHIAYI:"600",YUNLIN:"630",CHANGHUA:"500",TAICHUNG:"400",NANTOU:"540",MIAOLI:"350",HSINCHU:"300",TAOYUAN:"330",NEW_TAIPEI:"220",TAIPEI:"100",KEELUNG:"200",YILAN:"260",HUALIEN:"970",TAITUNG:"950",PINGTUNG:"900",ISLANDS:"880"};
// Planning rates in TWD/kg and minimum chargeable kg; conservative commercial estimates, not carrier tariffs.
const TW_ZONE={KAOHSIUNG:[12,50],TAINAN:[14,50],CHIAYI:[16,50],YUNLIN:[17,50],CHANGHUA:[18,50],TAICHUNG:[19,50],NANTOU:[22,50],MIAOLI:[21,50],HSINCHU:[22,50],TAOYUAN:[23,50],NEW_TAIPEI:[25,50],TAIPEI:[25,50],KEELUNG:[27,50],YILAN:[28,50],HUALIEN:[32,50],TAITUNG:[34,50],PINGTUNG:[16,50],ISLANDS:[45,100]};
function formatTWD(v){return "NT$"+Math.round(v).toLocaleString("en-US");}
function calculateTaiwanShipping(){
  if(!taiwanShippingEl)return; const g=id=>document.getElementById(id);
  const sea=Math.max(0,cleanNumber(g("twSeaRm").value)), l=Math.max(1,cleanNumber(g("twL").value)), w=Math.max(1,cleanNumber(g("twW").value)), h=Math.max(1,cleanNumber(g("twH").value)), kg=Math.max(.1,cleanNumber(g("twKg").value));
  const region=g("twRegion").value, vol=(l*w*h)/5000, charge=Math.max(kg,vol), z=TW_ZONE[region]||TW_ZONE.ISLANDS, bill=Math.max(charge,z[1]);
  const base=z[0]*bill; const taxReserve=base*.05; const insuranceHandling=base*.02; let regional=.10; if(["YILAN","HUALIEN","TAITUNG"].includes(region))regional=.15; if(region==="ISLANDS")regional=.25;
  let inlandTwd=base+taxReserve+insuranceHandling+(base*regional); const maxSide=Math.max(l,w,h); if(maxSide>120)inlandTwd*=1.10;if(maxSide>180)inlandTwd*=1.12; inlandTwd=roundUp(inlandTwd,100);
  const feesTwd=roundUp(taxReserve+insuranceHandling+(base*regional),100), rate=exchangeRates.TWD>0?exchangeRates.TWD:7.85, inlandRm=roundUp(inlandTwd/rate,10), totalRm=roundUp(sea+inlandRm,10), totalTwd=roundUp(totalRm*rate,100);
  g("twSeaOut").textContent=formatRM(sea);g("twInlandOut").textContent=formatRM(inlandRm);g("twFeesOut").textContent=formatTWD(feesTwd);g("twChargeOut").textContent=charge.toLocaleString("en-MY",{minimumFractionDigits:1,maximumFractionDigits:1})+" kg";g("twTotalTwd").textContent=formatTWD(totalTwd);g("twTotalRm").textContent="约 "+formatRM(totalRm)+" / Approx. "+formatRM(totalRm);
}
function syncTaiwanPostcode(){const i=document.getElementById("twPostcode"),s=document.getElementById("twRegion");if(!i||!s)return;let v=i.value.replace(/\D/g,"").slice(0,6);i.value=v;if(v.length>=3&&TW_PREFIX[v.slice(0,3)])s.value=TW_PREFIX[v.slice(0,3)];calculateTaiwanShipping();}
function setTaiwanDefaultPostcode(){const i=document.getElementById("twPostcode"),s=document.getElementById("twRegion");if(i&&s)i.value=TW_DEFAULT_PC[s.value]||"";calculateTaiwanShipping();}


if (productIdInput) {
  productIdInput.addEventListener("focus", function () {
    this.select();
    loadProductPricing(false).then(function () {
      if (productIdInput.value.trim()) renderProductMatches(productIdInput.value);
    }).catch(function () {});
  });
  productIdInput.addEventListener("click", function () { this.select(); });
  productIdInput.addEventListener("input", function () {
    handleProductIdInput();
  });
  productIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleProductIdInput();
      this.blur();
    }
  });
}
if (clearProductBtn) {
  clearProductBtn.addEventListener("click", function () {
    if (productIdInput) productIdInput.value = "";
    closeProductDropdown();
    setProductMode(null);
    retailInput.value = "";
    livePriceEl.readOnly = false;
    livePriceEl.classList.remove("auto-live");
    livePriceEl.value = "";
    calculate();
    if (productIdInput) productIdInput.focus();
  });
}
document.addEventListener("click", function (event) {
  if (!productDropdownEl || productDropdownEl.hidden) return;
  if (event.target === productIdInput || (productDropdownEl && productDropdownEl.contains(event.target))) return;
  closeProductDropdown();
});

function switchToManualRetailMode() {
  if (!selectedProduct) return;
  selectedProduct = null;
  document.body.classList.remove("product-mode");
  retailInput.readOnly = false;
  if (productIdInput) productIdInput.value = "";
  if (productNameEl) { productNameEl.innerHTML = ""; productNameEl.hidden = true; }
  closeProductDropdown();
  livePriceEl.readOnly = false;
  livePriceEl.classList.remove("auto-live");
}

retailInput.addEventListener("pointerdown", function () {
  if (selectedProduct) switchToManualRetailMode();
});
retailInput.addEventListener("focus", function () {
  if (selectedProduct) switchToManualRetailMode();
  retailInput.select();
});
retailInput.addEventListener("blur", function () {
  if (retailInput.value.trim() === "" || cleanNumber(retailInput.value) <= 0) retailInput.value = "";
  else retailInput.value = cleanNumber(retailInput.value).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  calculate();
});
retailInput.addEventListener("input", calculate);
retailInput.addEventListener("keydown", function (event) { if (event.key === "Enter") retailInput.blur(); });

livePriceEl.addEventListener("focus", function () { if (!livePriceEl.readOnly) livePriceEl.select(); });
livePriceEl.addEventListener("input", function () { if (!livePriceEl.readOnly) calculate(); });
livePriceEl.addEventListener("blur", function () {
  if (!livePriceEl.readOnly) {
    const value = getManualLivePrice();
    livePriceEl.value = value > 0 ? value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
    calculate();
  }
});
livePriceEl.addEventListener("keydown", function (event) { if (event.key === "Enter") livePriceEl.blur(); });

currencySelect.addEventListener("change", calculate);

document.querySelectorAll("#taiwanShipping input, #taiwanShipping select").forEach(function(el){el.addEventListener("input",calculateTaiwanShipping);el.addEventListener("change",calculateTaiwanShipping);});
const twPostcodeInput=document.getElementById("twPostcode");if(twPostcodeInput){twPostcodeInput.addEventListener("focus",function(){this.select();});twPostcodeInput.addEventListener("click",function(){this.select();});twPostcodeInput.addEventListener("input",syncTaiwanPostcode);}
const twRegionSelect=document.getElementById("twRegion");if(twRegionSelect)twRegionSelect.addEventListener("change",setTaiwanDefaultPostcode);
const twSeaRmInput=document.getElementById("twSeaRm");if(twSeaRmInput){twSeaRmInput.addEventListener("focus",function(){this.select();});twSeaRmInput.addEventListener("blur",function(){this.value=cleanNumber(this.value).toFixed(2);calculateTaiwanShipping();});}

document.querySelectorAll("#indonesiaShipping input, #indonesiaShipping select").forEach(function (el) {
  el.addEventListener("input", calculateIndonesiaShipping);
  el.addEventListener("change", calculateIndonesiaShipping);
});

const indoPostcodeInput = document.getElementById("indoPostcode");
if (indoPostcodeInput) {
  // V6.3: tap/focus selects the whole postcode for one-step replace/delete.
  indoPostcodeInput.addEventListener("focus", function () { this.select(); });
  indoPostcodeInput.addEventListener("click", function () { this.select(); });
  indoPostcodeInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 5);
    if (this.value.length === 5) autoDetectProvinceFromPostcode();
    else { postcodeLookupToken++; const s=document.getElementById("postcodeStatus"); if(s){s.textContent=""; s.className="postcode-status"; s.hidden=true;} }
  });
}

const indoProvinceSelect = document.getElementById("indoProvince");
if (indoProvinceSelect) indoProvinceSelect.addEventListener("change", applyRepresentativePostcodeForRegion);

const indoSeaRmInput = document.getElementById("indoSeaRm");
if (indoSeaRmInput) {
  indoSeaRmInput.addEventListener("focus", function () { this.select(); });
  indoSeaRmInput.addEventListener("blur", function () { formatIndonesiaSeaInput(); calculateIndonesiaShipping(); });
  formatIndonesiaSeaInput();
}

clearBtn.addEventListener("click", function () {
  if (productIdInput) productIdInput.value = "";
  closeProductDropdown();
  setProductMode(null);
  retailInput.value = "";
  livePriceEl.readOnly = false;
  livePriceEl.classList.remove("auto-live");
  livePriceEl.value = "";
  retailInput.focus();
  calculate();
});

function resetCalculator() {
  if (productIdInput) productIdInput.value = "";
  closeProductDropdown();
  setProductMode(null);
  retailInput.value = "";
  livePriceEl.readOnly = false;
  livePriceEl.classList.remove("auto-live");
  livePriceEl.value = "";
  calculate();
}

async function clearLegacyPwaCache() {
  let hadController = false;
  try {
    if ("serviceWorker" in navigator) {
      hadController = Boolean(navigator.serviceWorker.controller);
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(function (registration) { return registration.unregister(); }));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));
    }
  } catch (error) {}

  if (hadController) {
    try {
      const reloadKey = "loverLegendPwaCleanupV35";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        location.reload();
        return true;
      }
    } catch (error) {}
  }
  return false;
}

function enablePullToRefresh() {
  if (!pullRefreshEl) return;
  let startY = 0;
  let pullDistance = 0;
  let tracking = false;
  const triggerDistance = 75;
  function pageIsAtTop() { return window.scrollY <= 0 && document.documentElement.scrollTop <= 0; }

  document.addEventListener("touchstart", function (event) {
    if (!pageIsAtTop() || event.touches.length !== 1) { tracking = false; return; }
    startY = event.touches[0].clientY;
    pullDistance = 0;
    tracking = true;
    pullRefreshEl.classList.remove("ready");
  }, { passive: true });

  document.addEventListener("touchmove", function (event) {
    if (!tracking || event.touches.length !== 1) return;
    const currentY = event.touches[0].clientY;
    const delta = currentY - startY;
    if (delta <= 0 || !pageIsAtTop()) {
      pullDistance = 0;
      pullRefreshEl.classList.remove("show", "ready");
      return;
    }
    pullDistance = Math.min(delta * 0.55, 95);
    pullRefreshEl.style.transform = "translate(-50%, " + Math.max(0, pullDistance - 42) + "px)";
    pullRefreshEl.classList.add("show");
    if (pullDistance >= triggerDistance) {
      pullRefreshEl.textContent = "↑ 放开刷新 / Lepas untuk Refresh";
      pullRefreshEl.classList.add("ready");
    } else {
      pullRefreshEl.textContent = "↓ 下拉刷新 / Tarik untuk Refresh";
      pullRefreshEl.classList.remove("ready");
    }
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (!tracking) return;
    tracking = false;
    if (pullDistance >= triggerDistance) {
      pullRefreshEl.textContent = "刷新中... / Refreshing...";
      pullRefreshEl.classList.add("show", "refreshing");
      setTimeout(function () { location.reload(); }, 120);
      return;
    }
    pullDistance = 0;
    pullRefreshEl.classList.remove("show", "ready");
    pullRefreshEl.style.transform = "translate(-50%, -48px)";
  }, { passive: true });

  document.addEventListener("touchcancel", function () {
    tracking = false;
    pullDistance = 0;
    pullRefreshEl.classList.remove("show", "ready");
    pullRefreshEl.style.transform = "translate(-50%, -48px)";
  }, { passive: true });
}

function isEmbeddedInPricingSuiteV104() {
  try { return window.self !== window.top; }
  catch (error) { return true; }
}

async function startCalculator() {
  // V10.4 integration only: V6.3 keeps all pricing/search/layout logic unchanged.
  // When embedded, the parent owns pull-to-refresh so one gesture refreshes only once.
  if (!isEmbeddedInPricingSuiteV104()) {
    const reloading = await clearLegacyPwaCache();
    if (reloading) return;
    enablePullToRefresh();
  }
  resetCurrencyToDefault();
  resetCalculator();
  loadExchangeRates();
  // V6.3: hydrate last successful safe product pricing immediately, then refresh cloud data in background.
  hydrateProductPricingCache();
  setTimeout(function () { loadProductPricing(true).catch(function () {}); }, 50);
}

startCalculator();

// Browser back/forward keeps the current currency and Indonesia inputs.
// A real refresh reloads the page and returns the default currency to MYR.
window.addEventListener("pageshow", function () {
  calculate();
});
