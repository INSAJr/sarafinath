// Fonction pour charger les commandes
function loadOrders() {
    // Récupérer les commandes du localStorage
    const orders = JSON.parse(localStorage.getItem('allOrders')) || [];
    
    // Vider les conteneurs existants
    document.querySelectorAll('.orders-grid').forEach(grid => {
        grid.innerHTML = '';
    });

    // Afficher les commandes dans leurs sections respectives
    orders.forEach(order => {
        // Mapper les statuts de payment.html vers les statuts du dashboard
        let dashboardStatus;
        switch(order.status) {
            case 'en attente':
            case 'pending':
                dashboardStatus = 'new-orders';
                break;
            case 'en préparation':
            case 'preparing':
                dashboardStatus = 'preparing-orders';
                break;
            case 'terminée':
            case 'completed':
                dashboardStatus = 'completed-orders';
                break;
            default:
                dashboardStatus = 'new-orders';
        }

        const section = document.querySelector(`#${dashboardStatus} .orders-grid`);
        if (section) {
            const orderCard = createOrderCard({
                id: order.orderId || order.id,
                status: dashboardStatus,
                tableNumber: order.tableNumber,
                items: order.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                total: order.totalAmount || order.total,
                timestamp: order.orderDate || order.timestamp || new Date().toISOString()
            });
            section.appendChild(orderCard);
        }
    });

    // Mettre à jour les compteurs
    updateOrderCounts(orders);
}

// Fonction pour mettre à jour les compteurs
function updateOrderCounts(orders) {
    const counts = {
        'new-orders': 0,
        'preparing-orders': 0,
        'completed-orders': 0
    };

    orders.forEach(order => {
        let status;
        switch(order.status) {
            case 'en attente':
            case 'pending':
                status = 'new-orders';
                break;
            case 'en préparation':
            case 'preparing':
                status = 'preparing-orders';
                break;
            case 'terminée':
            case 'completed':
                status = 'completed-orders';
                break;
            default:
                status = 'new-orders';
        }
        counts[status]++;
    });

    Object.keys(counts).forEach(status => {
        const counter = document.querySelector(`#${status} .orders-count`);
        if (counter) {
            counter.textContent = counts[status];
        }
    });
}

// Fonction pour changer le statut d'une commande
function changeOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('allOrders')) || [];
    const orderIndex = orders.findIndex(order => (order.orderId === orderId || order.id === orderId));
    
    if (orderIndex !== -1) {
        // Mapper les statuts du dashboard vers les statuts de payment.html
        let paymentStatus;
        switch(newStatus) {
            case 'preparing-orders':
                paymentStatus = 'en préparation';
                break;
            case 'completed-orders':
                paymentStatus = 'terminée';
                break;
            default:
                paymentStatus = 'en attente';
        }

        orders[orderIndex].status = paymentStatus;
        localStorage.setItem('allOrders', JSON.stringify(orders));
        loadOrders(); // Recharger l'affichage
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chargement initial...');
    loadOrders();
    setupTabHandlers();
    
    // Mettre à jour les commandes toutes les 30 secondes
    setInterval(loadOrders, 30000);
});

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction pour mettre à jour l'heure actuelle
function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('fr-FR');
    }
}

// Fonction pour mettre à jour le statut d'une commande
function updateOrderStatus(orderId, newStatus) {
    let allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    const orderIndex = allOrders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex !== -1) {
        allOrders[orderIndex].status = newStatus;
        localStorage.setItem('allOrders', JSON.stringify(allOrders));
        displayOrders();
        updateOrdersCount();
    }
}

