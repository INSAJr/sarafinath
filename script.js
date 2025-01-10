// Variables globales
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartIcon, cartCount, cartModal, quitModal, cartItemsList, totalPriceElement, proceedToPaymentButton, tableNumberInput, clearCartButton;

console.log("Script chargé");
// Initialisation des éléments DOM avec vérification de l'existence des éléments
function initializeElements() {
    cartIcon = document.getElementById('cart-icon');
    cartCount = document.getElementById('cart-count');
    cartModal = document.getElementById('cart-modal');
    quitModal = document.getElementById('quit-modal');
    cartItemsList = document.getElementById('cart-items');
    totalPriceElement = document.getElementById('total-price');
    proceedToPaymentButton = document.getElementById('proceed-to-payment');
    tableNumberInput = document.getElementById('table-number');
    clearCartButton = document.getElementById('clear-cart');

    // Vérification des éléments critiques
    console.log("Éléments initialisés:", {
        cartCount: !!cartCount,
        cartModal: !!cartModal,
        cartItemsList: !!cartItemsList
    });

    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    if (proceedToPaymentButton) {
        proceedToPaymentButton.addEventListener('click', handleProceedToPayment);
    }
}

// Fonction pour mettre à jour le compteur du panier
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    console.log("Mise à jour du compteur:", totalItems);

    // Mise à jour de tous les éléments compteur
    document.querySelectorAll('#cart-count').forEach(element => {
        element.textContent = totalItems;
    });
}

// Fonction pour ajouter un produit au panier
function addToCart(product) {
    console.log("Ajout au panier:", product);
    
    const existingProductIndex = cart.findIndex(item => item.name === product.name);
    
    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity = (cart[existingProductIndex].quantity || 1) + 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${product.name} ajouté au panier`);
}

// Vider le panier
function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    loadCart();
    showNotification('Panier vidé');
}

// Afficher la notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Force le reflow
    notification.offsetHeight;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Fonction pour ouvrir le modal du panier
function showCartModal() {
    console.log("Ouverture du modal");
    if (cartModal) {
        cartModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        loadCart();
    }
}

// Fonction pour fermer le modal du panier
function hideCartModal() {
    if (cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Charger le contenu du panier
function loadCart() {
    if (!cartItemsList || !totalPriceElement) return;

    cartItemsList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-cart">
                <p>Votre panier est vide</p>
                <p>Ajoutez des articles à partir du menu</p>
            </div>
        `;
        totalPriceElement.textContent = '0 FCFA';
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;

        const li = document.createElement('div');
        li.classList.add('cart-item');
        li.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <div class="cart-item-quantity-controls">
                    <button class="quantity-btn minus" data-index="${index}">-</button>
                    <span class="cart-item-quantity">Quantité: ${item.quantity || 1}</span>
                    <button class="quantity-btn plus" data-index="${index}">+</button>
                </div>
                <span class="cart-item-price">${itemTotal.toLocaleString()} FCFA</span>
            </div>
            <button class="remove-item" data-index="${index}">&times;</button>
        `;
        cartItemsList.appendChild(li);
    });

    totalPriceElement.textContent = `${total.toLocaleString()} FCFA`;
}

// Fonction pour mettre à jour la quantité
function updateQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity = (cart[index].quantity || 1) + delta;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        loadCart();
    }
}

// Fonction pour gérer la redirection vers la page de paiement
function handleProceedToPayment(e) {
    e.preventDefault();
    
    const tableNumber = tableNumberInput.value;
    
    // Validation du numéro de table
    if (!tableNumber || isNaN(tableNumber) || tableNumber < 1 || tableNumber > 50) {
        showNotification('Veuillez entrer un numéro de table valide (1-50)', 'error');
        return;
    }

    // Vérifier si le panier n'est pas vide
    if (cart.length === 0) {
        showNotification('Votre panier est vide !', 'error');
        return;
    }

    // Créer l'objet commande
    const order = {
        id: generateOrderId(),
        items: cart,
        total: calculateTotal(),
        status: 'en attente',
        timestamp: new Date().toISOString(),
        tableNumber: parseInt(tableNumber)
    };

    // Sauvegarder la commande dans le localStorage
    localStorage.setItem('currentOrder', JSON.stringify(order));

    // Rediriger vers la page de paiement
    window.location.href = 'payment.html';
}

// Fonction pour calculer le total
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
}

// Initialisation des événements
function initializeEvents() {
    // Événements pour les boutons "Ajouter au panier"
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const product = {
                name: button.dataset.name,
                price: parseInt(button.dataset.price),
                image: button.dataset.image
            };
            addToCart(product);
        });
    });

    // Événement pour l'icône du panier
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showCartModal();
        });
    }

    // Événement pour fermer le modal
    if (quitModal) {
        quitModal.addEventListener('click', (e) => {
            e.preventDefault();
            hideCartModal();
        });
    }

    // Délégation d'événements pour les boutons de quantité et suppression
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            
            if (e.target.classList.contains('plus')) {
                updateQuantity(index, 1);
            }
            else if (e.target.classList.contains('minus')) {
                updateQuantity(index, -1);
            }
            else if (e.target.classList.contains('remove-item')) {
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                loadCart();
                showNotification('Article supprimé du panier');
            }
        });
    }

    // Fermeture du modal en cliquant à l'extérieur
    document.addEventListener('click', function(event) {
        if (cartModal && event.target === cartModal) {
            hideCartModal();
        }
    });
}

// Fonction pour générer un ID unique pour la commande
function generateOrderId() {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation de l'application");
    initializeElements();
    initializeEvents();
    updateCartCount();
});