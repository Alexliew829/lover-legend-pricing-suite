const retailInput = document.getElementById("retailPrice");
const clearBtn = document.getElementById("clearBtn"); 

const livePriceEl = document.getElementById("livePrice");
const sameRackPriceEl = document.getElementById("sameRackPrice");
const pickupPriceEl = document.getElementById("pickupPrice");
const minimumPriceEl = document.getElementById("minimumPrice");

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

function calculate() {
  const retail = cleanNumber(retailInput.value);
  const livePrice = getLivePrice(retail);

  const sameRackDiscount = livePrice >= 500 ? "-RM50.00" : "-";

  let pickupDiscount;

  if (livePrice >= 2000) {
    pickupDiscount = 100;
  } else if (livePrice >= 500) {
    pickupDiscount = 50;
  } else {
    pickupDiscount = 20;
  }

 const pickupPrice = retail === 0 ? 0 : livePrice - pickupDiscount;
const minimumPrice =
  retail <= 500
    ? roundToNearest10(retail * 0.9)
    : roundToNearest50(livePrice * 0.85);

  livePriceEl.textContent = formatRM(livePrice);
  sameRackPriceEl.textContent = sameRackDiscount;
  pickupPriceEl.textContent = formatRM(pickupPrice);
  minimumPriceEl.textContent = formatRM(minimumPrice);
}

retailInput.addEventListener("focus", function () {
  retailInput.select();
});

retailInput.addEventListener("blur", function () {
  const value = cleanNumber(retailInput.value);
  retailInput.value = value.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

retailInput.addEventListener("input", calculate);

retailInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    retailInput.blur();
  }
});

clearBtn.addEventListener("click", function () {
  retailInput.value = "0.00";
  retailInput.focus();
  calculate();
});

function resetCalculator() {
  retailInput.value = "0.00";
  calculate();
}

resetCalculator();

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    location.reload();
  } else {
    resetCalculator();
  }
});