// Fonction pour afficher une commande
function displayOrderCard(order, container) {
    const orderElement = document.createElement('div');
    orderElement.className = `order-card ${order.status.toLowerCase().replace(' ', '-')}`;
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3>Commande ${order.orderId}</h3>
            <span class="order-date">${formatDate(order.orderDate)}</span>
        </div>
        <div class="order-details">
            <p><strong>Table:</strong> ${order.tableNumber}</p>
            <p><strong>Montant:</strong> ${order.totalAmount}</p>
            <p><strong>Paiement:</strong> ${order.paymentMethod}</p>
            <div class="order-status">
                <select onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="en attente" ${order.status === 'en attente' ? 'selected' : ''}>En attente</option>
                    <option value="en préparation" ${order.status === 'en préparation' ? 'selected' : ''}>En préparation</option>
                    <option value="prêt" ${order.status === 'prêt' ? 'selected' : ''}>Prêt</option>
                    <option value="livré" ${order.status === 'livré' ? 'selected' : ''}>Livré</option>
                    <option value="annulé" ${order.status === 'annulé' ? 'selected' : ''}>Annulé</option>
                </select>
            </div>
        </div>
        <div class="order-items">
            <h4>Articles commandés:</h4>
            <ul>
                ${order.items.map(item => `
                    <li>
                        <img src="${item.image}" alt="${item.name}" class="item-thumbnail">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">x${item.quantity || 1}</span>
                        <span class="item-price">${item.price} FCFA</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        <div class="order-actions">
            <button onclick="printOrder('${order.orderId}')" class="action-button print">
                <i class="fas fa-print"></i> Imprimer
            </button>
        </div>
    `;
    
    container.appendChild(orderElement);
}

// Fonction pour imprimer une commande
function printOrder(orderId) {
    const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (!order) return;
    
    // Créer le contenu à imprimer
    const printContent = `
        <div class="print-order">
            <style>
                .print-order {
                    font-family: 'Arial', sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .print-details {
                    margin: 20px 0;
                }
                .print-items {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .print-items th, .print-items td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }
                .print-total {
                    text-align: right;
                    margin-top: 20px;
                    font-weight: bold;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-order, .print-order * {
                        visibility: visible;
                    }
                    .print-order {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            </style>
            <div class="print-header">
                <h1>SARAFINA</h1>
                <p>Commande #${order.orderId}</p>
                <p>${formatDate(order.orderDate)}</p>
            </div>
            <div class="print-details">
                <p><strong>Table:</strong> ${order.tableNumber}</p>
                <p><strong>Mode de paiement:</strong> ${order.paymentMethod}</p>
            </div>
            <table class="print-items">
                <thead>
                    <tr>
                        <th>Article</th>
                        <th>Quantité</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity || 1}</td>
                            <td>${item.price} FCFA</td>
                            <td>${(item.quantity || 1) * item.price} FCFA</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="print-total">
                <p>Total: ${order.totalAmount} FCFA</p>
            </div>
        </div>
    `;
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
}

// Fonction pour afficher les commandes
function displayOrders() {
    const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    
    // Vider tous les conteneurs
    document.getElementById('new-orders-container').innerHTML = '';
    document.getElementById('preparing-container').innerHTML = '';
    document.getElementById('completed-container').innerHTML = '';
    
    // Trier les commandes par date (plus récentes en premier)
    allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    // Distribuer les commandes dans les bons conteneurs
    allOrders.forEach(order => {
        let container;
        switch(order.status) {
            case 'en attente':
                container = document.getElementById('new-orders-container');
                break;
            case 'en préparation':
                container = document.getElementById('preparing-container');
                break;
            case 'prêt':
            case 'livré':
            case 'annulé':
                container = document.getElementById('completed-container');
                break;
            default:
                container = document.getElementById('new-orders-container');
        }
        
        if (container) {
            displayOrderCard(order, container);
        }
    });
}

// Fonction pour mettre à jour les compteurs
function updateOrdersCount() {
    const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    
    const pendingCount = allOrders.filter(order => order.status === 'en attente').length;
    const preparingCount = allOrders.filter(order => order.status === 'en préparation').length;
    const completedCount = allOrders.filter(order => 
        ['prêt', 'livré', 'annulé'].includes(order.status)
    ).length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('preparing-count').textContent = preparingCount;
    document.getElementById('completed-count').textContent = completedCount;
}

// Fonction pour rechercher des commandes
function searchOrders(query) {
    if (!query.trim()) {
        displayOrders();
        return;
    }

    const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    const searchResults = allOrders.filter(order => 
        order.orderId.toLowerCase().includes(query.toLowerCase()) ||
        order.tableNumber.toString().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Vider tous les conteneurs
    document.getElementById('new-orders-container').innerHTML = '';
    document.getElementById('preparing-container').innerHTML = '';
    document.getElementById('completed-container').innerHTML = '';
    
    // Afficher les résultats dans leurs conteneurs respectifs
    searchResults.forEach(order => {
        let container;
        switch(order.status) {
            case 'en attente':
                container = document.getElementById('new-orders-container');
                break;
            case 'en préparation':
                container = document.getElementById('preparing-container');
                break;
            case 'prêt':
            case 'livré':
            case 'annulé':
                container = document.getElementById('completed-container');
                break;
            default:
                container = document.getElementById('new-orders-container');
        }
        
        if (container) {
            displayOrderCard(order, container);
        }
    });
}

// Gestionnaire d'onglets
function setupTabHandlers() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.orders-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Retirer la classe active de tous les éléments
            navItems.forEach(navItem => navItem.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Ajouter la classe active à l'élément cliqué
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            // Si on clique sur l'onglet statistiques, mettre à jour les stats
            if (sectionId === 'stats') {
                calculateStats(document.getElementById('stats-period').value);
            }
        });
    });
}

