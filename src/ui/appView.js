import {
  CATALOG_SORT_OPTIONS,
  CATEGORIES,
  CONDITIONS,
  SALE_STATUS_OPTIONS,
  formatMoney
} from "../domain/collectible.js";
import { summarizeComparables } from "../domain/comparable.js";
import { createLabelViewModel } from "../domain/label.js";
import {
  CURRENCY_OPTIONS,
  THEME_OPTIONS,
  createUserProfile,
  getProfileInitials,
  resolveTheme
} from "../domain/userProfile.js";

export function mountApp({
  root,
  service,
  profileRepository,
  imageReader,
  comparableProvider,
  createBarcodeSvg
}) {
  const state = {
    category: "All",
    editingId: null,
    isProfileOpen: false,
    labelItemIds: [],
    pendingPhotoDataUrl: "",
    priceChartingToken: comparableProvider.getPriceChartingToken?.() || "",
    priceTagItemIds: [],
    printListItemIds: [],
    profile: profileRepository.load(),
    providerEndpoint: comparableProvider.getEndpoint?.() || "",
    scanError: "",
    scanningItemId: "",
    search: "",
    selectedId: null,
    saleListItemIds: [],
    sortBy: "updated-desc",
    toast: ""
  };

  root.addEventListener("click", (event) => handleClick(event, state));
  root.addEventListener("submit", (event) => handleSubmit(event, state));
  root.addEventListener("input", (event) => handleInput(event, state));
  root.addEventListener("change", (event) => handleChange(event, state));
  window.addEventListener("hashchange", () => openItemFromHash(state));

  service.subscribe(() => render(state));
  openItemFromHash(state);

  function render(currentState) {
    applyTheme(currentState.profile.theme);

    const allItems = service.list();
    const filteredItems = service.list(getCatalogQuery(currentState));
    const editingItem = currentState.editingId ? service.getById(currentState.editingId) : null;
    const selectedItem = currentState.selectedId ? service.getById(currentState.selectedId) : null;
    const labelItems = currentState.labelItemIds.map((id) => service.getById(id)).filter(Boolean);
    const priceTagItems = currentState.priceTagItemIds.map((id) => service.getById(id)).filter(Boolean);
    const printListItems = currentState.printListItemIds.map((id) => service.getById(id)).filter(Boolean);
    const saleListItems = currentState.saleListItemIds.map((id) => service.getById(id)).filter(Boolean);
    const yardSaleItems = getYardSaleItems(allItems);

    root.innerHTML = [
      renderHeader(currentState, filteredItems.length),
      renderMain(currentState, allItems, filteredItems, editingItem),
      renderYardSaleWorkbench(yardSaleItems, allItems, currentState),
      renderLabelWorkbench(labelItems),
      renderInventoryPrintWorkbench(printListItems, currentState),
      renderPriceTagWorkbench(priceTagItems, currentState),
      renderYardSalePrintWorkbench(saleListItems, currentState),
      selectedItem ? renderDetailDialog(selectedItem, currentState) : "",
      currentState.isProfileOpen ? renderProfileDialog(currentState.profile) : "",
      currentState.toast ? `<p class="toast" role="status">${escapeHtml(currentState.toast)}</p>` : ""
    ].join("");

    if (selectedItem) {
      const dialog = root.querySelector("#detailDialog");
      dialog.addEventListener("close", () => {
        if (currentState.selectedId) {
          closeDetails(currentState);
        }
      });
      dialog.showModal();
    }

    if (currentState.isProfileOpen) {
      const profileDialog = root.querySelector("#profileDialog");
      profileDialog.addEventListener("close", () => {
        if (currentState.isProfileOpen) {
          closeProfile(currentState);
        }
      });
      profileDialog.showModal();
    }
  }

  function renderHeader(currentState, filteredCount) {
    return `
      <header class="app-header">
        <div>
          <p class="eyebrow">${escapeHtml(currentState.profile.collectionName)}</p>
          <h1>Collectible Catalog</h1>
        </div>
        <div class="header-actions" role="search">
          <label class="search-field">
            <span class="sr-only">Search catalog</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"></path></svg>
            <input name="search" value="${escapeAttribute(currentState.search)}" placeholder="Search by title, code, maker, tag">
          </label>
          <button class="button secondary" type="button" data-action="print-catalog-list">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>
            Print List
          </button>
          <button class="button secondary" type="button" data-action="go-yard-sale">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 7h18M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M6 7l1 14h10l1-14M9 11h6M10 15h4"></path></svg>
            Yard Sale
          </button>
          <button class="button secondary" type="button" data-action="print-filtered-labels">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            Labels
          </button>
          <button class="icon-button" type="button" data-action="toggle-theme" aria-label="Toggle dark mode" title="Toggle dark mode">
            ${currentState.profile.theme === "dark"
              ? `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v2M12 19v2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M3 12h2M19 12h2M5.64 18.36l1.42-1.42M16.94 7.06l1.42-1.42M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path></svg>`
              : `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"></path></svg>`
            }
          </button>
          <button class="profile-button" type="button" data-action="open-profile" aria-label="Open profile settings">
            <span>${escapeHtml(getProfileInitials(currentState.profile))}</span>
            <strong>${escapeHtml(currentState.profile.displayName)}</strong>
          </button>
          <button class="button primary" type="button" data-action="start-new">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
            Add Item
          </button>
        </div>
        <p class="result-count">${filteredCount} shown</p>
      </header>
    `;
  }

  function renderMain(currentState, allItems, filteredItems, editingItem) {
    return `
      <main class="app-shell">
        <aside class="side-panel">
          ${renderStats(allItems)}
          ${renderCategoryFilter(currentState)}
          ${renderSortControl(currentState)}
          <div class="process-note">
            <h2>Clean Workflow</h2>
            <p>Capture, catalog, compare, label. Each record gets a stable code before it ever reaches a shelf or display case.</p>
          </div>
        </aside>
        <section class="entry-panel" aria-labelledby="entryTitle">
          ${renderEntryForm(currentState, editingItem)}
        </section>
        <section class="catalog-panel" aria-labelledby="catalogTitle">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Inventory</p>
              <h2 id="catalogTitle">Catalog Entries</h2>
            </div>
            <button class="text-button" type="button" data-action="export-json">Export JSON</button>
          </div>
          ${renderCatalogGrid(filteredItems)}
        </section>
      </main>
    `;
  }

  function renderSortControl(currentState) {
    const options = CATALOG_SORT_OPTIONS
      .map((option) => `
        <option value="${escapeAttribute(option.value)}" ${option.value === currentState.sortBy ? "selected" : ""}>
          ${escapeHtml(option.label)}
        </option>
      `)
      .join("");

    return `
      <label class="field">
        <span>Sort by</span>
        <select name="sortBy">${options}</select>
      </label>
    `;
  }

  function renderStats(items) {
    const totalValue = items.reduce((sum, item) => sum + (Number(item.estimatedValue) || 0), 0);
    const photoCount = items.filter((item) => item.photoDataUrl).length;
    const currency = state.profile.currency;

    return `
      <section class="stat-grid" aria-label="Catalog summary">
        <article>
          <span>${items.length}</span>
          <p>Items</p>
        </article>
        <article>
          <span>${formatMoney(totalValue, currency)}</span>
          <p>Estimated value</p>
        </article>
        <article>
          <span>${photoCount}</span>
          <p>With photos</p>
        </article>
      </section>
    `;
  }

  function renderCategoryFilter(currentState) {
    const options = ["All", ...CATEGORIES]
      .map((category) => `
        <option value="${escapeAttribute(category)}" ${category === currentState.category ? "selected" : ""}>
          ${escapeHtml(category)}
        </option>
      `)
      .join("");

    return `
      <label class="field">
        <span>Category</span>
        <select name="categoryFilter">${options}</select>
      </label>
    `;
  }

  function renderEntryForm(currentState, editingItem) {
    const photoDataUrl = currentState.pendingPhotoDataUrl || "";
    const title = editingItem ? "Update Entry" : "New Entry";
    const submitLabel = editingItem ? "Save Changes" : "Create Entry";

    return `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Capture</p>
          <h2 id="entryTitle">${title}</h2>
        </div>
        ${editingItem ? `<button class="text-button" type="button" data-action="cancel-edit">Cancel</button>` : ""}
      </div>
      <form class="entry-form" data-role="catalog-form">
        <div class="photo-capture">
          ${photoDataUrl ? `<img src="${escapeAttribute(photoDataUrl)}" alt="Selected collectible preview">` : `<div class="photo-empty">Photo</div>`}
          <label class="button secondary file-button">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h4l2-3h4l2 3h4v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path></svg>
            Capture
            <input name="photo" type="file" accept="image/*" capture="environment">
          </label>
          ${photoDataUrl ? `<button class="icon-button danger" type="button" data-action="remove-photo" aria-label="Remove photo"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>` : ""}
        </div>
        <div class="form-grid">
          ${renderTextField("title", "Title", editingItem?.title || "", "1964 Kennedy half dollar")}
          ${renderSelectField("category", "Category", CATEGORIES, editingItem?.category || currentState.profile.defaultCategory)}
          ${renderTextField("maker", "Maker or brand", editingItem?.maker || "", "Topps, Hasbro, US Mint")}
          ${renderTextField("series", "Series or set", editingItem?.series || "", "Base set, first edition")}
          ${renderSelectField("condition", "Condition", CONDITIONS, editingItem?.condition || "Ungraded")}
          ${renderTextField("acquisitionDate", "Acquired", editingItem?.acquisitionDate || "", "", "date")}
          ${renderTextField("purchasePrice", "Purchase price", editingItem?.purchasePrice || "", "0", "number")}
          ${renderTextField("estimatedValue", "Estimated value", editingItem?.estimatedValue || "", "0", "number")}
        </div>
        ${renderTextField("tags", "Tags", editingItem?.tags?.join(", ") || "", "graded, inherited, display")}
        ${renderSalePlanFields(editingItem)}
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="4" placeholder="Provenance, flaws, storage location, grading details">${escapeHtml(editingItem?.notes || "")}</textarea>
        </label>
        <div class="form-actions">
          <button class="button primary" type="submit">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></svg>
            ${submitLabel}
          </button>
          <button class="button secondary" type="reset" data-action="cancel-edit">Clear</button>
        </div>
      </form>
    `;
  }

  function renderSalePlanFields(editingItem) {
    return `
      <section class="sale-form-section">
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">Yard sale</p>
            <h3>Sale Plan</h3>
          </div>
        </div>
        <div class="form-grid">
          ${renderSelectField("saleStatus", "Plan", SALE_STATUS_OPTIONS, editingItem?.saleStatus || "Keep")}
          ${renderTextField("askingPrice", "Asking price", editingItem?.askingPrice || "", "25", "number")}
          ${renderTextField("lowestPrice", "Private floor price", editingItem?.lowestPrice || "", "15", "number")}
          ${renderTextField("soldPrice", "Sold price", editingItem?.soldPrice || "", "20", "number")}
        </div>
        <label class="field">
          <span>Sale notes</span>
          <textarea name="saleNotes" rows="2" placeholder="Box location, bundle idea, hold request">${escapeHtml(editingItem?.saleNotes || "")}</textarea>
        </label>
      </section>
    `;
  }

  function renderCatalogGrid(items) {
    if (items.length === 0) {
      return `
        <div class="empty-state">
          <h3>No entries yet</h3>
          <p>Add a collectible with a photo and this space becomes your searchable inventory.</p>
        </div>
      `;
    }

    return `
      <div class="catalog-grid">
        ${items.map((item) => renderCatalogCard(item)).join("")}
      </div>
    `;
  }

  function renderCatalogCard(item) {
    return `
      <article class="item-card">
        <button class="image-button" type="button" data-action="view-item" data-id="${escapeAttribute(item.id)}" aria-label="Open ${escapeAttribute(item.title)}">
          ${item.photoDataUrl ? `<img src="${escapeAttribute(item.photoDataUrl)}" alt="${escapeAttribute(item.title)}">` : `<span>${escapeHtml(item.category)}</span>`}
        </button>
        <div class="item-content">
          <div>
            <p class="code">${escapeHtml(item.catalogCode)}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.category)} | ${escapeHtml(item.condition)}</p>
            ${renderSaleBadge(item)}
          </div>
          <div class="item-meta">
            <span>${formatMoney(item.estimatedValue, state.profile.currency)}</span>
            <span>${item.comparables.length} comps</span>
          </div>
          <div class="card-actions">
            <button class="icon-button" type="button" data-action="view-item" data-id="${escapeAttribute(item.id)}" aria-label="View details">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path></svg>
            </button>
            <button class="icon-button" type="button" data-action="edit-item" data-id="${escapeAttribute(item.id)}" aria-label="Edit item">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button class="icon-button" type="button" data-action="print-selected-label" data-id="${escapeAttribute(item.id)}" aria-label="Print item label">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderSaleBadge(item) {
    if (!item.saleStatus || item.saleStatus === "Keep") {
      return "";
    }

    const price = item.saleStatus === "Sold" ? item.soldPrice : item.askingPrice;
    const priceLabel = hasMoney(price) ? ` | ${formatMoney(price, state.profile.currency)}` : "";

    return `<p class="sale-pill ${escapeAttribute(item.saleStatus.toLowerCase())}">${escapeHtml(item.saleStatus)}${escapeHtml(priceLabel)}</p>`;
  }

  function renderDetailDialog(item, currentState) {
    const summary = summarizeComparables(item.comparables);
    const links = comparableProvider.buildLinks(item);

    return `
      <dialog class="detail-dialog" id="detailDialog">
        <div class="dialog-layout">
          <div class="detail-media">
            ${item.photoDataUrl ? `<img src="${escapeAttribute(item.photoDataUrl)}" alt="${escapeAttribute(item.title)}">` : `<div class="photo-empty">No photo</div>`}
          </div>
          <div class="detail-content">
            <div class="dialog-header">
              <div>
                <p class="code">${escapeHtml(item.catalogCode)}</p>
                <h2>${escapeHtml(item.title)}</h2>
                <p>${escapeHtml(item.category)} | ${escapeHtml(item.condition)}</p>
              </div>
              <div class="dialog-actions">
                <button class="icon-button danger" type="button" data-action="delete-item" data-id="${escapeAttribute(item.id)}" aria-label="Delete item">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16"></path></svg>
                </button>
                <button class="icon-button" type="button" data-action="close-dialog" aria-label="Close details">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            <dl class="detail-list">
              <div><dt>Maker</dt><dd>${escapeHtml(item.maker || "Not set")}</dd></div>
              <div><dt>Series</dt><dd>${escapeHtml(item.series || "Not set")}</dd></div>
              <div><dt>Estimated</dt><dd>${formatMoney(item.estimatedValue, currentState.profile.currency)}</dd></div>
              <div><dt>Acquired</dt><dd>${escapeHtml(item.acquisitionDate || "Not set")}</dd></div>
              <div><dt>Sale plan</dt><dd>${escapeHtml(item.saleStatus || "Keep")}</dd></div>
              <div><dt>Asking</dt><dd>${formatMoney(item.askingPrice, currentState.profile.currency)}</dd></div>
              <div><dt>Private floor</dt><dd>${formatMoney(item.lowestPrice, currentState.profile.currency)}</dd></div>
              <div><dt>Sold</dt><dd>${formatMoney(item.soldPrice, currentState.profile.currency)}</dd></div>
            </dl>
            ${item.notes ? `<p class="notes">${escapeHtml(item.notes)}</p>` : ""}
            ${item.saleNotes ? `<p class="notes sale-notes">${escapeHtml(item.saleNotes)}</p>` : ""}
            ${renderComparableSection(item, summary, links, currentState)}
          </div>
        </div>
      </dialog>
    `;
  }

  function renderComparableSection(item, summary, links, currentState) {
    const isScanning = currentState.scanningItemId === item.id;

    return `
      <section class="comparables">
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">Comparable scan</p>
            <h3>Provider Candidates</h3>
          </div>
          <button class="button secondary" type="button" data-action="scan-comparables" data-id="${escapeAttribute(item.id)}" ${isScanning ? "disabled" : ""}>
            ${isScanning ? "Scanning..." : "Auto Scan"}
          </button>
        </div>
        <form class="provider-form" data-role="provider-form">
          <div class="provider-fields">
            <label class="field">
              <span>PriceCharting token</span>
              <input name="priceChartingToken" type="password" value="${escapeAttribute(currentState.priceChartingToken)}" placeholder="40-character API token" autocomplete="off">
            </label>
            <label class="field">
              <span>Approved API endpoint</span>
              <input name="providerEndpoint" type="url" value="${escapeAttribute(currentState.providerEndpoint)}" placeholder="https://api.example.com/comparables">
            </label>
          </div>
          <div class="provider-actions">
            ${renderProviderStatus(currentState)}
            <button class="button secondary" type="submit">Save Providers</button>
          </div>
        </form>
        ${currentState.scanError ? `<p class="error-text">${escapeHtml(currentState.scanError)}</p>` : ""}
        ${renderCandidateList(item)}
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">Manual research</p>
            <h3>Research Links</h3>
          </div>
          <button class="button secondary" type="button" data-action="copy-code" data-code="${escapeAttribute(item.catalogCode)}">Copy Code</button>
        </div>
        <div class="link-strip">
          ${links.map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.name)}</a>`).join("")}
        </div>
        <div class="comp-summary">
          <span>${summary.count} recorded</span>
          <span>${summary.low === null ? "Low not set" : `Low ${formatMoney(summary.low, currentState.profile.currency)}`}</span>
          <span>${summary.average === null ? "Avg not set" : `Avg ${formatMoney(summary.average, currentState.profile.currency)}`}</span>
          <span>${summary.high === null ? "High not set" : `High ${formatMoney(summary.high, currentState.profile.currency)}`}</span>
        </div>
        <form class="comparable-form" data-role="comparable-form" data-item-id="${escapeAttribute(item.id)}">
          ${renderTextField("source", "Source", "", "eBay, auction house, dealer")}
          ${renderTextField("title", "Sale title", "", "Comparable item title")}
          ${renderTextField("price", "Sold price", "", "125", "number")}
          ${renderTextField("soldAt", "Sold date", "", "", "date")}
          ${renderTextField("url", "URL", "", "https://")}
          <label class="field">
            <span>Notes</span>
            <textarea name="notes" rows="2"></textarea>
          </label>
          <button class="button primary" type="submit">Record Comparable</button>
        </form>
        ${renderComparableList(item.comparables)}
      </section>
    `;
  }

  function renderProviderStatus(currentState) {
    const providers = [
      currentState.priceChartingToken ? "PriceCharting on" : "",
      currentState.providerEndpoint ? "Endpoint on" : ""
    ].filter(Boolean);
    const labels = providers.length > 0 ? providers : ["Demo mode"];

    return `
      <div class="provider-status" aria-label="Comparable provider status">
        ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
    `;
  }

  function renderCandidateList(item) {
    const candidates = item.comparableCandidates || [];

    if (candidates.length === 0) {
      return `<p class="muted">No provider candidates yet.</p>`;
    }

    return `
      <ul class="candidate-list">
        ${candidates.map((candidate) => renderCandidate(candidate, item.id)).join("")}
      </ul>
    `;
  }

  function renderCandidate(candidate, itemId) {
    const canReview = candidate.status === "pending";

    return `
      <li class="candidate-card ${escapeAttribute(candidate.status)}">
        <div>
          <strong>${escapeHtml(candidate.title)}</strong>
          <div class="candidate-meta">
            <span>${escapeHtml(candidate.source)}</span>
            <span>${formatMoney(candidate.price, state.profile.currency)}</span>
            <span>${candidate.confidence}% match</span>
            <span class="status-badge">${escapeHtml(candidate.status)}</span>
          </div>
          ${candidate.matchNotes ? `<p>${escapeHtml(candidate.matchNotes)}</p>` : ""}
        </div>
        <div class="candidate-actions">
          ${candidate.url ? `<a href="${escapeAttribute(candidate.url)}" target="_blank" rel="noreferrer">Source</a>` : ""}
          ${canReview ? `
            <button class="button secondary" type="button" data-action="reject-candidate" data-id="${escapeAttribute(itemId)}" data-candidate-id="${escapeAttribute(candidate.id)}">Reject</button>
            <button class="button primary" type="button" data-action="accept-candidate" data-id="${escapeAttribute(itemId)}" data-candidate-id="${escapeAttribute(candidate.id)}">Accept</button>
          ` : ""}
        </div>
      </li>
    `;
  }

  function renderComparableList(comparables) {
    if (comparables.length === 0) {
      return `<p class="muted">No comparable sales recorded yet.</p>`;
    }

    return `
      <ul class="comparable-list">
        ${comparables.map((comparable) => `
          <li>
            <strong>${escapeHtml(comparable.title)}</strong>
            <span>${escapeHtml(comparable.source)} | ${formatMoney(comparable.price, state.profile.currency)}</span>
            ${comparable.url ? `<a href="${escapeAttribute(comparable.url)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
  }

  function renderYardSaleWorkbench(items, allItems, currentState) {
    const stats = getYardSaleStats(allItems);
    const hasPriceTags = items.some((item) => isPriceTagItem(item));

    return `
      <section class="yard-sale-workbench" id="yardSale">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Sale day</p>
            <h2>Yard Sale Planner</h2>
          </div>
          <div class="workbench-actions">
            <button class="button secondary" type="button" data-action="print-yard-sale-list" ${items.length === 0 ? "disabled" : ""}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>
              Sale Sheet
            </button>
            <button class="button primary" type="button" data-action="print-yard-sale-tags" ${hasPriceTags ? "" : "disabled"}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82ZM7.5 7.5h.01"></path></svg>
              Price Tags
            </button>
          </div>
        </div>
        <div class="sale-dashboard" aria-label="Yard sale summary">
          <article>
            <span>${stats.readyCount}</span>
            <p>Ready to sell</p>
          </article>
          <article>
            <span>${formatMoney(stats.askingTotal, currentState.profile.currency)}</span>
            <p>Asking total</p>
          </article>
          <article>
            <span>${formatMoney(stats.soldTotal, currentState.profile.currency)}</span>
            <p>Sold total</p>
          </article>
          <article>
            <span>${stats.unsureCount + stats.donatedCount}</span>
            <p>Unsure or donate</p>
          </article>
        </div>
        ${items.length === 0 ? renderYardSaleEmptyState() : `
          <div class="sale-list">
            ${items.map((item) => renderYardSaleItem(item, currentState)).join("")}
          </div>
        `}
      </section>
    `;
  }

  function renderYardSaleEmptyState() {
    return `
      <div class="empty-state">
        <h3>No sale items marked yet</h3>
        <p>Set an item plan to Sell, Unsure, Donated, or Sold and it appears here for sale-day prep.</p>
      </div>
    `;
  }

  function renderYardSaleItem(item, currentState) {
    const pricing = getSalePricing(item);
    const askingLabel = hasMoney(item.askingPrice)
      ? formatMoney(item.askingPrice, currentState.profile.currency)
      : pricing.suggestedAsk === null
        ? "Set ask"
        : `Suggested ${formatMoney(pricing.suggestedAsk, currentState.profile.currency)}`;
    const floorLabel = hasMoney(item.lowestPrice)
      ? formatMoney(item.lowestPrice, currentState.profile.currency)
      : pricing.suggestedFloor === null
        ? "Not set"
        : `Suggested ${formatMoney(pricing.suggestedFloor, currentState.profile.currency)}`;
    const soldLabel = hasMoney(item.soldPrice) ? formatMoney(item.soldPrice, currentState.profile.currency) : "Not sold";
    const marketLabel = pricing.market === null ? "No market anchor" : formatMoney(pricing.market, currentState.profile.currency);

    return `
      <article class="sale-card ${escapeAttribute(item.saleStatus.toLowerCase())}">
        <div>
          <p class="code">${escapeHtml(item.catalogCode)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.category)} | ${escapeHtml(item.condition)}</p>
          ${item.saleNotes ? `<p class="sale-card-note">${escapeHtml(item.saleNotes)}</p>` : ""}
        </div>
        <div class="sale-status-block">
          <span class="sale-status">${escapeHtml(item.saleStatus)}</span>
          <small>${escapeHtml(marketLabel)}</small>
        </div>
        <dl class="sale-price-grid">
          <div><dt>Ask</dt><dd>${escapeHtml(askingLabel)}</dd></div>
          <div><dt>Private floor</dt><dd>${escapeHtml(floorLabel)}</dd></div>
          <div><dt>Sold</dt><dd>${escapeHtml(soldLabel)}</dd></div>
        </dl>
        <div class="sale-actions">
          <button class="icon-button" type="button" data-action="edit-item" data-id="${escapeAttribute(item.id)}" aria-label="Edit sale item">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
          </button>
          <button class="icon-button" type="button" data-action="print-selected-price-tag" data-id="${escapeAttribute(item.id)}" aria-label="Print price tag" ${isPriceTagItem(item) ? "" : "disabled"}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82ZM7.5 7.5h.01"></path></svg>
          </button>
        </div>
      </article>
    `;
  }

  function renderLabelWorkbench(items) {
    if (items.length === 0) {
      return `<section class="label-workbench" aria-live="polite"></section>`;
    }

    const baseUrl = window.location.href.split("#")[0];

    return `
      <section class="label-workbench" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Print queue</p>
            <h2>Cross-reference Labels</h2>
          </div>
          <button class="button primary" type="button" data-action="print-now">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            Print
          </button>
        </div>
        <div class="label-sheet">
          ${items.map((item) => renderLabel(item, baseUrl)).join("")}
        </div>
      </section>
    `;
  }

  function renderLabel(item, baseUrl) {
    const label = createLabelViewModel(item, baseUrl);

    return `
      <article class="print-label">
        <div>
          <strong>${escapeHtml(label.title)}</strong>
          <span>${escapeHtml(label.subtitle)}</span>
        </div>
        ${createBarcodeSvg(label.catalogCode)}
        <p>${escapeHtml(label.catalogCode)}</p>
        <small>${escapeHtml(label.itemUrl)}</small>
      </article>
    `;
  }

  function renderInventoryPrintWorkbench(items, currentState) {
    if (items.length === 0) {
      return `<section class="inventory-print-workbench" aria-live="polite"></section>`;
    }

    const totalValue = items.reduce((sum, item) => sum + (Number(item.estimatedValue) || 0), 0);
    const generatedAt = new Date().toLocaleString();
    const filterSummary = [
      currentState.category === "All" ? "All categories" : currentState.category,
      currentState.search ? `Search: ${currentState.search}` : "",
      `Sort: ${getSortLabel(currentState.sortBy)}`
    ].filter(Boolean).join(" | ");

    return `
      <section class="inventory-print-workbench" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Print queue</p>
            <h2>Catalog Inventory List</h2>
          </div>
          <button class="button primary" type="button" data-action="print-now">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            Print
          </button>
        </div>
        <div class="inventory-print-header">
          <div>
            <strong>${escapeHtml(currentState.profile.collectionName)}</strong>
            <span>${escapeHtml(filterSummary)}</span>
          </div>
          <div>
            <strong>${items.length} items</strong>
            <span>${escapeHtml(formatMoney(totalValue, currentState.profile.currency))} total | ${escapeHtml(generatedAt)}</span>
          </div>
        </div>
        <div class="inventory-print-table-wrap">
          <table class="inventory-print-table">
            <thead>
              <tr>
                <th>Catalog Code</th>
                <th>Title</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Maker / Series</th>
                <th>Estimated</th>
                <th>Comps</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td>${escapeHtml(item.catalogCode)}</td>
                  <td>${escapeHtml(item.title)}</td>
                  <td>${escapeHtml(item.category)}</td>
                  <td>${escapeHtml(item.condition)}</td>
                  <td>${escapeHtml([item.maker, item.series].filter(Boolean).join(" / ") || "Not set")}</td>
                  <td>${escapeHtml(formatMoney(item.estimatedValue, currentState.profile.currency))}</td>
                  <td>${item.comparables.length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderPriceTagWorkbench(items, currentState) {
    if (items.length === 0) {
      return `<section class="price-tag-workbench" aria-live="polite"></section>`;
    }

    return `
      <section class="price-tag-workbench" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Print queue</p>
            <h2>Yard Sale Price Tags</h2>
          </div>
          <button class="button primary" type="button" data-action="print-now">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            Print
          </button>
        </div>
        <div class="price-tag-sheet">
          ${items.map((item) => renderPriceTag(item, currentState)).join("")}
        </div>
      </section>
    `;
  }

  function renderPriceTag(item, currentState) {
    const askingPrice = getMoneyNumber(item.askingPrice);
    const lowestPrice = getMoneyNumber(item.lowestPrice);
    const priceLabel = askingPrice === null ? "Make offer" : formatMoney(askingPrice, currentState.profile.currency);
    const offerLabel = askingPrice !== null && lowestPrice !== null && lowestPrice < askingPrice ? "OBO" : "Firm";

    return `
      <article class="sale-price-tag">
        <div class="tag-topline">
          <span>${escapeHtml(item.category)}</span>
          <span>${escapeHtml(item.condition)}</span>
        </div>
        <strong class="tag-price">${escapeHtml(priceLabel)}</strong>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(offerLabel)}</p>
        <small>${escapeHtml(item.catalogCode)}</small>
      </article>
    `;
  }

  function renderYardSalePrintWorkbench(items, currentState) {
    if (items.length === 0) {
      return `<section class="sale-list-print-workbench" aria-live="polite"></section>`;
    }

    const generatedAt = new Date().toLocaleString();
    const stats = getYardSaleStats(items);

    return `
      <section class="sale-list-print-workbench" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Print queue</p>
            <h2>Private Yard Sale Sheet</h2>
          </div>
          <button class="button primary" type="button" data-action="print-now">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"></path></svg>
            Print
          </button>
        </div>
        <div class="inventory-print-header">
          <div>
            <strong>${escapeHtml(currentState.profile.collectionName)}</strong>
            <span>Private sale sheet | ${escapeHtml(generatedAt)}</span>
          </div>
          <div>
            <strong>${items.length} items</strong>
            <span>${escapeHtml(formatMoney(stats.askingTotal, currentState.profile.currency))} asking | ${escapeHtml(formatMoney(stats.soldTotal, currentState.profile.currency))} sold</span>
          </div>
        </div>
        <div class="inventory-print-table-wrap">
          <table class="inventory-print-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item</th>
                <th>Category</th>
                <th>Status</th>
                <th>Ask</th>
                <th>Private Floor</th>
                <th>Sold</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td>${escapeHtml(item.catalogCode)}</td>
                  <td>${escapeHtml(item.title)}</td>
                  <td>${escapeHtml(item.category)}</td>
                  <td>${escapeHtml(item.saleStatus)}</td>
                  <td>${escapeHtml(formatMoney(item.askingPrice, currentState.profile.currency))}</td>
                  <td>${escapeHtml(formatMoney(item.lowestPrice, currentState.profile.currency))}</td>
                  <td>${escapeHtml(formatMoney(item.soldPrice, currentState.profile.currency))}</td>
                  <td>${escapeHtml(item.saleNotes || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderProfileDialog(profile) {
    return `
      <dialog class="profile-dialog" id="profileDialog">
        <form class="profile-form" data-role="profile-form">
          <div class="dialog-header">
            <div>
              <p class="eyebrow">User settings</p>
              <h2>Profile</h2>
            </div>
            <button class="icon-button" type="button" data-action="close-profile" aria-label="Close profile settings">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="profile-identity">
            <span>${escapeHtml(getProfileInitials(profile))}</span>
            <div>
              <strong>${escapeHtml(profile.displayName)}</strong>
              <p>${escapeHtml(profile.email || "Local profile")}</p>
            </div>
          </div>
          <div class="form-grid">
            ${renderTextField("displayName", "Display name", profile.displayName, "Collector")}
            ${renderTextField("email", "Email", profile.email, "you@example.com", "email")}
            ${renderTextField("collectionName", "Collection name", profile.collectionName, "Collection workspace")}
            ${renderSelectField("defaultCategory", "Default category", CATEGORIES, profile.defaultCategory)}
            ${renderSelectField("currency", "Currency", CURRENCY_OPTIONS, profile.currency)}
            ${renderSelectField("theme", "Theme", THEME_OPTIONS, profile.theme)}
          </div>
          <div class="form-actions">
            <button class="button primary" type="submit">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></svg>
              Save Profile
            </button>
            <button class="button secondary" type="button" data-action="close-profile">Cancel</button>
          </div>
        </form>
      </dialog>
    `;
  }

  function renderTextField(name, label, value = "", placeholder = "", type = "text") {
    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <input name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" ${type === "number" ? "inputmode=\"decimal\" step=\"0.01\" min=\"0\"" : ""}>
      </label>
    `;
  }

  function renderSelectField(name, label, options, selectedValue) {
    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <select name="${escapeAttribute(name)}">
          ${options.map((option) => `
            <option value="${escapeAttribute(option)}" ${option === selectedValue ? "selected" : ""}>${escapeHtml(option)}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  async function handleClick(event, currentState) {
    const actionTarget = event.target.closest("[data-action]");

    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;
    const id = actionTarget.dataset.id;

    if (action === "start-new") {
      resetForm(currentState);
      render(currentState);
    }

    if (action === "go-yard-sale") {
      root.querySelector("#yardSale")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (action === "open-profile") {
      currentState.isProfileOpen = true;
      render(currentState);
    }

    if (action === "close-profile") {
      closeProfile(currentState);
    }

    if (action === "toggle-theme") {
      const theme = currentState.profile.theme === "dark" ? "light" : "dark";
      saveProfile(currentState, { theme });
      showToast(currentState, `${theme === "dark" ? "Dark" : "Light"} theme enabled.`);
    }

    if (action === "cancel-edit") {
      resetForm(currentState);
      render(currentState);
    }

    if (action === "remove-photo") {
      currentState.pendingPhotoDataUrl = "";
      render(currentState);
    }

    if (action === "edit-item") {
      const item = service.getById(id);
      currentState.editingId = id;
      currentState.pendingPhotoDataUrl = item?.photoDataUrl || "";
      currentState.selectedId = null;
      render(currentState);
      root.querySelector(".entry-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (action === "view-item") {
      openDetails(id, currentState);
    }

    if (action === "close-dialog") {
      closeDetails(currentState);
    }

    if (action === "delete-item") {
      if (confirm("Delete this catalog entry?")) {
        service.remove(id);
        closeDetails(currentState);
      }
    }

    if (action === "copy-code") {
      await navigator.clipboard?.writeText(actionTarget.dataset.code || "");
      showToast(currentState, "Catalog code copied.");
    }

    if (action === "scan-comparables") {
      await scanComparables(id, currentState);
    }

    if (action === "accept-candidate") {
      service.acceptComparableCandidate(id, actionTarget.dataset.candidateId);
      showToast(currentState, "Comparable accepted.");
    }

    if (action === "reject-candidate") {
      service.rejectComparableCandidate(id, actionTarget.dataset.candidateId);
      showToast(currentState, "Candidate rejected.");
    }

    if (action === "print-selected-label") {
      clearPrintQueues(currentState);
      currentState.labelItemIds = [id];
      render(currentState);
      requestAnimationFrame(() => window.print());
    }

    if (action === "print-filtered-labels") {
      const items = service.list(getCatalogQuery(currentState));
      clearPrintQueues(currentState);
      currentState.labelItemIds = items.map((item) => item.id);
      render(currentState);
    }

    if (action === "print-catalog-list") {
      const items = service.list(getCatalogQuery(currentState));

      if (items.length === 0) {
        showToast(currentState, "No matching catalog items to print.");
        return;
      }

      clearPrintQueues(currentState);
      currentState.printListItemIds = items.map((item) => item.id);
      render(currentState);
      requestAnimationFrame(() => window.print());
    }

    if (action === "print-selected-price-tag") {
      clearPrintQueues(currentState);
      currentState.priceTagItemIds = [id];
      render(currentState);
      requestAnimationFrame(() => window.print());
    }

    if (action === "print-yard-sale-tags") {
      const items = getYardSaleItems(service.list()).filter((item) => isPriceTagItem(item));

      if (items.length === 0) {
        showToast(currentState, "No yard sale items with price tags yet.");
        return;
      }

      clearPrintQueues(currentState);
      currentState.priceTagItemIds = items.map((item) => item.id);
      render(currentState);
      requestAnimationFrame(() => window.print());
    }

    if (action === "print-yard-sale-list") {
      const items = getYardSaleItems(service.list());

      if (items.length === 0) {
        showToast(currentState, "No yard sale items to print.");
        return;
      }

      clearPrintQueues(currentState);
      currentState.saleListItemIds = items.map((item) => item.id);
      render(currentState);
      requestAnimationFrame(() => window.print());
    }

    if (action === "print-now") {
      window.print();
    }

    if (action === "export-json") {
      exportCatalog(service.list());
    }
  }

  function handleSubmit(event, currentState) {
    const catalogForm = event.target.closest("[data-role='catalog-form']");
    const comparableForm = event.target.closest("[data-role='comparable-form']");
    const profileForm = event.target.closest("[data-role='profile-form']");
    const providerForm = event.target.closest("[data-role='provider-form']");

    if (profileForm) {
      event.preventDefault();
      saveProfile(currentState, formToObject(profileForm));
      currentState.isProfileOpen = false;
      showToast(currentState, "Profile settings saved.");
      return;
    }

    if (catalogForm) {
      event.preventDefault();
      const payload = formToObject(catalogForm);
      payload.photoDataUrl = currentState.pendingPhotoDataUrl;

      if (currentState.editingId) {
        service.update(currentState.editingId, payload);
        showToast(currentState, "Catalog entry updated.");
      } else {
        const item = service.create(payload);
        clearPrintQueues(currentState);
        currentState.labelItemIds = [item.id];
        showToast(currentState, "Catalog entry created.");
      }

      resetForm(currentState);
      return;
    }

    if (comparableForm) {
      event.preventDefault();
      service.addComparable(comparableForm.dataset.itemId, formToObject(comparableForm));
      comparableForm.reset();
      showToast(currentState, "Comparable sale recorded.");
    }

    if (providerForm) {
      event.preventDefault();
      const payload = formToObject(providerForm);
      comparableProvider.setEndpoint?.(payload.providerEndpoint);
      comparableProvider.setPriceChartingToken?.(payload.priceChartingToken);
      currentState.providerEndpoint = comparableProvider.getEndpoint?.() || "";
      currentState.priceChartingToken = comparableProvider.getPriceChartingToken?.() || "";
      currentState.scanError = "";
      showToast(currentState, "Provider settings saved.");
    }
  }

  function handleInput(event, currentState) {
    if (event.target.name !== "search") {
      return;
    }

    const selectionStart = event.target.selectionStart;
    currentState.search = event.target.value;
    render(currentState);

    requestAnimationFrame(() => {
      const searchInput = root.querySelector("input[name='search']");
      searchInput?.focus();
      searchInput?.setSelectionRange(selectionStart, selectionStart);
    });
  }

  async function handleChange(event, currentState) {
    if (event.target.name === "categoryFilter") {
      currentState.category = event.target.value;
      render(currentState);
    }

    if (event.target.name === "sortBy") {
      currentState.sortBy = event.target.value;
      render(currentState);
    }

    if (event.target.name === "photo" && event.target.files?.[0]) {
      currentState.pendingPhotoDataUrl = await imageReader(event.target.files[0]);
      render(currentState);
    }
  }

  function openDetails(id, currentState) {
    if (!service.getById(id)) {
      return;
    }

    currentState.selectedId = id;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#item=${encodeURIComponent(id)}`);
    render(currentState);
  }

  function closeDetails(currentState) {
    currentState.selectedId = null;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    render(currentState);
  }

  function closeProfile(currentState) {
    currentState.isProfileOpen = false;
    render(currentState);
  }

  function openItemFromHash(currentState) {
    const params = new URLSearchParams(window.location.hash.replace("#", ""));
    const itemId = params.get("item");

    if (itemId && service.getById(itemId)) {
      currentState.selectedId = itemId;
      render(currentState);
    }
  }

  function resetForm(currentState) {
    currentState.editingId = null;
    currentState.pendingPhotoDataUrl = "";
  }

  function clearPrintQueues(currentState) {
    currentState.labelItemIds = [];
    currentState.priceTagItemIds = [];
    currentState.printListItemIds = [];
    currentState.saleListItemIds = [];
  }

  function saveProfile(currentState, input) {
    currentState.profile = createUserProfile({ ...currentState.profile, ...input });
    profileRepository.save(currentState.profile);
  }

  function applyTheme(theme) {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
    document.documentElement.dataset.theme = resolveTheme(theme, prefersDark);
    document.documentElement.style.colorScheme = resolveTheme(theme, prefersDark);
  }

  async function scanComparables(itemId, currentState) {
    const item = service.getById(itemId);

    if (!item) {
      return;
    }

    currentState.scanError = "";
    currentState.scanningItemId = itemId;
    render(currentState);

    try {
      const candidates = await comparableProvider.scanCandidates(item);
      service.addComparableCandidates(itemId, candidates);
      showToast(currentState, candidates.length === 0 ? "No candidates found." : `${candidates.length} candidates ready for review.`);
    } catch (error) {
      currentState.scanError = error.message || "Comparable scan failed.";
      render(currentState);
    } finally {
      currentState.scanningItemId = "";
      render(currentState);
    }
  }

  function showToast(currentState, message) {
    currentState.toast = message;
    render(currentState);

    window.setTimeout(() => {
      currentState.toast = "";
      render(currentState);
    }, 2400);
  }

  function exportCatalog(items) {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "collectible-catalog-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function getCatalogQuery(currentState) {
    return {
      search: currentState.search,
      category: currentState.category,
      sortBy: currentState.sortBy
    };
  }

  function getSortLabel(sortBy) {
    return CATALOG_SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Recently updated";
  }
}

function getYardSaleItems(items) {
  return [...items]
    .filter((item) => item.saleStatus && item.saleStatus !== "Keep")
    .sort((left, right) =>
      left.category.localeCompare(right.category, undefined, { sensitivity: "base" })
      || compareMoneyForSort(left.askingPrice, right.askingPrice)
      || left.title.localeCompare(right.title, undefined, { sensitivity: "base", numeric: true })
    );
}

function getYardSaleStats(items) {
  return {
    readyCount: items.filter((item) => item.saleStatus === "Sell").length,
    unsureCount: items.filter((item) => item.saleStatus === "Unsure").length,
    donatedCount: items.filter((item) => item.saleStatus === "Donated").length,
    askingTotal: sumMoney(items.filter((item) => ["Sell", "Unsure"].includes(item.saleStatus)), "askingPrice"),
    soldTotal: sumMoney(items.filter((item) => item.saleStatus === "Sold"), "soldPrice")
  };
}

function getSalePricing(item) {
  const summary = summarizeComparables(item.comparables || []);
  const market = summary.average ?? getMoneyNumber(item.estimatedValue);

  if (market === null) {
    return {
      market: null,
      suggestedAsk: null,
      suggestedFloor: null
    };
  }

  return {
    market,
    suggestedAsk: roundYardSalePrice(market * 0.35),
    suggestedFloor: roundYardSalePrice(market * 0.2)
  };
}

function isPriceTagItem(item) {
  return ["Sell", "Unsure"].includes(item.saleStatus) || hasMoney(item.askingPrice);
}

function hasMoney(value) {
  return getMoneyNumber(value) !== null;
}

function getMoneyNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function sumMoney(items, key) {
  return items.reduce((sum, item) => sum + (getMoneyNumber(item[key]) || 0), 0);
}

function compareMoneyForSort(leftValue, rightValue) {
  const leftAmount = getMoneyNumber(leftValue);
  const rightAmount = getMoneyNumber(rightValue);

  if (leftAmount === null && rightAmount === null) {
    return 0;
  }

  if (leftAmount === null) {
    return 1;
  }

  if (rightAmount === null) {
    return -1;
  }

  return rightAmount - leftAmount;
}

function roundYardSalePrice(value) {
  if (value >= 100) {
    return Math.max(5, Math.round(value / 5) * 5);
  }

  if (value >= 20) {
    return Math.max(1, Math.round(value));
  }

  if (value >= 5) {
    return Math.max(1, Math.round(value * 2) / 2);
  }

  return Math.max(0.5, Math.round(value * 4) / 4);
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
