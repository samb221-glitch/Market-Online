let products = [];
let cart = [];
const WAVE_CART_URL = 'https://pay.wave.com/m/M_sn_wc5IA863ZfIm/c/sn/';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded: démarrage du chargement de produits.');
  await loadProducts();
  console.log('Produits chargés:', products.length);
  renderProducts(products);
  setupListeners();
  loadCart();
  observeSections();
});

async function loadProducts() {
  const productsUrl = './products.json?t=' + Date.now();
  console.log('Chargement de products.json depuis', productsUrl);
  try {
    const res = await fetch(productsUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    products = data.products || [];
    console.log('Produit chargé depuis products.json', products.length, 'articles');
  } catch (e) {
    console.warn('Mode démo : produits par défaut (products.json introuvable ou inaccessible)', e);
    showPageMessage(`Impossible de charger products.json depuis ${productsUrl}. Ouvrez la page via votre serveur local (XAMPP) et rechargez.`, 'warning');
    products = [
      {id:1,name:"T-shirt Homme",category:"homme",price:5000,image:"https://via.placeholder.com/400x300/2c3e50/fff?text=Homme",sizes:["S","M","L","XL"],description:"100% coton"},
      {id:2,name:"Robe Femme",category:"femme",price:12000,image:"https://via.placeholder.com/400x300/e84393/fff?text=Femme",sizes:["S","M","L"],description:"Élégante et légère"},
      {id:3,name:"Maillot Sénégal",category:"maillot",price:22000,image:"https://via.placeholder.com/400x300/27ae60/fff?text=Sénégal",sizes:["S","M","L","XL"],description:"Officiel 2024"}
    ];
  }
}

function showPageMessage(text, type = 'warning') {
  const container = document.getElementById('pageAlert');
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type} text-center" role="alert">${text}</div>`;
}



function renderProducts(list) {
  const c = document.getElementById('productsContainer');
  if (!c) {
    console.error('productsContainer introuvable dans le DOM.');
    return;
  }
  c.innerHTML = '';
  if(!list || !list.length) {
    c.innerHTML = '<p class="text-center col-12 text-muted">Aucun produit trouvé 😕</p>';
    return;
  }
  
  list.forEach(p => {
    const sizesHtml = Array.isArray(p.sizes) ? p.sizes.map(s => `<button class="btn btn-outline-secondary btn-sm size-btn" data-size="${s}">${s}</button>`).join('') : '';
    const colorsHtml = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors.map(c => `<button class="btn btn-outline-warning btn-sm color-btn" data-color="${c}" title="${c}">🎨 ${c}</button>`).join('') : '';
    const colorSection = colorsHtml ? `<div class="mb-2"><small class="text-muted">Couleurs :</small><div class="mt-1">${colorsHtml}</div></div>` : '';
    c.innerHTML += `
      <div class="col-md-3 col-sm-6 fade-in-section">
        <div class="card product-card h-100">
          <img src="${p.image}" class="card-img-top" alt="${p.name}">
          <div class="card-body d-flex flex-column">
            <span class="badge bg-info text-dark mb-2 align-self-start">${p.category ? p.category.toUpperCase() : ''}</span>
            <h5 class="card-title">${p.name}</h5>
            <p class="card-text text-muted small">${p.description || ''}</p>
            <div class="mb-2">
              <small class="text-muted">Tailles :</small>
              <div class="mt-1">${sizesHtml}</div>
            </div>
            ${colorSection}
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold text-primary fs-5">${p.price.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <button class="btn btn-primary w-100 cart-btn" data-id="${p.id}"><i class="bi bi-cart-plus"></i> Ajouter</button>
            </div>
          </div>
        </div>
      </div>`;
  });

  document.querySelectorAll('.size-btn').forEach(function(b) {
    b.onclick = function() {
      this.parentElement.querySelectorAll('.size-btn').forEach(function(x) { x.classList.remove('active'); });
      this.classList.add('active');
    };
  });
  
  document.querySelectorAll('.color-btn').forEach(function(b) {
    b.onclick = function() {
      this.parentElement.querySelectorAll('.color-btn').forEach(function(x) { x.classList.remove('active'); });
      this.classList.add('active');
    };
  });
  
  document.querySelectorAll('.cart-btn').forEach(function(b) {
    b.onclick = function() {
      const id = parseInt(this.dataset.id, 10);
      const prod = products.find(function(x) { return x.id === id; });
      const sizeBtn = this.closest('.card').querySelector('.size-btn.active');
      if(!sizeBtn) return alert('Veuillez sélectionner une taille \ud83d\udc55');
      const colorBtn = this.closest('.card').querySelector('.color-btn.active');
      const color = colorBtn ? colorBtn.dataset.color : null;
      addToCart(prod, sizeBtn.dataset.size, color);
    };
  });
}


