

const CATEGORIES = [
    { name: "Garbage / Waste", icon: "fa-trash-can", desc: "Overflowing bins, litter and unmanaged waste." },
    { name: "Roads / Potholes", icon: "fa-road", desc: "Potholes, damaged roads and unsafe surfaces." },
    { name: "Water Leakage", icon: "fa-droplet", desc: "Leaks, broken pipes and water wastage." },
    { name: "Drainage / Waterlogging", icon: "fa-water", desc: "Blocked drains and waterlogged streets." },
    { name: "Streetlight", icon: "fa-lightbulb", desc: "Broken, damaged or non-functional lights." },
    { name: "Other Infrastructure", icon: "fa-city", desc: "Other public infrastructure problems." }
];
let complaints = JSON.parse(localStorage.getItem("civicsetu_complaints") || "null") || [
    { id: "CSB-2026-00142", category: "Garbage / Waste", location: "Government Polytechnic Banka", priority: "High", status: "In Progress", date: "30 Sep 2026", lat: 24.884, lng: 86.919, description: "Waste has accumulated near the main gate." },
    { id: "CSB-2026-00141", category: "Road / Pothole", location: "Banka Main Road", priority: "Medium", status: "Resolved", date: "29 Sep 2026", lat: 24.881, lng: 86.921, description: "Pothole reported on the road." },
    { id: "CSB-2026-00140", category: "Water Leakage", location: "Rajendra Nagar", priority: "High", status: "Pending", date: "28 Sep 2026", lat: 24.887, lng: 86.914, description: "Water is leaking from a roadside pipe." },
    { id: "CSB-2026-00139", category: "Streetlight", location: "Banka Bus Stand", priority: "Low", status: "Resolved", date: "27 Sep 2026", lat: 24.883, lng: 86.916, description: "Streetlight not working." },
    { id: "CSB-2026-00138", category: "Drainage", location: "Hospital Road", priority: "High", status: "In Progress", date: "27 Sep 2026", lat: 24.889, lng: 86.923, description: "Drain is blocked and water is collecting." },
    { id: "CSB-2026-00137", category: "Garbage / Waste", location: "Town Market", priority: "Medium", status: "Resolved", date: "26 Sep 2026", lat: 24.879, lng: 86.917, description: "Garbage collection issue." },
    { id: "CSB-2026-00136", category: "Road / Pothole", location: "Katoria Road", priority: "High", status: "Pending", date: "25 Sep 2026", lat: 24.891, lng: 86.912, description: "Large pothole reported." },
    { id: "CSB-2026-00135", category: "Water Leakage", location: "Ward 12", priority: "Medium", status: "Resolved", date: "24 Sep 2026", lat: 24.875, lng: 86.924, description: "Water leakage reported." }
];
let lastComplaintId = complaints[0].id, currentFilter = "All", reportStep = 1, reportMap, reportMarker, civicMap, selectedLat = 24.884, selectedLng = 86.919, uploaded = false, charts = {};

