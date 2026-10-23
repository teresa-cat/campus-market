const photo = (id, width = 720) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const starterListings = [
  { id: "i1", title: "Vintage leather backpack", category: "Clothes", price: 32, condition: "Good", description: "A well-loved leather backpack with plenty of life left. Fits a 13-inch laptop, notebooks, and all your everyday essentials.", seller: "Maya R.", campus: "North Campus", image: photo("photo-1553062407-98eeb64c6a62"), created: 8, status: "available" },
  { id: "i2", title: "The little desk lamp", category: "Home & Living", price: 18, condition: "Like new", description: "Warm, adjustable light for late-night study sessions. Works perfectly and includes the bulb.", seller: "Alex T.", campus: "Maple Hall", image: photo("photo-1507473885765-e6ed057f782c"), created: 7, status: "available" },
  { id: "i3", title: "Calculus: Early Transcendentals", category: "Books & Supplies", price: 24, condition: "Good", description: "Ninth edition. Some helpful notes in the margins, but all pages are clean and intact.", seller: "Jordan K.", campus: "Library steps", image: photo("photo-1544947950-fa07a98d237f"), created: 6, status: "available" },
  { id: "i4", title: "Wireless over-ear headphones", category: "Electronics", price: 45, condition: "Like new", description: "Great sound, comfortable fit, and a fresh charge. Includes the carry case and charging cable.", seller: "Sam P.", campus: "Student Center", image: photo("photo-1505740420928-5e560c06d30e"), created: 5, status: "available" },
  { id: "i5", title: "Canvas everyday tote", category: "Clothes", price: 12, condition: "Good", description: "Sturdy cotton canvas with a deep inside pocket. Ready for groceries, books, and everywhere in between.", seller: "Riley M.", campus: "Arts Quad", image: photo("photo-1590874103328-eac38a683ce7"), created: 4, status: "available" },
  { id: "i6", title: "Compact study desk", category: "Home & Living", price: 55, condition: "Good", description: "Simple, sturdy desk, perfect for a dorm room. 90 × 50 cm. Can help carry it down from my room.", seller: "Casey L.", campus: "Cedar Hall", image: photo("photo-1518455027359-f3f8164ba6bd"), created: 3, status: "available" },
  { id: "i7", title: "27-inch HD monitor", category: "Electronics", price: 85, condition: "Good", description: "A bright 1080p monitor with HDMI and DisplayPort. I upgraded my setup, so this one's ready to go.", seller: "Drew W.", campus: "Tech Building", image: photo("photo-1527443224154-c4a3942d3acf"), created: 2, status: "available" },
  { id: "i8", title: "Graphing calculator", category: "Books & Supplies", price: 38, condition: "Like new", description: "Reliable graphing calculator, reset and ready for its next semester. Happy to meet outside the math building.", seller: "Taylor N.", campus: "Math Building", image: photo("photo-1587145820266-a5951ee6f620"), created: 1, status: "available" }
];

const storageKey = "campus-market-listings";
const userKey = "campus-market-user";
let listings = JSON.parse(localStorage.getItem(storageKey) || "null") || starterListings;
let user = JSON.parse(localStorage.getItem(userKey) || "null");
let activeCategory = "All";
let favorites = new Set(JSON.parse(localStorage.getItem("campus-market-favorites") || "[]"));
let activeModalItem = null;
let toastTimeout;

const grid = document.querySelector("#listing-grid");
const modalBackdrop = document.querySelector("#modal-backdrop");
const modalContent = document.querySelector("#modal-content");
const searchInput = document.querySelector("#search-input");

