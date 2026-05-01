let products = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  renderTable();
  setupImageUpload();
  document.getElementById('exportBtn').addEventListener('click', openExportModal);
  document.getElementById('adminForm').addEventListener('submit', saveProduct);
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
});

async function loadProducts() {
  try {
    const res = await fetch('products.json?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = (await res.json()).products || [];
  } catch(e) {
    console.error('Impossible de charger products.json', e);
    alert('Erreur : impossible de charger products.json. Ouvrez admin.html depuis XAMPP/localhost et vérifiez le chemin.');
    products = [];
  }
}

function renderTable() {
  const tb = document.getElementById('prodTable');
  if(!products.length) { tb.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Aucun produit. Ajoutez-en un !</td></tr>'; return; }
  tb.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image || 'https://via.placeholder.com/60'}" class="rounded" style="width:60px;height:60px;object-fit:cover"></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge bg-${p.category==='homme'?'primary':p.category==='femme'?'danger':'success'}">${p.category}</span></td>
      <td class="fw-bold">${p.price.toLocaleString()} FCFA</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${p.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

// === 🖼️ UPLOAD IMAGE ===
function setupImageUpload() {
  const fileInput = document.getElementById('imageInput');
  const preview = document.getElementById('imagePreview');
  const base64Input = document.getElementById('imageBase64');
  const dropZone = document.getElementById('dropZone');
  const prompt = document.getElementById('uploadPrompt');

  fileInput.addEventListener('change', e => { if(e.target.files[0]) handleFile(e.target.files[0]); });
  ['dragenter','dragover','dragleave','drop'].forEach(evt => dropZone.addEventListener(evt, e => e.preventDefault()));
  ['dragenter','dragover'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.classList.add('dragover')));
  ['dragleave','drop'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover')));
  dropZone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) handleFile(f); });

  function handleFile(file) {
    if(file.size > 5*1024*1024) return alert('⚠️ Image trop lourde (Max 5 Mo)');
    const reader = new FileReader();
    reader.onload = e => {
      base64Input.value = e.target.result;
      preview.innerHTML = `<img src="${e.target.result}" class="preview-img mt-2" style="max-width:200px;max-height:200px;object-fit:cover;border-radius:8px"><div class="mt-2"><button type="button" class="btn btn-sm btn-outline-danger" onclick="clearImage()"><i class="bi bi-trash"></i> Supprimer</button></div>`;
      prompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
  window.clearImage = () => { base64Input.value = ''; fileInput.value = ''; preview.innerHTML = ''; prompt.classList.remove('hidden'); };
}

// === ✏️ CRUD ===
window.editProduct = id => {
  const p = products.find(x => x.id === id);
  if(!p) return;
  document.getElementById('editId').value = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCat').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pSizes').value = p.sizes.join(', ');
  document.getElementById('pColors').value = (p.colors || []).join(', ');
  document.getElementById('imageBase64').value = p.image || '';
  if(p.image && !p.image.startsWith('http')) {
    document.getElementById('imagePreview').innerHTML = `<img src="${p.image}" class="preview-img mt-2" style="max-width:200px;max-height:200px;object-fit:cover;border-radius:8px"><div class="mt-2"><button type="button" class="btn btn-sm btn-outline-danger" onclick="clearImage()"><i class="bi bi-trash"></i> Supprimer</button></div>`;
    document.getElementById('uploadPrompt').classList.add('hidden');
  }
  document.getElementById('formTitle').textContent = 'Modifier le produit';
  document.querySelector('#adminForm button[type="submit"]').innerHTML = '<i class="bi bi-check-lg"></i> Mettre à jour';
  window.scrollTo({top:0, behavior:'smooth'});
};

window.deleteProduct = id => {
  if(!confirm('Supprimer ce produit définitivement ?')) return;
  products = products.filter(x => x.id !== id);
  renderTable();
};

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const base64 = document.getElementById('imageBase64').value;
  const cat = document.getElementById('pCat').value;
  const defaultImg = `https://via.placeholder.com/400x300/6c757d/ffffff?text=${encodeURIComponent(cat)}`;
  const colors = document.getElementById('pColors').value.split(',').map(c => c.trim()).filter(Boolean);
  const prod = { id: id ? parseInt(id) : Date.now(), name: document.getElementById('pName').value.trim(), category: cat, price: parseInt(document.getElementById('pPrice').value), description: document.getElementById('pDesc').value.trim(), image: base64 || defaultImg, sizes: document.getElementById('pSizes').value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) };
  if(colors.length > 0) prod.colors = colors;
  
  if(id) { const i = products.findIndex(x => x.id === parseInt(id)); if(i>-1) products[i] = prod; } else { products.push(prod); }
  renderTable(); window.resetForm();
  alert('✅ Produit enregistré !\n📥 Cliquez sur "📥 Exporter products.json" pour sauvegarder.');
}

// === 📦 EXPORT GARANTI ===
function openExportModal() {
  if(!products.length) return alert('⚠️ Aucun produit à exporter !');
  document.getElementById('jsonOutput').value = JSON.stringify({ products: products }, null, 2);
  new bootstrap.Modal(document.getElementById('exportModal')).show();
}

function copyToClipboard() {
  const textarea = document.getElementById('jsonOutput');
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert('✅ JSON copié !\n1. Ouvrez Bloc-notes\n2. Collez (Ctrl+V)\n3. Enregistrez sous "products.json" (Type: Tous les fichiers)\n4. Remplacez l\'ancien fichier.');
  }).catch(() => {
    document.execCommand('copy');
    alert('✅ Texte copié ! Suivez les étapes dans la fenêtre.');
  });
}

window.resetForm = () => {
  document.getElementById('adminForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('imageBase64').value = '';
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('uploadPrompt').classList.remove('hidden');
  document.getElementById('pColors').value = '';
  document.getElementById('formTitle').textContent = 'Ajouter un produit';
  document.querySelector('#adminForm button[type="submit"]').innerHTML = '<i class="bi bi-save"></i> Enregistrer';
};