function setupListeners() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  if (searchInput) searchInput.addEventListener('input', filter);
  if (categoryFilter) categoryFilter.addEventListener('change', filter);

  const deliveryZone = document.getElementById('deliveryZone');
  if (deliveryZone) deliveryZone.addEventListener('change', updateTotal);

  const waveBtn = document.getElementById('wavePayBtn');
  if (waveBtn) {
    waveBtn.target = '_blank';
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', sendWhatsApp);
  
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('✅ Message envoyé ! Nous vous répondrons sous 24h.');
      e.target.reset();
    });
  }
}


function filter() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  let res = products;
  if(cat !== 'all') res = res.filter(p => p.category === cat);
  if(term) res = res.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  renderProducts(res);
}

// === 🛒 PANIER ===
function addToCart(prod, size, color) {
  const exist = cart.find(i => i.id === prod.id && i.size === size && i.color === color);
  if(exist) exist.qty++;
  else cart.push({id: prod.id, name: prod.name, price: prod.price, size, color: color || null, image: prod.image, qty: 1});
  saveCart(); updateCount();
  const colorText = color ? ` (${color})` : '';
  alert(`✅ ${prod.name} (Taille ${size}${colorText}) ajouté au panier !`);
}

function renderCartSection() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const sectionCount = document.getElementById('cartSectionCount');
  const sectionItems = document.getElementById('cartSectionItems');

  if (sectionCount) {
    sectionCount.textContent = `${count} article${count > 1 ? 's' : ''}`;
  }

  if (sectionItems) {
    if (!count) {
      sectionItems.innerHTML = '<p class="text-muted mb-0">Votre panier est vide pour l\'instant. Ajoutez des produits pour voir votre commande ici.</p>';
    } else {
      sectionItems.innerHTML = cart.map((item, index) => {
        const colorDisplay = item.color ? `<br><small class="text-muted">🎨 ${item.color}</small>` : '';
        return `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div class="d-flex align-items-center gap-3 flex-grow-1">
            <img src="${item.image}" alt="${item.name}" class="rounded" style="width:70px; height:70px; object-fit:cover;" />
            <div>
              <strong>${item.name}</strong><br>
              <small class="text-muted">Taille ${item.size}</small>${colorDisplay}
              <div class="mt-2 d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty(${index}, -1)">-</button>
                <span class="px-3 py-1 border rounded">${item.qty}</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty(${index}, 1)">+</button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCartItem(${index})"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
          <span class="fw-semibold">${(item.price * item.qty).toLocaleString('fr-FR')} FCFA</span>
        </div>
      `;
      }).join('');
    }
  }
}

window.changeCartQty = (index, direction) => {
  if (!cart[index]) return;
  cart[index].qty += direction;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCount();
};

window.removeCartItem = index => {
  cart.splice(index, 1);
  saveCart();
  updateCount();
};

// === 💰 CALCUL DU TOTAL ===
function getDeliveryFee() {
  const zone = document.getElementById('deliveryZone')?.value;
  return zone === 'banlieue' ? 2000 : zone === 'ville' ? 3000 : 0;
}