function saveListings() { localStorage.setItem(storageKey, JSON.stringify(listings)); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function renderListings() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = listings.filter(item => item.status !== "sold" &&
    (activeCategory === "All" || item.category === activeCategory) &&
    (!query || `${item.title} ${item.category} ${item.description} ${item.campus}`.toLowerCase().includes(query)));
  const sort = document.querySelector("#sort-select").value;
  if (sort === "price-low") visible.sort((a, b) => a.price - b.price);
  else if (sort === "price-high") visible.sort((a, b) => b.price - a.price);
  else visible.sort((a, b) => b.created - a.created);
  document.querySelector("#all-count").textContent = `(${listings.filter(item => item.status !== "sold").length})`;
  document.querySelector("#results-count").textContent = `${visible.length} ${visible.length === 1 ? "find" : "finds"}`;
  document.querySelector("#listing-heading").textContent = query ? `Results for “${searchInput.value.trim()}”` : activeCategory === "All" ? "Find your next favorite." : `Finds in ${activeCategory}.`;
  grid.innerHTML = visible.map(item => `
    <article class="listing-card" data-id="${escapeHtml(item.id)}" tabindex="0" aria-label="View ${escapeHtml(item.title)}">
      <div class="listing-image-wrap"><img class="listing-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
        <span class="image-label">${escapeHtml(item.category)}</span>
        <button class="favorite-button ${favorites.has(item.id) ? "favorited" : ""}" data-favorite="${escapeHtml(item.id)}" aria-label="${favorites.has(item.id) ? "Remove from" : "Add to"} favorites">${favorites.has(item.id) ? "♥" : "♡"}</button>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <div class="card-meta"><span class="card-price">$${Number(item.price).toFixed(0)}</span><span class="card-condition">${escapeHtml(item.condition)}</span></div>
      <div class="card-campus"><span>⌖</span>${escapeHtml(item.campus)}</div>
    </article>`).join("");
  document.querySelector("#empty-state").classList.toggle("hidden", visible.length > 0);
  grid.classList.toggle("hidden", visible.length === 0);
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2800);
}
function closeModal() {
  modalBackdrop.classList.add("hidden");
  modalContent.innerHTML = "";
  activeModalItem = null;
}
function showModal(content) {
  modalContent.innerHTML = content;
  modalBackdrop.classList.remove("hidden");
  modalContent.querySelector("input, textarea, select, button")?.focus();
}
function requireVerified(action) {
  if (user?.verified) action();
  else showAuth("Verify your school email", "You can browse freely. Verify your student email when you're ready to post or message a seller.");
}
function showAuth(title = "Welcome to the neighborhood.", intro = "Use your school email to unlock posting and messaging. Browsing is always open.") {
  showModal(`<div class="modal-kicker">A CAMPUS-ONLY COMMUNITY</div><h2 id="modal-title">${escapeHtml(title)}</h2><p class="modal-intro">${escapeHtml(intro)}</p>
    <form id="auth-form"><label class="form-field">Your name<input name="name" autocomplete="name" placeholder="e.g. Jamie Lee" required value="${escapeHtml(user?.name || "")}"></label>
    <label class="form-field">School email<input name="email" type="email" autocomplete="email" placeholder="you@scu.edu" required value="${escapeHtml(user?.email || "")}"></label>
    <button class="button button-dark form-submit" type="submit">Send verification code <span>→</span></button></form>
    <p class="form-note">Prototype demo: enter any valid email address to simulate school email verification.<br>Your email is only used to verify your campus community.</p>`);
  modalContent.querySelector("#auth-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter your name and a valid email address.");
      return;
    }
    user = { name, email, verified: false };
    localStorage.setItem(userKey, JSON.stringify(user));
    showVerification(email);
  });
}
function showVerification(email) {
  showModal(`<div class="modal-kicker">ONE QUICK CHECK</div><h2 id="modal-title">Check your inbox.</h2><p class="modal-intro">We sent a 6-digit verification code to <strong>${escapeHtml(email)}</strong>.</p>
    <form id="verify-form"><label class="form-field">Verification code<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required></label>
    <button class="button button-dark form-submit" type="submit">Verify and continue <span>→</span></button></form>
    <p class="form-note">Prototype demo: enter any 6 digits to complete verification.<br><button class="text-button" type="button" id="change-email">Use a different email</button></p>`);
  modalContent.querySelector("#verify-form").addEventListener("submit", event => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code"));
    if (!/^\d{6}$/.test(code)) { showToast("Enter any 6 digits to verify."); return; }
    user.verified = true;
    localStorage.setItem(userKey, JSON.stringify(user));
    closeModal();
    updateAccountButton();
    showToast("You're verified. Welcome to the campus community!");
    if (pendingAction) { const action = pendingAction; pendingAction = null; action(); }
  });
  modalContent.querySelector("#change-email").addEventListener("click", () => showAuth());
}
let pendingAction = null;
function verifiedAction(action) {
  if (user?.verified) action();
  else { pendingAction = action; showAuth(); }
}
function showDetails(id) {
  const item = listings.find(listing => listing.id === id);
  if (!item) return;
  activeModalItem = item;
  showModal(`<div class="modal-kicker">${escapeHtml(item.category.toUpperCase())}</div><img class="detail-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
    <h2 id="modal-title" style="margin-top:16px">${escapeHtml(item.title)}</h2><div class="detail-price">$${Number(item.price).toFixed(0)}</div>
    <div class="detail-tags"><span>${escapeHtml(item.condition)}</span><span>⌖ ${escapeHtml(item.campus)}</span></div>
    <p class="detail-description">${escapeHtml(item.description)}</p>
    <div class="detail-seller">Listed by <strong>${escapeHtml(item.seller)}</strong> <span>· Student verified</span></div>
    <div class="detail-actions"><button class="button button-dark" id="message-seller">Message seller <span>→</span></button><button class="button button-outline" id="report-listing">⚑ Report</button></div>
    <p class="form-note">For everyone's safety, meet in a public place on campus.</p>`);
  modalContent.querySelector("#message-seller").addEventListener("click", () => verifiedAction(() => showMessage(item.id)));
  modalContent.querySelector("#report-listing").addEventListener("click", () => verifiedAction(() => showReport(item.id)));
}
function showMessage(id) {
  const item = listings.find(listing => listing.id === id);
  if (!item) return;
  showModal(`<div class="modal-kicker">A FRIENDLY HELLO GOES A LONG WAY</div><h2 id="modal-title">Message ${escapeHtml(item.seller)}.</h2><p class="modal-intro">About <strong>${escapeHtml(item.title)}</strong> · $${Number(item.price).toFixed(0)}</p>
    <div id="message-thread"><div class="message-bubble">Hi! Is this still available?</div></div>
    <form id="message-form"><label class="form-field">Your message<textarea name="message" placeholder="Ask a question or suggest a campus meetup..." required></textarea></label>
    <button class="button button-dark form-submit" type="submit">Send message <span>→</span></button></form>
    <p class="form-note">This is a prototype. Messages are simulated and stay in this demo.</p>`);
  modalContent.querySelector("#message-form").addEventListener("submit", event => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("message")).trim();
    if (!text) return;
    modalContent.querySelector("#message-thread").insertAdjacentHTML("beforeend", `<div class="message-bubble mine">${escapeHtml(text)}</div>`);
    event.currentTarget.reset();
    showToast("Message sent in this prototype.");
  });
}
function showReport(id) {
  showModal(`<div class="modal-kicker">HELP KEEP CAMPUS MARKET KIND</div><h2 id="modal-title">Report this listing.</h2><p class="modal-intro">Reports are reviewed by the campus community team. Choose the reason that best fits.</p>
    <form id="report-form"><label class="form-field">Reason<select name="reason" required><option value="">Choose a reason</option><option>Suspicious or possibly a scam</option><option>Inappropriate content</option><option>Prohibited or unsafe item</option><option>Other concern</option></select></label>
    <label class="form-field">Anything else? (optional)<textarea name="details" placeholder="Share a little more context..."></textarea></label>
    <button class="button button-dark form-submit" type="submit">Submit report</button></form>`);
  modalContent.querySelector("#report-form").addEventListener("submit", event => {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get("reason");
    if (!reason) { showToast("Please choose a reason for your report."); return; }
    closeModal();
    showToast("Thanks for looking out for the community.");
  });
}
function showPostForm(item = null) {
  const isEdit = Boolean(item);
  showModal(`<div class="modal-kicker">${isEdit ? "YOUR LISTING" : "GIVE IT A SECOND LIFE"}</div><h2 id="modal-title">${isEdit ? "Edit your listing." : "What are you passing on?"}</h2>
    <p class="modal-intro">${isEdit ? "Update the details so the right person can find it." : "A photo and a few details are all it takes to find it a new home."}</p>
    <form id="post-form"><label class="form-field">Item name<input name="title" maxlength="70" placeholder="e.g. A really good desk lamp" required value="${escapeHtml(item?.title || "")}"></label>
    <div class="form-row"><label class="form-field">Category<select name="category" required>${["Clothes", "Home & Living", "Electronics", "Books & Supplies"].map(category => `<option ${item?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
    <label class="form-field">Price ($)<input name="price" type="number" min="0" step="1" placeholder="25" required value="${item ? Number(item.price) : ""}"></label></div>
    <div class="form-row"><label class="form-field">Condition<select name="condition" required>${["Like new", "Good", "Fair"].map(condition => `<option ${item?.condition === condition ? "selected" : ""}>${condition}</option>`).join("")}</select></label>
    <label class="form-field">Meetup spot<input name="campus" maxlength="50" placeholder="e.g. Library steps" required value="${escapeHtml(item?.campus || "")}"></label></div>
    <label class="form-field">Description<textarea name="description" maxlength="500" placeholder="What should its next owner know?" required>${escapeHtml(item?.description || "")}</textarea></label>
    <label class="form-field">Photo <span style="color:#898b82;font-weight:400">${isEdit ? "(optional — keep current photo if skipped)" : ""}</span><span class="upload-box" id="upload-box">${item?.image ? `<img class="upload-preview" src="${escapeHtml(item.image)}" alt="Current listing photo">` : `<span>＋ &nbsp;Add a photo<br><small>JPG, PNG, or WEBP</small></span>`}<input name="image" type="file" accept="image/png,image/jpeg,image/webp" ${isEdit ? "" : "required"} aria-label="Choose item photo"></span></label>
    <button class="button button-dark form-submit" type="submit">${isEdit ? "Save changes" : "Post your item"} <span>→</span></button></form>
    <p class="form-note">Keep it local: arrange handoffs in a public campus spot.</p>`);
  const fileInput = modalContent.querySelector('input[name="image"]');
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { fileInput.value = ""; showToast("Photos need to be smaller than 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { modalContent.querySelector("#upload-box").innerHTML = `<img class="upload-preview" src="${reader.result}" alt="Photo preview"><input name="image" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose a different item photo">`; };
    reader.readAsDataURL(file);
  });
  modalContent.querySelector("#post-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const imageFile = fileInput.files?.[0];
    const finish = image => {
      const listing = {
        id: item?.id || `item-${Date.now()}`,
        title: String(data.get("title")).trim(), category: String(data.get("category")),
        price: Number(data.get("price")), condition: String(data.get("condition")),
        campus: String(data.get("campus")).trim(), description: String(data.get("description")).trim(),
        seller: user.name, image: image || item?.image, created: Date.now(), status: item?.status || "available",
        ownerEmail: user.email
      };
      if (isEdit) listings = listings.map(listingItem => listingItem.id === item.id ? listing : listingItem);
      else listings.unshift(listing);
      saveListings(); closeModal(); renderListings();
      showToast(isEdit ? "Your listing has been updated." : "Your item is live. Here's to its next chapter!");
    };
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => finish(String(reader.result));
      reader.onerror = () => showToast("We couldn't read that photo. Please try again.");
      reader.readAsDataURL(imageFile);
    } else finish(item?.image);
  });
}
function showMyListings() {
  const mine = listings.filter(item => item.ownerEmail === user.email);
  showModal(`<div class="modal-kicker">YOUR CAMPUS CLOSET, SO TO SPEAK</div><h2 id="modal-title">My listings.</h2><p class="modal-intro">${mine.length ? "Edit details, update availability, or choose a thoughtful next step." : "You haven't posted anything yet. When you do, you'll find it here."}</p>
    <div id="manager-list">${mine.map(item => `<div class="listing-manager-card"><img src="${escapeHtml(item.image)}" alt=""><div class="manager-info"><strong>${escapeHtml(item.title)}</strong><span>$${Number(item.price).toFixed(0)} · ${escapeHtml(item.status)}</span></div><div class="manager-actions"><button data-edit="${escapeHtml(item.id)}">Edit</button><button data-status="${escapeHtml(item.id)}">${item.status === "sold" ? "Mark unsold" : "Mark sold"}</button><button data-donate="${escapeHtml(item.id)}">Donate / recycle</button></div></div>`).join("") || `<button class="button button-dark" id="first-listing">Post your first item <span>→</span></button>`}</div>`);
  modalContent.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => {
    const item = listings.find(listing => listing.id === button.dataset.edit); if (item) showPostForm(item);
  }));
  modalContent.querySelectorAll("[data-status]").forEach(button => button.addEventListener("click", () => {
    listings = listings.map(item => item.id === button.dataset.status ? { ...item, status: item.status === "sold" ? "available" : "sold" } : item);
    saveListings(); renderListings(); showMyListings();
  }));
  modalContent.querySelectorAll("[data-donate]").forEach(button => button.addEventListener("click", () => showDonate(button.dataset.donate)));
  modalContent.querySelector("#first-listing")?.addEventListener("click", () => showPostForm());
}
function showDonate(id) {
  const item = listings.find(listing => listing.id === id);
  if (!item) return;
  showModal(`<div class="modal-kicker">GOOD THINGS KEEP GOING</div><h2 id="modal-title">Give it another kind of second life.</h2><p class="modal-intro">If <strong>${escapeHtml(item.title)}</strong> hasn't found a new owner, you can pass it on in a different way.</p>
    <form id="donate-form"><label class="form-field">Choose what happens next<select name="choice" required><option value="">Select an option</option><option value="donated">Donate it to a local campus or community organization</option><option value="recycled">Recycle it responsibly</option></select></label>
    <p class="form-note" style="text-align:left">For donations, check your campus community center or student resource hub for current drop-off options. For recycling, follow your campus waste program's guidance.</p>
    <button class="button button-dark form-submit" type="submit">Confirm my choice <span>→</span></button></form>`);
  modalContent.querySelector("#donate-form").addEventListener("submit", event => {
    event.preventDefault();
    const choice = new FormData(event.currentTarget).get("choice");
    if (!choice) { showToast("Please select how you'd like to pass it on."); return; }
    listings = listings.map(listing => listing.id === id ? { ...listing, status: choice } : listing);
    saveListings(); renderListings(); closeModal();
    showToast(choice === "donated" ? "Marked for donation. Thanks for passing it on!" : "Marked for recycling. Thanks for keeping it in circulation!");
  });
}
function updateAccountButton() {
  const button = document.querySelector("#account-button");
  button.textContent = user?.verified ? user.name.slice(0, 1).toUpperCase() : "↗";
  button.setAttribute("aria-label", user?.verified ? `Signed in as ${user.name}` : "Sign in to your account");
}