function saveData() { localStorage.setItem("civicsetu_complaints", JSON.stringify(complaints)) }
function toast(msg) {
    const el = document.createElement("div"); el.className = "toastx"; el.innerHTML = '<i class="fa-solid fa-circle-check me-2" style="color:#7ee2a7"></i>' + msg;
    document.getElementById("toastWrap").appendChild(el); setTimeout(() => el.remove(), 3000);
}
function showPage(name) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const p = document.getElementById("page-" + name); if (p) p.classList.add("active");
    document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "dashboard") renderDashboard();
    if (name === "complaints") renderComplaints();
    if (name === "map") setTimeout(initCivicMap, 100);
    if (name === "admin") adminTab("dashboard");
}
function openReport() { showPage("report"); resetReport() }
function resetReport() {
    reportStep = 1; uploaded = false; document.getElementById("photoInput").value = "";
    document.getElementById("uploadContent").classList.remove("hidden"); document.getElementById("previewContent").classList.add("hidden");
    document.getElementById("toAI").disabled = true; document.getElementById("aiLoading").classList.remove("hidden"); document.getElementById("aiResult").classList.add("hidden"); document.getElementById("aiContinue").disabled = true;
    document.getElementById("category").value = "Garbage / Waste"; document.getElementById("priority").value = "High"; document.getElementById("description").value = "";
    updateReportStep();
}
function updateReportStep() {
    for (let i = 1; i <= 5; i++)document.getElementById("rstep" + i).classList.toggle("active", i === reportStep);
    const names = ["Photo", "AI Analysis", "Details", "Location", "Review"]; document.getElementById("stepText").textContent = `Step ${reportStep} of 5`; document.getElementById("stepName").textContent = names[reportStep - 1]; document.getElementById("reportProgress").style.width = (reportStep * 20) + "%";
    if (reportStep === 2 && uploaded) { document.getElementById("aiLoading").classList.remove("hidden"); document.getElementById("aiResult").classList.add("hidden"); document.getElementById("aiContinue").disabled = true; setTimeout(() => { document.getElementById("aiLoading").classList.add("hidden"); document.getElementById("aiResult").classList.remove("hidden"); document.getElementById("aiContinue").disabled = false }, 900) }
    if (reportStep === 4) initReportMap();
    if (reportStep === 5) renderReview();
}
function nextReportStep() { if (reportStep === 3 && !document.getElementById("description").value.trim()) { toast("Please add a short description."); return } if (reportStep < 5) { reportStep++; updateReportStep() } }
function prevReportStep() { if (reportStep > 1) { reportStep--; updateReportStep() } }
function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) { toast("Please select an image file."); return }
    const reader = new FileReader(); reader.onload = e => { document.getElementById("imagePreview").src = e.target.result; document.getElementById("fileName").textContent = file.name; document.getElementById("uploadContent").classList.add("hidden"); document.getElementById("previewContent").classList.remove("hidden"); uploaded = true; document.getElementById("toAI").disabled = false }; reader.readAsDataURL(file)
}
document.getElementById("photoInput").addEventListener("change", e => handleFile(e.target.files[0]));
["dragenter", "dragover"].forEach(ev => document.getElementById("uploadZone").addEventListener(ev, e => { e.preventDefault(); document.getElementById("uploadZone").classList.add("drag") }));
["dragleave", "drop"].forEach(ev => document.getElementById("uploadZone").addEventListener(ev, e => { e.preventDefault(); document.getElementById("uploadZone").classList.remove("drag") }));
document.getElementById("uploadZone").addEventListener("drop", e => handleFile(e.dataTransfer.files[0]));
function removePhoto(e) { e.stopPropagation(); uploaded = false; document.getElementById("photoInput").value = ""; document.getElementById("uploadContent").classList.remove("hidden"); document.getElementById("previewContent").classList.add("hidden"); document.getElementById("toAI").disabled = true }
function initReportMap() {
    if (reportMap) { reportMap.invalidateSize(); return }
    reportMap = L.map("reportMap").setView([selectedLat, selectedLng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(reportMap);
    setReportLocation(selectedLat, selectedLng);
    reportMap.on("click", e => setReportLocation(e.latlng.lat, e.latlng.lng));
}
function setReportLocation(lat, lng) {
    selectedLat = Number(lat); selectedLng = Number(lng); document.getElementById("lat").value = selectedLat.toFixed(6); document.getElementById("lng").value = selectedLng.toFixed(6);
    if (reportMarker) reportMarker.setLatLng([selectedLat, selectedLng]); else reportMarker = L.marker([selectedLat, selectedLng]).addTo(reportMap);
}
function useMyLocation() {
    if (!navigator.geolocation) { toast("Geolocation is unavailable. Using demo location."); return }
    navigator.geolocation.getCurrentPosition(p => { setReportLocation(p.coords.latitude, p.coords.longitude); reportMap.setView([p.coords.latitude, p.coords.longitude], 16); toast("Your browser location was selected.") }, () => toast("Location permission was not available. Using the demo location."));
}
function renderReview() {
    const photo = document.getElementById("imagePreview").src;
    document.getElementById("reviewBox").innerHTML = `
 <div class="row g-4 align-items-center">
 <div class="col-md-4">${photo ? `<img src="${photo}" class="img-fluid rounded-4" style="max-height:190px;object-fit:cover">` : `<div class="rounded-4 p-5 text-center bg-light"><i class="fa-solid fa-image fa-3x text-muted"></i></div>`}</div>
 <div class="col-md-8"><div class="row g-3">
 <div class="col-sm-6"><span class="small-muted">Category</span><div class="fw-bold">${esc(document.getElementById("category").value)}</div></div>
 <div class="col-sm-6"><span class="small-muted">Priority</span><div><span class="badge-status ${priorityClass(document.getElementById("priority").value)}">${esc(document.getElementById("priority").value)}</span></div></div>
 <div class="col-12"><span class="small-muted">Description</span><div class="fw-semibold">${esc(document.getElementById("description").value)}</div></div>
 <div class="col-12"><span class="small-muted">Location</span><div class="fw-semibold">${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}</div></div>
 </div></div></div>`;
}
function submitComplaint() {
    const id = "CSB-2026-" + String(Date.now()).slice(-5);
    const c = { id, category: document.getElementById("category").value, location: "Selected Map Location", priority: document.getElementById("priority").value, status: "Reported", date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), lat: selectedLat, lng: selectedLng, description: document.getElementById("description").value };
    complaints.unshift(c); lastComplaintId = id; saveData();
    document.getElementById("successId").textContent = id; document.getElementById("successCategory").textContent = c.category; showPage("success");
    toast("Complaint submitted successfully.");
}
function renderDashboard() {
    const total = complaints.length, pending = complaints.filter(x => x.status === "Pending").length, prog = complaints.filter(x => x.status === "In Progress").length, res = complaints.filter(x => x.status === "Resolved").length;
    document.getElementById("dashboardKpis").innerHTML = [["fa-file-circle-plus", total, "Total Reports"], ["fa-clock", pending, "Pending"], ["fa-spinner", prog, "In Progress"], ["fa-circle-check", res, "Resolved"]].map(x => `<div class="col-6 col-md-3"><div class="kpi"><i class="fa-solid ${x[0]} text-primary"></i><div class="num">${x[1]}</div><div class="label">${x[2]}</div></div></div>`).join("");
    document.getElementById("recentBody").innerHTML = complaints.slice(0, 5).map(c => `<tr><td><strong>${c.id}</strong></td><td>${esc(c.category)}</td><td>${esc(c.location)}</td><td><span class="badge-status ${priorityClass(c.priority)}">${c.priority}</span></td><td>${statusBadge(c.status)}</td><td><button class="btn btn-sm btn-outline-primary" onclick="showComplaint('${c.id}')">View</button></td></tr>`).join("");
}
function statusBadge(s) { let cls = s === "Resolved" ? "status-resolved" : s === "In Progress" ? "status-progress" : s === "Pending" ? "status-pending" : "status-reported"; return `<span class="badge-status ${cls}">${esc(s)}</span>` }
function priorityClass(p) { return p === "High" ? "priority-high" : p === "Medium" ? "priority-medium" : "priority-low" }
function setFilter(f) { currentFilter = f; document.querySelectorAll(".filterBtn").forEach(b => { b.classList.toggle("btn-primary", b.dataset.filter === f); b.classList.toggle("btn-outline-secondary", b.dataset.filter !== f) }); renderComplaints() }
function renderComplaints() {
    const q = (document.getElementById("complaintSearch")?.value || "").toLowerCase();
    let arr = complaints.filter(c => (currentFilter === "All" || c.status === currentFilter) && (!q || c.id.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)));
    document.getElementById("complaintsBody").innerHTML = arr.length ? arr.map(c => `<tr><td><strong>${c.id}</strong></td><td>${esc(c.category)}</td><td>${esc(c.location)}</td><td><span class="badge-status ${priorityClass(c.priority)}">${c.priority}</span></td><td>${statusBadge(c.status)}</td><td>${c.date}</td><td><button class="btn btn-sm btn-outline-primary" onclick="showComplaint('${c.id}')">View</button></td></tr>`).join("") : `<tr><td colspan="7"><div class="empty"><i class="fa-solid fa-inbox fa-2x mb-2"></i><br>No complaints found.</div></td></tr>`;
}
function showComplaint(id) {
    const c = complaints.find(x => x.id === id); if (!c) return;
    lastComplaintId = id; document.getElementById("detailId").textContent = c.id; document.getElementById("detailStatus").outerHTML = statusBadge(c.status).replace("span>", 'span id="detailStatus">');
    document.getElementById("detailInfo").innerHTML = `<div class="row g-4"><div class="col-sm-6"><span class="small-muted">Category</span><div class="fw-bold">${esc(c.category)}</div></div><div class="col-sm-6"><span class="small-muted">Priority</span><div><span class="badge-status ${priorityClass(c.priority)}">${c.priority}</span></div></div><div class="col-12"><span class="small-muted">Description</span><div>${esc(c.description || "No description provided.")}</div></div><div class="col-sm-6"><span class="small-muted">Location</span><div class="fw-bold">${esc(c.location)}</div></div><div class="col-sm-6"><span class="small-muted">Reported</span><div class="fw-bold">${c.date}</div></div></div>`;
    const statuses = ["Reported", "Verified", "Assigned", "In Progress", "Resolved"], idx = statuses.indexOf(c.status);
    document.getElementById("timeline").innerHTML = statuses.map((s, i) => `<div class="timeline-item ${i <= idx ? "done" : ""} ${i === idx ? "current" : ""}"><strong>${s}</strong><div class="small-muted">${i <= idx ? (i === idx ? "Current status" : "Completed") : "Waiting for update"}</div></div>`).join("");
    showPage("detail");
}
function initCivicMap() {
    if (civicMap) { civicMap.invalidateSize(); return }
    civicMap = L.map("civicMap").setView([24.884, 86.919], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(civicMap);
    complaints.forEach(c => {
        if (!c.lat) return;
        const color = c.status === "Resolved" ? "green" : c.priority === "High" ? "red" : "gold";
        const icon = L.divIcon({ className: "", html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px #0005"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
        L.marker([c.lat, c.lng], { icon }).addTo(civicMap).bindPopup(`<strong>${esc(c.category)}</strong><br>${esc(c.location)}<br>${statusBadge(c.status)}<br><br><button class="btn btn-sm btn-primary" onclick="showComplaint('${c.id}')">View Complaint</button>`);
    });
}
function adminTab(tab) {
    showPageRaw("admin");
    const total = complaints.length, pending = complaints.filter(x => x.status === "Pending").length, prog = complaints.filter(x => x.status === "In Progress").length, res = complaints.filter(x => x.status === "Resolved").length;
    if (tab === "dashboard") {
        document.getElementById("adminContent").innerHTML = `<div class="d-flex flex-wrap justify-content-between align-items-center mb-4"><div><h2 class="fw-black">Admin Dashboard</h2><p class="small-muted">Civic issue management overview.</p></div><button class="btn btn-primary" onclick="adminTab('complaints')"><i class="fa-solid fa-list me-2"></i>Manage Complaints</button></div>
 <div class="row g-3 mb-4">${[["Total Complaints", total, "fa-file-lines"], ["Pending", pending, "fa-clock"], ["In Progress", prog, "fa-spinner"], ["Resolved", res, "fa-circle-check"]].map(x => `<div class="col-6 col-xl-3"><div class="kpi"><i class="fa-solid ${x[2]} text-primary"></i><div class="num">${x[1]}</div><div class="label">${x[0]}</div></div></div>`).join("")}</div>
 <div class="row g-4"><div class="col-lg-6"><div class="cardx"><h5 class="fw-bold">Complaints by Category</h5><canvas id="catChart"></canvas></div></div><div class="col-lg-6"><div class="cardx"><h5 class="fw-bold">Complaints by Status</h5><canvas id="statusChart"></canvas></div></div></div>`;
        setTimeout(renderCharts, 50);
    } else if (tab === "complaints") {
        document.getElementById("adminContent").innerHTML = `<div class="d-flex justify-content-between align-items-center mb-4"><div><h2 class="fw-black">Complaint Management</h2><p class="small-muted">Review reports and update their status.</p></div></div><div class="cardx"><div class="table-responsive"><table class="table align-middle"><thead><tr><th>ID</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Date</th><th>Update</th></tr></thead><tbody>${complaints.map(c => `<tr><td><strong>${c.id}</strong></td><td>${esc(c.category)}</td><td>${esc(c.location)}</td><td><span class="badge-status ${priorityClass(c.priority)}">${c.priority}</span></td><td>${statusBadge(c.status)}</td><td>${c.date}</td><td><select class="form-select form-select-sm" onchange="updateStatus('${c.id}',this.value)">${["Reported", "Verified", "Assigned", "In Progress", "Resolved"].map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div></div>`;
    } else {
        document.getElementById("adminContent").innerHTML = `<div class="mb-4"><h2 class="fw-black">Analytics</h2><p class="small-muted">Demo analytics for hackathon presentation.</p></div><div class="row g-4"><div class="col-lg-7"><div class="cardx"><h5 class="fw-bold">Complaints by Priority</h5><canvas id="priorityChart"></canvas></div></div><div class="col-lg-5"><div class="cardx"><h5 class="fw-bold">Resolution Overview</h5><canvas id="trendChart"></canvas></div></div></div>`; setTimeout(renderAnalytics, 50);
    }
}
function showPageRaw(name) { document.querySelectorAll(".page").forEach(p => p.classList.remove("active")); document.getElementById("page-" + name).classList.add("active"); window.scrollTo({ top: 0, behavior: "smooth" }) }
function updateStatus(id, status) { const c = complaints.find(x => x.id === id); if (c) { c.status = status; saveData(); toast(`${id} updated to ${status}.`); adminTab("complaints") } }
function renderCharts() {
    Object.values(charts).forEach(c => { try { c.destroy() } catch (e) { } }); charts = {};
    const cats = {}; complaints.forEach(c => cats[c.category] = (cats[c.category] || 0) + 1);
    const sts = { Pending: 0, "In Progress": 0, Resolved: 0, Reported: 0 }; complaints.forEach(c => sts[c.status] = (sts[c.status] || 0) + 1);
    charts.a = new Chart(document.getElementById("catChart"), { type: "bar", data: { labels: Object.keys(cats), datasets: [{ label: "Reports", data: Object.values(cats) }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
    charts.b = new Chart(document.getElementById("statusChart"), { type: "doughnut", data: { labels: Object.keys(sts), datasets: [{ data: Object.values(sts) }] }, options: { responsive: true } });
}
function renderAnalytics() {
    Object.values(charts).forEach(c => { try { c.destroy() } catch (e) { } }); charts = {};
    const pri = { High: 0, Medium: 0, Low: 0 }; complaints.forEach(c => pri[c.priority]++);
    charts.a = new Chart(document.getElementById("priorityChart"), { type: "bar", data: { labels: Object.keys(pri), datasets: [{ label: "Reports", data: Object.values(pri) }] }, options: { responsive: true } });
    const res = complaints.filter(c => c.status === "Resolved").length;
    charts.b = new Chart(document.getElementById("trendChart"), { type: "doughnut", data: { labels: ["Resolved", "Open"], datasets: [{ data: [res, complaints.length - res] }] }, options: { responsive: true } });
}
function login(e) { e.preventDefault(); const email = document.getElementById("loginEmail").value; localStorage.setItem("civicsetu_user", JSON.stringify({ name: email.split("@")[0], email })); document.getElementById("sideUser").textContent = email.split("@")[0]; toast("Login successful — demo mode."); showPage("dashboard") }
function register(e) { e.preventDefault(); if (document.getElementById("regPass").value !== document.getElementById("regConfirm").value) { toast("Passwords do not match."); return } const user = { name: document.getElementById("regName").value, email: document.getElementById("regEmail").value }; localStorage.setItem("civicsetu_user", JSON.stringify(user)); document.getElementById("sideUser").textContent = user.name; toast("Account created in demo mode."); showPage("dashboard") }
function saveProfile() { const name = document.getElementById("profileName").value; localStorage.setItem("civicsetu_user", JSON.stringify({ name, email: document.getElementById("profileEmail").value })); document.getElementById("sideUser").textContent = name; toast("Profile saved locally.") }
function toggleDark(on) { document.body.classList.toggle("dark", on); localStorage.setItem("civicsetu_dark", on ? "1" : "0") }
function setLang(lang) { document.getElementById("langLabel").textContent = lang === "hi" ? "हिन्दी" : "English"; if (lang === "hi") { toast("हिन्दी मोड डेमो के लिए चुना गया है। मुख्य UI labels अभी आंशिक हैं।") } else toast("English selected.") }
function trackDemo() { showComplaint(complaints[0].id) }
function copyId() { navigator.clipboard?.writeText(lastComplaintId); toast("Complaint ID copied.") }
function closeModal() { document.getElementById("modal").classList.remove("show") }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])) }

document.getElementById("categoryCards").innerHTML = CATEGORIES.map(c => `<div class="col-md-6 col-lg-4"><div class="cardx category-card" onclick="openReportWithCategory('${c.name}')"><div class="icon-box"><i class="fa-solid ${c.icon}"></i></div><h5>${c.name}</h5><p>${c.desc}</p><span class="text-primary fw-bold small">Report issue <i class="fa-solid fa-arrow-right ms-1"></i></span></div></div>`).join("");
function openReportWithCategory(cat) { openReport(); document.getElementById("category").value = cat }
const savedUser = JSON.parse(localStorage.getItem("civicsetu_user") || "null"); if (savedUser) { document.getElementById("sideUser").textContent = savedUser.name || "Citizen"; document.getElementById("profileName").value = savedUser.name || "Citizen User"; document.getElementById("profileEmail").value = savedUser.email || "citizen@example.com" }
if (localStorage.getItem("civicsetu_dark") === "1") document.getElementById("darkToggle").checked = true, document.body.classList.add("dark");
showPage("home");

