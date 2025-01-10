// Gestion du panier
let cart = [];
const cartIcon = document.getElementById('cart-icon'); // Vérifiez que cet ID existe dans index.html
const cartCount = document.getElementById('cart-count'); // Vérifiez que cet ID existe dans index.html
const cartModal = document.getElementById('cart-modal'); // Vérifiez que cet ID existe dans index.html
const quitModal = document.getElementById('quit-modal'); // Vérifiez que cet ID existe dans index.html
const cartItems = document.getElementById('cart-items'); // Vérifiez que cet ID existe dans index.html
const totalPrice = document.getElementById('total-price'); // Vérifiez que cet ID existe dans index.html
const clearCartBtn = document.getElementById('clear-cart'); // Vérifiez que cet ID existe dans index.html
const proceedToPaymentBtn = document.getElementById('proceed-to-payment'); // Vérifiez que cet ID existe dans index.html
const tableNumberInput = document.getElementById('table-number'); // Vérifiez que cet ID existe dans index.html

// Ouvrir le modal du panier
cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'flex';
    setTimeout(() => {
        cartModal.style.opacity = '1';
        document.body.style.overflow = 'hidden'; // Empêcher le défilement
    }, 10);
    updateCartDisplay();
});

// Fermer le modal du panier
quitModal.addEventListener('click', () => {
    cartModal.style.opacity = '0';
    setTimeout(() => {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Réactiver le défilement
    }, 300);
});

// Fermer le modal en cliquant en dehors
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.opacity = '0';
        setTimeout(() => {
            cartModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
});

// Animation lors de l'ajout au panier
function animateAddToCart(button) {
    button.classList.add('adding');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading';
    button.appendChild(loadingSpinner);
    
    setTimeout(() => {
        button.classList.remove('adding');
        loadingSpinner.remove();
        button.classList.add('added');
        
        setTimeout(() => {
            button.classList.remove('added');
        }, 1500);
    }, 1000);
}

// Mettre à jour l'affichage du panier
function updateCartDisplay() {
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.price} FCFA</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn minus" data-index="${index}">-</button>
                <span class="quantity">${item.quantity || 1}</span>
                <button class="quantity-btn plus" data-index="${index}">+</button>
            </div>
            <p class="item-total">${(item.price * (item.quantity || 1))} FCFA</p>
            <button class="remove-item" data-index="${index}">×</button>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * (item.quantity || 1);
    });

    totalPrice.textContent = `${total} FCFA`;
    updateCartCount();

    // Activer/désactiver le bouton de paiement
    if (cart.length > 0 && tableNumberInput.value) {
        proceedToPaymentBtn.classList.remove('disabled');
    } else {
        proceedToPaymentBtn.classList.add('disabled');
    }

    // Ajouter les gestionnaires d'événements pour les boutons + et -
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const item = cart[index];
            
            if (this.classList.contains('plus')) {
                item.quantity = (item.quantity || 1) + 1;
            } else if (this.classList.contains('minus')) {
                if ((item.quantity || 1) > 1) {
                    item.quantity = item.quantity - 1;
                }
            }
            
            // Sauvegarder le panier mis à jour
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        });
    });
}

// Gestion des boutons d'ajout au panier
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const item = {
            name: this.dataset.name,
            price: parseInt(this.dataset.price),
            image: this.dataset.image,
            quantity: 1
        };
        
        // Vérifier si l'article est déjà dans le panier
        const existingItemIndex = cart.findIndex(cartItem => 
            cartItem.name === item.name
        );

        if (existingItemIndex !== -1) {
            // Si l'article existe déjà, augmenter la quantité
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
        } else {
            // Sinon, ajouter le nouvel article
            cart.push(item);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
        animateAddToCart(this);
    });
});

// Supprimer un article du panier
cartItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        const index = parseInt(e.target.dataset.index);
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
});

// Vider le panier
clearCartBtn.addEventListener('click', () => {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
});

// Mise à jour du compteur du panier
function updateCartCount() {
    cartCount.textContent = cart.length;
}

// Vérification du numéro de table
tableNumberInput.addEventListener('input', () => {
    const value = parseInt(tableNumberInput.value);
    if (value >= 1 && value <= 50) {
        tableNumberInput.classList.remove('invalid');
        if (cart.length > 0) {
            proceedToPaymentBtn.classList.remove('disabled');
        }
    } else {
        tableNumberInput.classList.add('invalid');
        proceedToPaymentBtn.classList.add('disabled');
    }
});

// Gestion du bouton de paiement
proceedToPaymentBtn.addEventListener('click', (e) => {
    if (!tableNumberInput.value || cart.length === 0) {
        e.preventDefault();
        alert('Veuillez sélectionner une table et ajouter des articles au panier.');
    } else {
        // Sauvegarder les données de la commande dans le localStorage
        const orderData = {
            items: cart.map(item => ({
                ...item,
                quantity: item.quantity || 1
            })),
            tableNumber: tableNumberInput.value,
            totalAmount: totalPrice.textContent,
            orderDate: new Date().toISOString()
        };
        localStorage.setItem('currentOrder', JSON.stringify(orderData));
        
        // Vider le panier
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        cartModal.style.opacity = '0';
        setTimeout(() => {
            cartModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
});

// Animation au scroll
function revealOnScroll() {
    const elements = document.querySelectorAll('.menu-item');
    elements.forEach((element, index) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}

// Lazy loading des images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageOptions = {
        threshold: 0,
        rootMargin: '0px 0px 50px 0px'
    };
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, imageOptions);
    
    images.forEach(img => imageObserver.observe(img));
}

// Fonction pour le défilement horizontal fluide
function initializeHorizontalScroll() {
    const menuGrids = document.querySelectorAll('.menu-grid');
    
    menuGrids.forEach(grid => {
        let isDown = false;
        let startX;
        let scrollLeft;

        grid.addEventListener('mousedown', (e) => {
            isDown = true;
            grid.style.cursor = 'grabbing';
            startX = e.pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        });

        grid.addEventListener('mouseleave', () => {
            isDown = false;
            grid.style.cursor = 'grab';
        });

        grid.addEventListener('mouseup', () => {
            isDown = false;
            grid.style.cursor = 'grab';
        });

        grid.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });

        // Support tactile
        grid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        });

        grid.addEventListener('touchmove', (e) => {
            if (!startX) return;
            e.preventDefault();
            const x = e.touches[0].pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });

        grid.addEventListener('touchend', () => {
            startX = null;
        });
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeHorizontalScroll();
    // Vider le panier au chargement de la page
    cart = [];
    localStorage.removeItem('cart');
    updateCartDisplay();
    updateCartCount();

    // Mettre à jour l'heure
    updateTime();
    setInterval(updateTime, 1000);

    // Initialiser les animations
    window.addEventListener('scroll', () => {
        revealOnScroll();
        lazyLoadImages();
    });

    // Initialiser les gestionnaires d'événements
    setupEventListeners();
});

// Smooth scroll pour les liens d'ancrage
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function setupEventListeners() {
    // ... tous vos gestionnaires d'événements existants ici ...
}

function updateTime() {
    const currentTimeElement = document.querySelector('#current-time');
    if (currentTimeElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        currentTimeElement.textContent = `${hours}:${minutes}`;
    }
}