// /d:/Tugas Kuliah/Sosio/Web_LostAndFound/Frontend/app.js
// JavaScript untuk menghubungkan HTML + CSS frontend Lost & Found
// Fungsional: simpan di localStorage, tampilkan daftar, preview gambar, filter, cari, hapus, toggle status

(() => {
    const STORAGE_KEY = 'lostfound_items_v1';
    const form = document.getElementById('itemForm');
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const locInput = document.getElementById('location');
    const typeInput = document.getElementById('type'); // select or radio (lost/found)
    const imageInput = document.getElementById('image');
    const previewImg = document.getElementById('preview');
    const itemsList = document.getElementById('itemsList');
    const searchInput = document.getElementById('search');
    const filterType = document.getElementById('filterType'); // select: all/lost/found

    // --- util ---
    function loadItems() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveItems(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function genId() {
        return 'it_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function formatDateISO(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString();
    }

    // --- image preview ---
    if (imageInput && previewImg) {
        imageInput.addEventListener('change', () => {
            const file = imageInput.files && imageInput.files[0];
            if (!file) {
                previewImg.src = '';
                previewImg.style.display = 'none';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    // --- render ---
    function createCard(item) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card item-card';
        wrapper.dataset.id = item.id;

        const imgEl = document.createElement('img');
        imgEl.className = 'item-image';
        imgEl.alt = item.title || 'image';
        imgEl.src = item.image || '';
        if (!item.image) imgEl.style.display = 'none';

        const titleEl = document.createElement('h3');
        titleEl.textContent = item.title || '(No title)';

        const metaEl = document.createElement('div');
        metaEl.className = 'item-meta';
        metaEl.textContent = `${item.type || ''} • ${formatDateISO(item.date)} • ${item.location || ''}`;

        const descEl = document.createElement('p');
        descEl.className = 'item-desc';
        descEl.textContent = item.description || '';

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = item.resolved ? 'Marked Found' : item.type === 'lost' ? 'Mark Found' : 'Mark Returned';
        toggleBtn.className = 'btn btn-toggle';
        toggleBtn.addEventListener('click', () => {
            toggleResolved(item.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Hapus item ini?')) deleteItem(item.id);
        });

        actions.appendChild(toggleBtn);
        actions.appendChild(deleteBtn);

        wrapper.appendChild(imgEl);
        wrapper.appendChild(titleEl);
        wrapper.appendChild(metaEl);
        wrapper.appendChild(descEl);
        wrapper.appendChild(actions);

        if (item.resolved) wrapper.classList.add('resolved');

        return wrapper;
    }

    function renderItems() {
        if (!itemsList) return;
        const all = loadItems();
        const q = (searchInput && searchInput.value || '').trim().toLowerCase();
        const typeFilter = (filterType && filterType.value) || 'all';

        const filtered = all.filter(it => {
            if (typeFilter !== 'all' && it.type !== typeFilter) return false;
            if (!q) return true;
            return (
                (it.title || '').toLowerCase().includes(q) ||
                (it.description || '').toLowerCase().includes(q) ||
                (it.location || '').toLowerCase().includes(q)
            );
        });

        itemsList.innerHTML = '';
        if (!filtered.length) {
            itemsList.innerHTML = '<p class="empty">Tidak ada item.</p>';
            return;
        }

        const frag = document.createDocumentFragment();
        filtered.reverse().forEach(item => frag.appendChild(createCard(item)));
        itemsList.appendChild(frag);
    }

    // --- CRUD ---
    function addItem(item) {
        const items = loadItems();
        items.push(item);
        saveItems(items);
        renderItems();
    }

    function deleteItem(id) {
        const items = loadItems().filter(i => i.id !== id);
        saveItems(items);
        renderItems();
    }

    function toggleResolved(id) {
        const items = loadItems();
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return;
        items[idx].resolved = !items[idx].resolved;
        saveItems(items);
        renderItems();
    }

    // optional: upload image to backend; here we keep base64 in localStorage for simplicity
    // you can replace uploadImage function to POST FormData to your server and receive a hosted URL
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!titleInput) return;

        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const date = dateInput.value;
        const location = locInput.value.trim();
        const type = typeInput ? typeInput.value : 'lost';

        if (!title) {
            alert('Masukkan judul item.');
            return;
        }

        let imageData = '';
        const file = imageInput && imageInput.files && imageInput.files[0];
        if (file) {
            imageData = await readFileAsDataURL(file);
        }

        const item = {
            id: genId(),
            title,
            description,
            date,
            location,
            type,
            image: imageData,
            createdAt: new Date().toISOString(),
            resolved: false
        };

        // Jika Anda punya backend, ganti addItem dengan fetch POST ke API
        addItem(item);

        // reset form
        if (form) form.reset();
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
    }

    function readFileAsDataURL(file) {
        return new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(file);
        });
    }

    // --- event bindings ---
    document.addEventListener('DOMContentLoaded', renderItems);
    if (form) form.addEventListener('submit', handleFormSubmit);
    if (searchInput) searchInput.addEventListener('input', () => renderItems());
    if (filterType) filterType.addEventListener('change', () => renderItems());

    // expose for console debugging (optional)
    window.LostFound = {
        loadItems,
        saveItems,
        renderItems,
        addItem,
        deleteItem,
        toggleResolved
    };
})();