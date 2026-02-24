// SmartPOS Argentina - Frontend Logic (Vanilla JS)

// Mock Database (Products are usually loaded from PHP/MySQL)
const mockProducts = [
    { id: 1, name: "Yerba Mate Taragüi 1Kg", price: 3500, stock: 45, category: "almacen" },
    { id: 2, name: "Fernet Branca 750ml", price: 8900, stock: 12, category: "bebidas" },
    { id: 3, name: "Coca Cola V. Retornable 2L", price: 2100, stock: 30, category: "bebidas" },
    { id: 4, name: "Alfajor Guaymallen (Caja x 40)", price: 8500, stock: 5, category: "almacen" },
    { id: 5, name: "COMBO: Fernet + 2 Cocas", price: 12500, stock: 10, category: "combos" },
    { id: 6, name: "Vino Rutini Malbec", price: 14500, stock: 3, category: "bebidas" },
    { id: 7, name: "Cerveza Quilmes Lata 473ml", price: 1200, stock: 100, category: "bebidas" },
    { id: 8, name: "Fideos Matarazzo 500g", price: 950, stock: 80, category: "almacen" }
];

// App State
let cart = [];
let currentCategory = 'all';
let isAfipBilling = false; 
const IVA_RATE = 0.21;

// Elements
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('productSearch');
const categoryChips = document.querySelectorAll('.cat-chip');
const cartItemsContainer = document.getElementById('cartItems');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartCountBadge = document.getElementById('cartCount');

const subtotalEl = document.getElementById('subtotalAmount');
const ivaRow = document.getElementById('ivaRow');
const ivaEl = document.getElementById('ivaAmount');
const totalEl = document.getElementById('totalAmount');

const afipToggle = document.getElementById('afipToggle');
const billingStatusText = document.getElementById('billingStatusText');

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
};

// --- Initialization ---
const initApp = () => {
    renderProducts();
    updateClock();
    setInterval(updateClock, 1000);
    
    // Listeners
    searchInput.addEventListener('input', (e) => {
        renderProducts(e.target.value.toLowerCase());
    });

    categoryChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // UI Update
            categoryChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter Update
            currentCategory = e.target.dataset.cat;
            renderProducts(searchInput.value.toLowerCase());
        });
    });

    afipToggle.addEventListener('change', (e) => {
        isAfipBilling = e.target.checked;
        if(isAfipBilling) {
            billingStatusText.innerHTML = '<ion-icon name="shield-checkmark-outline"></ion-icon> Factura Electrónica AB/C';
            billingStatusText.classList.add('afip-mode');
            ivaRow.style.display = 'flex'; // Show IVA specifically for Fiscal bill if needed
        } else {
            billingStatusText.innerHTML = '<ion-icon name="receipt-outline"></ion-icon> Comprobante Interno (No fiscal)';
            billingStatusText.classList.remove('afip-mode');
            ivaRow.style.display = 'none';
        }
        updateCartTotals();
    });

    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if(cart.length > 0 && confirm('¿Estás seguro de vaciar la caja actual?')) {
            cart = [];
            renderCart();
        }
    });

    document.getElementById('payCashBtn').addEventListener('click', processPayment);
    document.getElementById('payCardBtn').addEventListener('click', processPayment);
};

// --- Products Logic ---
const renderProducts = (searchTerm = '') => {
    productsGrid.innerHTML = '';
    
    const filteredProducts = mockProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p style="color:var(--text-secondary); text-align:center; grid-column: 1/-1;">No se encontraron productos.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const isLowStock = product.stock < 10;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addToCart(product);

        card.innerHTML = `
            <div class="product-stock ${isLowStock ? 'stock-low' : ''}">Stock: ${product.stock}</div>
            <div class="product-img-box">
                <ion-icon name="bag-handle-outline"></ion-icon>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
            </div>
            <div class="product-price">${formatMoney(product.price)}</div>
        `;
        productsGrid.appendChild(card);
    });
};

// --- Cart Logic ---
const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if(existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('¡Stock insuficiente para este producto!');
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    renderCart();
    
    // Play a subtle sound or visual cue here in a real app
    // e.g. Animar la badge del carrito
    cartCountBadge.style.transform = 'scale(1.2)';
    setTimeout(() => cartCountBadge.style.transform = 'scale(1)', 200);
};

const removeFromCart = (productId) => {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
};

const updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        if (delta === 1 && item.quantity >= item.stock) {
            alert('Stock máximo alcanzado.');
            return;
        }
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
        }
    }
};

const renderCart = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalItems;

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'flex';
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(emptyCartMessage);
    } else {
        emptyCartMessage.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            
            row.innerHTML = `
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span class="price">${formatMoney(item.price)} C/U</span>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                        <ion-icon name="remove-outline"></ion-icon>
                    </button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                        <ion-icon name="add-outline"></ion-icon>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(row);
        });
    }

    updateCartTotals();
};

const updateCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let iva = 0;
    let total = subtotal;

    // Supongamos que en modo AFIP el precio mostrado previamente no incluia el IVA (o lo desglosamos)
    // Para simplificar: Si es recibo interno cobramos = subtotal. 
    // Si hacemos AFIP Responsable Inscripto (Factura A), mostramos IVA expuesto.
    if (isAfipBilling) {
        iva = subtotal * IVA_RATE;
        total = subtotal + iva;
    }

    subtotalEl.textContent = formatMoney(subtotal);
    if(isAfipBilling) ivaEl.textContent = formatMoney(iva);
    totalEl.textContent = formatMoney(total);
};

const processPayment = (e) => {
    if(cart.length === 0) {
        alert("Agrega productos al carrito primero.");
        return;
    }

    const type = e.target.closest('button').id === 'payCashBtn' ? 'Efectivo' : 'Tarjeta/Digital';
    const totalAmount = totalEl.textContent;

    let msg = `Cierre Exitoso: Cobrado ${totalAmount} con ${type}.\n`;
    if(isAfipBilling) {
        // Here we would call PHP: fetch('api/afip/generar_cae', { body: cart })
        msg += `\nGenerando CAE en AFIP... ¡Aprobado!`;
    } else {
        msg += `\nSe registró como Comprobante Interno (No fiscal). Descontando stock...`;
    }

    alert(msg);
    cart = [];
    renderCart();
};

// --- Utils ---
const updateClock = () => {
    const now = new Date();
    document.getElementById('live-clock').textContent = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

// Setup global functions for inline HTML onclicks
window.updateQuantity = updateQuantity;

// Boot
document.addEventListener('DOMContentLoaded', initApp);