function getDeliveryLabel() {
  const zone = document.getElementById('deliveryZone')?.value;
  return zone === 'banlieue' ? 'Dakar Banlieue' : zone === 'ville' ? 'Dakar Ville' : 'Retrait sur place';
}

function updateTotal() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;

  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl = document.getElementById('cartTotal');
  const waveBtn = document.getElementById('wavePayBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('fr-FR')} FCFA`;
  if (deliveryEl) deliveryEl.textContent = `${delivery.toLocaleString('fr-FR')} FCFA`;
  if (totalEl) totalEl.textContent = `${total.toLocaleString('fr-FR')} FCFA`;

  if (waveBtn) {
    waveBtn.textContent = total > 0 ? `Payer ${total.toLocaleString('fr-FR')} FCFA avec Wave` : 'Payer avec Wave';
    waveBtn.href = total > 0 ? WAVE_CART_URL : '#';
    waveBtn.classList.toggle('disabled', total === 0);
    waveBtn.setAttribute('aria-disabled', total === 0 ? 'true' : 'false');
    waveBtn.tabIndex = total === 0 ? -1 : 0;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = total === 0;
  }
}

// === 📱 WHATSAPP AVEC INFOS CLIENT ===
function sendWhatsApp() {
  // Vérification minimale
  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const location = document.getElementById('custLocation')?.value.trim();
  
  if(cart.length === 0) return alert('Panier vide !');
  if(!name || !phone || !location) {
    if(!confirm('⚠️ Certaines informations sont manquantes. Voulez-vous continuer quand même ?')) return;
  }
  
  const customerData = {
    name: name || 'Non renseigné',
    phone: phone || 'Non renseigné',
    location: location || 'Non renseigné',
    email: document.getElementById('custEmail')?.value.trim() || '-',
    zone: document.getElementById('deliveryZone')?.value || 'non choisie',
    total: cart.reduce((s,i)=>s+i.price*i.qty,0) + getDeliveryFee(),
    items: [...cart]
  };
  
  sendWhatsAppWithCustomerData(customerData);
}

function sendWhatsAppWithCustomerData(data) {
  let msg = `🛍️ *NOUVELLE COMMANDE - SambStore*\n\n`;
  msg += `👤 *Client*:\n`;
  msg += `• Nom: ${data.name}\n`;
  msg += `• Tél: ${data.phone}\n`;
  msg += `• Lieu: ${data.location}\n`;
  if(data.email !== '-') msg += `• Email: ${data.email}\n`;
  msg += `\n📦 *Commande*:\n`;
  
  data.items.forEach(i => {
    const colorInfo = i.color ? ` - 🎨 ${i.color}` : '';
    msg += `• ${i.name} (Taille: ${i.size}${colorInfo}) x${i.qty} = ${(i.price*i.qty).toLocaleString('fr-FR')} FCFA\n`;
  });
  
  msg += `\n🚚 *Livraison*: ${getDeliveryLabel()} (+${getDeliveryFee().toLocaleString('fr-FR')} FCFA)`;
  msg += `\n💰 *TOTAL PAYÉ/À PAYER*: ${data.total.toLocaleString('fr-FR')} FCFA`;
  msg += `\n\n📍 *Prochaine étape*: Je confirme ma commande et attends les instructions de livraison.`;
  
  // Numéro commercial (celui indiqué comme commercial)
  const whatsappNumber = '221704776642';
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

// === 🔄 UTILITAIRES ===
function updateCount() {
  var count = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  var cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = count;
  renderCartSection();
  updateTotal();
}

function saveCart() {
  localStorage.setItem('samb_cart', JSON.stringify(cart));
}

function loadCart() {
  var s = localStorage.getItem('samb_cart');
  if (s) {
    cart = JSON.parse(s);
    updateCount();
  }
}


function observeSections() {
  const sections = document.querySelectorAll('.fade-in-section');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')), {threshold:0.1});
  sections.forEach(el => obs.observe(el));
}