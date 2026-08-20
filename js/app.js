// js/app.js — Expense & Budget Visualizer

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string} */
const STORAGE_KEY = "ebv_transactions";

/** @type {string[]} */
const VALID_CATEGORIES = ["Food", "Transport", "Fun"];

/**
 * Palet warna per kategori.
 * @type {Object.<string, string>}
 */
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56",
};

// ---------------------------------------------------------------------------
// StorageModule
// ---------------------------------------------------------------------------

function createStorageModule(storage) {
  const TEST_KEY = "__ebv_test__";

  function isAvailable() {
    try {
      storage.setItem(TEST_KEY, "1");
      const val = storage.getItem(TEST_KEY);
      storage.removeItem(TEST_KEY);
      return val === "1";
    } catch {
      return false;
    }
  }

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        storage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed;
    } catch {
      try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return [];
    }
  }

  function save(transactions) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // quota exceeded — biarkan berjalan
    }
  }

  return { isAvailable, load, save };
}

const StorageModule = createStorageModule(
  typeof localStorage !== "undefined" ? localStorage : {}
);

// ---------------------------------------------------------------------------
// ValidatorModule
// ---------------------------------------------------------------------------

function createValidatorModule(validCategories) {
  function isNonEmpty(str) {
    return typeof str === "string" && str.trim().length > 0;
  }

  function isPositiveNumber(val) {
    const parsed = parseFloat(val);
    return isFinite(parsed) && parsed > 0;
  }

  function isValidCategory(cat) {
    return validCategories.includes(cat);
  }

  function validate(itemName, amount, category) {
    const errors = {};
    if (!isNonEmpty(itemName))       errors.itemName  = "Nama item tidak boleh kosong.";
    if (!isPositiveNumber(amount))   errors.amount    = "Jumlah harus berupa angka positif lebih dari nol.";
    if (!isValidCategory(category))  errors.category  = "Pilih kategori yang valid (Food, Transport, atau Fun).";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  return { isNonEmpty, isPositiveNumber, isValidCategory, validate };
}

const ValidatorModule = createValidatorModule(VALID_CATEGORIES);

// ---------------------------------------------------------------------------
// StateModule
// ---------------------------------------------------------------------------

function createStateModule() {
  let transactions = [];

  function init(data) {
    transactions = Array.isArray(data) ? data : [];
  }

  function getAll() {
    return [...transactions];
  }

  function addTransaction(t) {
    transactions.push(t);
  }

  function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
  }

  function getTotalBalance() {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  function getCategoryTotals() {
    return transactions.reduce(
      (totals, t) => {
        if (t.category in totals) totals[t.category] += t.amount;
        return totals;
      },
      { Food: 0, Transport: 0, Fun: 0 }
    );
  }

  return { init, getAll, addTransaction, removeTransaction, getTotalBalance, getCategoryTotals };
}

const StateModule = createStateModule();

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// RenderModule
// ---------------------------------------------------------------------------

const RenderModule = (function () {
  let chartInstance = null;

  function formatCurrency(amount) {
    return "Rp " + amount.toLocaleString("id-ID");
  }

  function renderBalance(total) {
    const el = document.getElementById("balance-amount");
    if (el) el.textContent = total > 0 ? formatCurrency(total) : "Rp 0";
  }

  function renderList(transactions) {
    const ul       = document.getElementById("transaction-list");
    const emptyMsg = document.getElementById("list-empty-msg");
    if (!ul) return;

    ul.innerHTML = "";

    if (transactions.length === 0) {
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }

    if (emptyMsg) emptyMsg.hidden = true;

    transactions.forEach(function (t) {
      const li         = document.createElement("li");
      const badgeClass = "category-badge category-badge--" + t.category.toLowerCase();

      li.innerHTML =
        '<div class="transaction-item-info">' +
          '<span class="transaction-item-name">' + escapeHtml(t.itemName) + "</span>" +
          '<span class="transaction-item-meta">' +
            '<span class="' + badgeClass + '">' + escapeHtml(t.category) + "</span>" +
          "</span>" +
        "</div>" +
        '<span class="transaction-item-amount">' + formatCurrency(t.amount) + "</span>" +
        '<button class="btn-delete" data-id="' + escapeHtml(t.id) + '" ' +
          'aria-label="Hapus ' + escapeHtml(t.itemName) + '">Hapus</button>';

      ul.appendChild(li);
    });
  }

  function renderChart(categoryTotals) {
    const emptyMsg = document.getElementById("chart-empty-msg");
    const canvas   = document.getElementById("expense-chart");

    const labels     = Object.keys(categoryTotals).filter(k => categoryTotals[k] > 0);
    const dataValues = labels.map(k => categoryTotals[k]);
    const colors     = labels.map(k => CATEGORY_COLORS[k]);
    const isEmpty    = dataValues.length === 0;

    if (emptyMsg) emptyMsg.hidden = !isEmpty;
    if (canvas)   canvas.hidden   = isEmpty;

    if (isEmpty) {
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
      return;
    }

    if (typeof Chart === "undefined") return;

    if (chartInstance) {
      chartInstance.data.labels                      = labels;
      chartInstance.data.datasets[0].data            = dataValues;
      chartInstance.data.datasets[0].backgroundColor = colors;
      chartInstance.update();
    } else {
      const ctx = canvas.getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [{
            data:            dataValues,
            backgroundColor: colors,
            borderColor:     "#ffffff",
            borderWidth:     2,
            hoverOffset:     8,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { padding: 16, font: { size: 13 } },
            },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const val   = ctx.parsed;
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct   = ((val / total) * 100).toFixed(1);
                  return " Rp " + val.toLocaleString("id-ID") + " (" + pct + "%)";
                },
              },
            },
          },
        },
      });
    }
  }

  function renderAll() {
    renderBalance(StateModule.getTotalBalance());
    renderList(StateModule.getAll());
    renderChart(StateModule.getCategoryTotals());
  }

  return { formatCurrency, renderBalance, renderList, renderChart, renderAll };
})();

