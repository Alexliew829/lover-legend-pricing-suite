// Lover Legend Bonsai Price Calculator V3.4
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
  currencySelect.value = "IDR";
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
  return (
    "RM" +
    Number(value).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

function getLivePrice(retail) {
  if (retail <= 500) {
    return retail;
  }
  return roundDown100(retail * 0.92);
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
  if (value <= 0) {
    if (currency === "IDR") return "0 jt";
    if (currency === "TWD") return "NT$0";
    return "US$0";
  }

  if (currency === "IDR") {
    return formatIDRCompact(value);
  }

  if (currency === "TWD") {
    const rounded = roundUp(value, 100);
    return "NT$" + rounded.toLocaleString("en-US", {
      maximumFractionDigits: 0
    });
  }

  const rounded = roundUp(value, 1);
  return "US$" + rounded.toLocaleString("en-US", {
    maximumFractionDigits: 0
  });
}

function updateForeignPrice(livePrice) {
  const currency = currencySelect.value;
  const rate = exchangeRates[currency];

  // Export quote rule kept in the calculation only:
  // live price + RM200 certificate, with 3% payment/exchange buffer.
  const protectedMYR = livePrice > 0
    ? (livePrice + EXPORT_CERT_RM) / (1 - PAYMENT_BUFFER)
    : 0;

  const converted = protectedMYR * rate;
  foreignPriceEl.textContent = formatForeignPrice(currency, converted);
  rateLineEl.textContent = formatRate(currency, rate);
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
  const tiktokPrice = retail * 0.82;
  const livePrice = retailMode ? getLivePrice(retail) : getManualLivePrice();

  setLiveInputMode(retailMode, livePrice);

  const sameRackDiscount = livePrice >= 500 ? "-RM30.00" : "-";

  let pickupDiscount;
  if (livePrice >= 2000) {
    pickupDiscount = 100;
  } else if (livePrice >= 500) {
    pickupDiscount = 50;
  } else {
    pickupDiscount = 20;
  }

  const pickupPrice = livePrice > 0 ? Math.max(0, livePrice - pickupDiscount) : 0;
  const minimumPrice = livePrice <= 0
    ? 0
    : (retailMode && retail <= 500)
      ? roundToNearest10(retail * 0.9)
      : (!retailMode && livePrice <= 500)
        ? roundToNearest10(livePrice * 0.9)
        : roundToNearest50(livePrice * 0.85);

  sameRackPriceEl.textContent = sameRackDiscount;
  pickupPriceEl.textContent = formatRM(pickupPrice);
  minimumPriceEl.textContent = formatRM(minimumPrice);
  tiktokPriceEl.textContent = retailMode ? "(" + formatRM(tiktokPrice) + ")" : "";
  updateForeignPrice(livePrice);
}

async function loadExchangeRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/MYR", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Rate request failed");
    }

    const data = await response.json();

    if (
      data &&
      data.rates &&
      Number(data.rates.IDR) > 0 &&
      Number(data.rates.TWD) > 0 &&
      Number(data.rates.USD) > 0
    ) {
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

retailInput.addEventListener("focus", function () {
  retailInput.select();
});

retailInput.addEventListener("blur", function () {
  if (retailInput.value.trim() === "" || cleanNumber(retailInput.value) <= 0) {
    retailInput.value = "";
  } else {
    const value = cleanNumber(retailInput.value);
    retailInput.value = value.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  calculate();
});

retailInput.addEventListener("input", calculate);

retailInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    retailInput.blur();
  }
});

livePriceEl.addEventListener("focus", function () {
  if (!livePriceEl.readOnly) livePriceEl.select();
});

livePriceEl.addEventListener("input", function () {
  if (!livePriceEl.readOnly) calculate();
});

livePriceEl.addEventListener("blur", function () {
  if (!livePriceEl.readOnly) {
    const value = getManualLivePrice();
    livePriceEl.value = value > 0
      ? value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
    calculate();
  }
});

livePriceEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter") livePriceEl.blur();
});

currencySelect.addEventListener("change", function () {
  calculate();
});

clearBtn.addEventListener("click", function () {
  retailInput.value = "";
  livePriceEl.readOnly = false;
  livePriceEl.classList.remove("auto-live");
  livePriceEl.value = "";
  retailInput.focus();
  calculate();
});

function resetCalculator() {
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
      await Promise.all(registrations.map(function (registration) {
        return registration.unregister();
      }));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) {
        return caches.delete(key);
      }));
    }
  } catch (error) {
    // Cleanup failure must never stop the calculator from loading.
  }

  // If this page was opened under an older service worker, reload once after
  // unregistering it so the Home Screen app is immediately released from it.
  if (hadController) {
    try {
      const reloadKey = "loverLegendPwaCleanupV31";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        location.reload();
        return true;
      }
    } catch (error) {
      // Ignore sessionStorage errors.
    }
  }

  return false;
}

function enablePullToRefresh() {
  if (!pullRefreshEl) return;

  let startY = 0;
  let pullDistance = 0;
  let tracking = false;
  const triggerDistance = 75;

  function pageIsAtTop() {
    return window.scrollY <= 0 && document.documentElement.scrollTop <= 0;
  }

  document.addEventListener("touchstart", function (event) {
    if (!pageIsAtTop() || event.touches.length !== 1) {
      tracking = false;
      return;
    }

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

    // Home Screen mode on iPhone does not provide reliable native pull-to-refresh.
    // Prevent the rubber-band only while our refresh gesture is active.
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (!tracking) return;
    tracking = false;

    if (pullDistance >= triggerDistance) {
      pullRefreshEl.textContent = "刷新中... / Refreshing...";
      pullRefreshEl.classList.add("show", "refreshing");
      setTimeout(function () {
        location.reload();
      }, 120);
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

async function startCalculator() {
  const reloading = await clearLegacyPwaCache();
  if (reloading) return;

  resetCurrencyToDefault();
  resetCalculator();
  loadExchangeRates();
}

enablePullToRefresh();
startCalculator();

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    location.reload();
  } else {
    resetCurrencyToDefault();
    resetCalculator();
    loadExchangeRates();
  }
});