grid.addEventListener("click", event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.stopPropagation();
    const id = favoriteButton.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem("campus-market-favorites", JSON.stringify([...favorites]));
    renderListings();
    return;
  }
  const card = event.target.closest(".listing-card");
  if (card) showDetails(card.dataset.id);
});
grid.addEventListener("keydown", event => {
  const card = event.target.closest(".listing-card");
  if (card && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); showDetails(card.dataset.id); }
});
document.querySelectorAll(".category-pill").forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  document.querySelectorAll(".category-pill").forEach(pill => pill.classList.toggle("active", pill === button));
  renderListings();
}));
searchInput.addEventListener("input", renderListings);
document.querySelector("#sort-select").addEventListener("change", renderListings);
document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = ""; activeCategory = "All";
  document.querySelectorAll(".category-pill").forEach(pill => pill.classList.toggle("active", pill.dataset.category === "All"));
  renderListings();
});
document.querySelector("#post-button").addEventListener("click", () => verifiedAction(() => showPostForm()));
document.querySelector("#my-listings-button").addEventListener("click", () => verifiedAction(() => showMyListings()));
document.querySelector("#account-button").addEventListener("click", () => user?.verified ? showMyListings() : showAuth());
document.querySelector("#donate-info-button").addEventListener("click", () => {
  showModal(`<div class="modal-kicker">THE CAMPUS-MARKET WAY</div><h2 id="modal-title">A better kind of hand-me-down.</h2><p class="modal-intro">Campus Market makes it easy to pass useful things from one student to another. When an item is ready to move on in a different way, you can:</p>
    <div class="detail-tags"><span>✳ Donate</span><span>↻ Recycle</span><span>♥ Reuse</span></div><p class="detail-description">Look for donation drop-offs at your campus community center or student resource hub. For recycling, check your campus waste program's current guidance. And for every handoff, meet somewhere public and well-lit.</p>
    <button class="button button-dark form-submit" id="donate-done">Sounds good</button>`);
  modalContent.querySelector("#donate-done").addEventListener("click", closeModal);
});
document.querySelector("#modal-close").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.classList.contains("hidden")) closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchInput.focus(); }
});
updateAccountButton();
renderListings();
