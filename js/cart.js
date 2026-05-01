const CART_KEY = 'samb_cart';
const WAVE_CART_URL = 'https://pay.wave.com/m/M_sn_wc5IA863ZfIm/c/sn/';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderCart();
  setupListeners();
});

function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  cart = stored ? JSON.parse(stored) : [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function setupListeners() {
  document.getElementById('deliveryZone')?.addEventListener('change', renderCart);
  document.getElementById('whatsappBtn')?.addEventListener('click', sendWhatsApp);
  const waveBtn = document.getElementById('wavePayBtn');
  if (waveBtn) {
    waveBtn.target = '_blank';
  }
}

function renderCart() {
  renderCartItems();
  renderSummary();
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x fs-1 text-muted"></i>
        <p class="mt-3 mb-0 text-muted">Votre panier est vide.</p>
        <a href="index.html" class="btn btn-outline-primary mt-3">Retour à la boutique</a>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map((item, index) => {
    const colorDisplay = item.color ? `<div class="text-muted small mb-2">🎨 Couleur: ${item.color}</div>` : '';
    return `
    <div class="d-flex align-items-center mb-3 p-3 border rounded">
      <img src="${item.image}" alt="${item.name}" class="rounded me-3" style="width:80px; height:80px; object-fit:cover;" />
      <div class="flex-grow-1">
        <h6 class="mb-1">${item.name}</h6>
        <div class="text-muted small mb-2">Taille: ${item.size}</div>
        ${colorDisplay}
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${index}, -1)">-</button>
          <span class="px-3 py-1 border rounded">${item.qty}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${index}, 1)">+</button>
          <span class="fw-semibold ms-3">${(item.price * item.qty).toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger ms-3" onclick="removeItem(${index})"><i class="bi bi-trash"></i></button>
    </div>
  `;
  }).join('');

}

window.changeQty = (index, direction) => {
  if (!cart[index]) return;
  cart[index].qty += direction;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
};

window.removeItem = index => {
  cart.splice(index, 1);
  saveCart();
  renderCart();
};

function getDeliveryFee() {
  const zone = document.getElementById('deliveryZone')?.value;
  return zone === 'banlieue' ? 2000 : zone === 'ville' ? 3000 : 0;
}

function renderSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;

  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl = document.getElementById('cartTotal');
  const waveBtn = document.getElementById('wavePayBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');

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

  if (whatsappBtn) {
    whatsappBtn.disabled = total === 0;
  }
}

function sendWhatsApp() {
  if (!cart.length) {
    alert('Votre panier est vide. Ajoutez des produits avant de commander.');
    return;
  }

  const name = document.getElementById('custName')?.value.trim() || 'Non renseigné';
  const phone = document.getElementById('custPhone')?.value.trim() || 'Non renseigné';
  const location = document.getElementById('custLocation')?.value.trim() || 'Non renseigné';
  const email = document.getElementById('custEmail')?.value.trim() || 'Non renseigné';
  const zone = document.getElementById('deliveryZone')?.value || 'Non renseigné';
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;

  if (total === 0) {
    alert('Votre panier est vide. Ajoutez des produits avant de commander.');
    return;
  }

  let message = '🛍️ *NOUVELLE COMMANDE - SambStore*\n\n';
  message += '*Client*:\n';
  message += `• Nom: ${name}\n`;
  message += `• Téléphone: ${phone}\n`;
  message += `• Localisation: ${location}\n`;
  message += `• Email: ${email}\n`;
  message += `• Zone de livraison: ${zone}\n\n`;
  message += '*Produits*:\n';

  cart.forEach(item => {
    const colorInfo = item.color ? ` - 🎨 ${item.color}` : '';
    message += `• ${item.name} (Taille: ${item.size}${colorInfo}) x${item.qty} = ${(item.price * item.qty).toLocaleString('fr-FR')} FCFA\n`;
  });

  message += `\n*Sous-total:* ${subtotal.toLocaleString('fr-FR')} FCFA\n`;
  message += `*Livraison:* ${delivery.toLocaleString('fr-FR')} FCFA\n`;
  message += `*Total:* ${total.toLocaleString('fr-FR')} FCFA\n\n`;
  message += 'Je confirme ma commande et attends les instructions de livraison.';

  const whatsappNumber = '221704776642';
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
}