// Fonction pour créer une carte de commande
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const statusLabel = {
        'new-orders': 'Nouvelle',
        'preparing-orders': 'En préparation',
        'completed-orders': 'Terminée'
    };

    const itemsHtml = order.items.map(item => {
        // Vérifier si l'image existe et utiliser une image par défaut si nécessaire
        const imagePath = item.image ? item.image : 'images/placeholder.jpg';
        // S'assurer que le chemin est correct
        const fullImagePath = imagePath.startsWith('http') ? imagePath : 
                            imagePath.startsWith('/') ? imagePath : 
                            `/sarafina/frontend/${imagePath}`;
        
        return `
            <div class="order-item">
                <div class="item-details">
                    <div class="item-image-container">
                        <img src="${fullImagePath}" 
                             alt="${item.name}" 
                             class="item-image"
                             onerror="this.onerror=null; this.src='/sarafina/frontend/images/placeholder.jpg';">
                    </div>
                    <div class="item-info">
                        <h4 class="item-name">${item.name}</h4>
                        <span class="item-price">${item.price} FCFA</span>
                    </div>
                    <span class="item-quantity">×${item.quantity}</span>
                </div>
            </div>
        `;
    }).join('');

    const orderTime = new Date(order.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    card.innerHTML = `
        <div class="order-header">
            <div class="order-info-header">
                <h3>Commande #${order.id}</h3>
                <div class="table-number">Table ${order.tableNumber}</div>
            </div>
            <span class="order-status status-${(order.status || 'new-orders').replace('-orders', '')}">${statusLabel[order.status || 'new-orders']}</span>
        </div>
        <div class="order-details">
            <div class="order-info">
                <div class="info-item">
                    <span class="info-label">Heure:</span>
                    <span class="info-value">${orderTime}</span>
                </div>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-total">
                <span class="total-label">Total:</span>
                <span class="total-amount">${order.total} FCFA</span>
            </div>
        </div>
    `;

    // Ajouter les boutons de changement de statut et d'impression
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'order-actions';
    
    if (order.status !== 'completed-orders') {
        if (order.status === 'new-orders') {
            const prepareButton = document.createElement('button');
            prepareButton.className = 'action-button prepare';
            prepareButton.textContent = 'Commencer la préparation';
            prepareButton.onclick = () => changeOrderStatus(order.id, 'preparing-orders');
            buttonsContainer.appendChild(prepareButton);
        }
        
        if (order.status === 'preparing-orders') {
            const completeButton = document.createElement('button');
            completeButton.className = 'action-button complete';
            completeButton.textContent = 'Marquer comme terminée';
            completeButton.onclick = () => changeOrderStatus(order.id, 'completed-orders');
            buttonsContainer.appendChild(completeButton);
        }
    } else {
        // Ajouter le bouton d'impression pour les commandes terminées
        const printButton = document.createElement('button');
        printButton.className = 'action-button print';
        printButton.textContent = 'Imprimer le reçu';
        printButton.onclick = () => printReceipt(order);
        buttonsContainer.appendChild(printButton);
    }
    
    card.appendChild(buttonsContainer);

    return card;
}

// Fonction pour imprimer le reçu
function printReceipt(order) {
    // Créer le contenu du reçu
    const receiptContent = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>SARAFINA RESTAURANT</h2>
                <p>Reçu de commande</p>
            </div>
            <div class="receipt-info">
                <p>Commande #${order.orderId || order.id}</p>
                <p>Table: ${order.tableNumber}</p>
                <p>Date: ${new Date(order.orderDate || order.timestamp).toLocaleDateString('fr-FR')}</p>
                <p>Heure: ${new Date(order.orderDate || order.timestamp).toLocaleTimeString('fr-FR')}</p>
            </div>
            <div class="receipt-items">
                <table>
                    <thead>
                        <tr>
                            <th>Article</th>
                            <th>Qté</th>
                            <th>Prix</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.price} FCFA</td>
                                <td>${item.quantity * item.price} FCFA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="receipt-total">
                <h3>Total: ${order.totalAmount || order.total} FCFA</h3>
            </div>
            <div class="receipt-footer">
                <p>Merci de votre visite!</p>
                <p>À bientôt chez SARAFINA</p>
            </div>
        </div>
    `;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Reçu - Commande #${order.orderId || order.id}</title>
            <style>
                .receipt {
                    width: 80mm;
                    padding: 10mm;
                    margin: 0 auto;
                    font-family: 'Courier New', monospace;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 10mm;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .receipt-header h2 {
                    margin: 0;
                    font-size: 16pt;
                }
                .receipt-info {
                    margin-bottom: 10mm;
                }
                .receipt-info p {
                    margin: 2mm 0;
                }
                .receipt-items table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .receipt-items th,
                .receipt-items td {
                    text-align: left;
                    padding: 2mm;
                }
                .receipt-total {
                    text-align: right;
                    margin-bottom: 10mm;
                    border-top: 1px dashed #000;
                    padding-top: 5mm;
                }
                .receipt-footer {
                    text-align: center;
                    border-top: 1px dashed #000;
                    padding-top: 5mm;
                }
                @media print {
                    body {
                        width: 80mm;
                        margin: 0;
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${receiptContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
}