// ---------------------------------------------------------------------------
// EventModule
// ---------------------------------------------------------------------------

const EventModule = (function () {
  function onFormSubmit(event) {
    event.preventDefault();

    const form     = event.target;
    const itemName = document.getElementById("item-name").value;
    const amount   = document.getElementById("amount").value;
    const category = document.getElementById("category").value;

    const result = ValidatorModule.validate(itemName, amount, category);

    document.getElementById("error-item-name").textContent = "";
    document.getElementById("error-amount").textContent    = "";
    document.getElementById("error-category").textContent  = "";

    if (!result.valid) {
      if (result.errors.itemName)  document.getElementById("error-item-name").textContent = result.errors.itemName;
      if (result.errors.amount)    document.getElementById("error-amount").textContent    = result.errors.amount;
      if (result.errors.category)  document.getElementById("error-category").textContent  = result.errors.category;
      return;
    }

    const transaction = {
      id:        (typeof crypto !== "undefined" && crypto.randomUUID)
                   ? crypto.randomUUID()
                   : Date.now().toString(),
      itemName:  itemName.trim(),
      amount:    parseFloat(amount),
      category,
      createdAt: new Date().toISOString(),
    };

    StateModule.addTransaction(transaction);
    StorageModule.save(StateModule.getAll());
    RenderModule.renderAll();
    form.reset();
  }

  function onDeleteClick(event) {
    const target = event.target;
    if (!target.classList.contains("btn-delete")) return;

    const id = target.dataset.id;
    if (!id) return;

    StateModule.removeTransaction(id);
    StorageModule.save(StateModule.getAll());
    RenderModule.renderAll();
  }

  function bindAll() {
    const form = document.getElementById("transaction-form");
    const list = document.getElementById("transaction-list");
    if (form) form.addEventListener("submit", onFormSubmit);
    if (list) list.addEventListener("click", onDeleteClick);
  }

  return { bindAll };
})();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const App = (function () {
  function showStorageWarning() {
    const main    = document.querySelector("main");
    const warning = document.createElement("p");
    warning.className   = "storage-warning";
    warning.textContent = "Peringatan: Local Storage tidak tersedia. Data tidak akan tersimpan secara permanen.";
    if (main) main.insertAdjacentElement("beforebegin", warning);
  }

  function showChartUnavailable() {
    const container = document.getElementById("chart-container");
    if (!container) return;
    container.innerHTML =
      '<p class="chart-unavailable">Grafik tidak tersedia karena Chart.js gagal dimuat. Pastikan koneksi internet aktif.</p>';
  }

  function init() {
    // Deteksi CDN Chart.js gagal
    const chartScript = document.querySelector('script[src*="chart.js"]');
    if (chartScript) chartScript.addEventListener("error", showChartUnavailable);

    window.addEventListener("load", function () {
      if (typeof Chart === "undefined") showChartUnavailable();
    });

    let data = [];

    if (!StorageModule.isAvailable()) {
      showStorageWarning();
    } else {
      data = StorageModule.load();
    }

    StateModule.init(data);
    RenderModule.renderAll();
    EventModule.bindAll();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
