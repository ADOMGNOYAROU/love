/**
 * Fonctions utilitaires pour l'application Saint-Valentine
 * Gère le DOM, les animations, la validation et les helpers
 */

/**
 * Gestion du DOM et sélecteurs
 */
const DOM = {
    /**
     * Sélectionne un élément avec gestion d'erreur
     * @param {string} selector - Sélecteur CSS
     * @returns {Element|null} - Élément trouvé ou null
     */
    get(selector) {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Élément non trouvé: ${selector}`);
                return null;
            }
            return element;
        } catch (error) {
            console.error(`❌ Erreur sélecteur ${selector}:`, error);
            return null;
        }
    },

    /**
     * Sélectionne plusieurs éléments
     * @param {string} selector - Sélecteur CSS
     * @returns {NodeList} - Éléments trouvés
     */
    getAll(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error(`❌ Erreur sélecteur multiple ${selector}:`, error);
            return [];
        }
    },

    /**
     * Affiche/masque un élément avec animation
     * @param {Element} element - Élément à modifier
     * @param {boolean} show - true pour afficher, false pour masquer
     * @param {string} animation - Type d'animation
     */
    toggle(element, show, animation = 'fade') {
        if (!element) return;

        if (show) {
            element.classList.remove('hidden');
            element.classList.add('animate__animated', `animate__${animation}`);
        } else {
            element.classList.add('hidden');
            element.classList.remove('animate__animated', `animate__${animation}`);
        }
    }
};

/**
 * Validation des entrées utilisateur
 */
const Validator = {
    /**
     * Valide un nom (prénom)
     * @param {string} name - Nom à valider
     * @returns {Object} - {isValid: boolean, message: string}
     */
    validateName(name) {
        const trimmedName = name.trim();
        
        if (!trimmedName) {
            return { isValid: false, message: 'Le nom est requis 💕' };
        }
        
        if (trimmedName.length < 2) {
            return { isValid: false, message: 'Le nom doit contenir au moins 2 caractères' };
        }
        
        if (trimmedName.length > 50) {
            return { isValid: false, message: 'Le nom ne doit pas dépasser 50 caractères' };
        }
        
        if (!/^[a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s'-]+$/.test(trimmedName)) {
            return { isValid: false, message: 'Le nom contient des caractères invalides' };
        }
        
        return { isValid: true, message: '' };
    },

    /**
     * Valide un email
     * @param {string} email - Email à valider
     * @returns {Object} - {isValid: boolean, message: string}
     */
    validateEmail(email) {
        if (!email.trim()) {
            return { isValid: true, message: '' }; // Email optionnel
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Format d\'email invalide' };
        }
        
        return { isValid: true, message: '' };
    },

    /**
     * Valide les paramètres URL
     * @param {URLSearchParams} params - Paramètres URL
     * @returns {Object} - {isValid: boolean, data: Object}
     */
    validateUrlParams(params) {
        const id = params.get('id');
        const from = params.get('from');
        const to = params.get('to');
        
        if (!id || !from) {
            return { isValid: false, data: null };
        }
        
        const fromValidation = this.validateName(from);
        if (!fromValidation.isValid) {
            return { isValid: false, data: null };
        }
        
        let toValidation = { isValid: true };
        if (to) {
            toValidation = this.validateName(to);
        }
        
        return {
            isValid: toValidation.isValid,
            data: {
                id: sanitizeInput(id),
                from: sanitizeInput(from),
                to: to ? sanitizeInput(to) : null
            }
        };
    }
};

/**
 * Gestion des animations et effets visuels
 */
const Animator = {
    /**
     * Anime le bouton "Non" pour le faire fuir
     * @param {Element} button - Bouton à animer
     */
    moveNonButton(button) {
        if (!button) return;

        const isMobile = window.innerWidth < 768;
        const buttonWidth = isMobile ? 120 : 180;
        const margin = 20;
        
        const maxX = window.innerWidth - buttonWidth - margin;
        const maxY = window.innerHeight - buttonWidth - margin;
        
        const newX = Math.random() * maxX + margin;
        const newY = Math.random() * maxY + margin;
        
        // Animation fluide
        button.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        button.style.left = newX + 'px';
        button.style.top = newY + 'px';
        
        // Effet visuel
        button.style.transform = 'scale(0.9) rotate(5deg)';
        setTimeout(() => {
            button.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    },

    /**
     * Fait grandir le bouton "Oui"
     * @param {Element} button - Bouton à animer
     */
    growOuiButton(button) {
        if (!button) return;

        const currentScale = parseFloat(button.getAttribute('data-scale') || 1);
        if (currentScale >= 2) return;

        const newScale = Math.min(currentScale + 0.2, 2);
        button.setAttribute('data-scale', newScale);
        
        button.style.transition = 'transform 0.2s ease-out';
        button.style.transform = `scale(${newScale})`;
        
        // Effet de pulsation
        button.classList.add('animate-pulse-fast');
        setTimeout(() => {
            button.classList.remove('animate-pulse-fast');
        }, 500);
    },

    /**
     * Crée des confettis pour célébrer
     */
    createConfetti() {
        const colors = ['#ff69b4', '#ff1493', '#ff69b4', '#ffc0cb', '#ffb6c1'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -10px;
                opacity: 0.8;
                transform: rotate(${Math.random() * 360}deg);
                transition: all 2s ease-out;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(confetti);
            
            // Animation de chute
            setTimeout(() => {
                confetti.style.top = '100%';
                confetti.style.transform = `rotate(${Math.random() * 720}deg)`;
                confetti.style.opacity = '0';
            }, 100);
            
            // Nettoyage
            setTimeout(() => {
                confetti.remove();
            }, 2100);
        }
    },

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate__animated animate__fadeInRight`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate__fadeOutRight');
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
    }
};

/**
 * Gestion du responsive design
 */
const Responsive = {
    /**
     * Vérifie si l'appareil est mobile
     * @returns {boolean} - true si mobile
     */
    isMobile() {
        return window.innerWidth < 768;
    },

    /**
     * Vérifie si l'appareil est une tablette
     * @returns {boolean} - true si tablette
     */
    isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    },

    /**
     * Vérifie si l'appareil est desktop
     * @returns {boolean} - true si desktop
     */
    isDesktop() {
        return window.innerWidth >= 1024;
    },

    /**
     * Ajuste le positionnement des boutons selon l'écran
     * @param {Element} ouiBtn - Bouton Oui
     * @param {Element} nonBtn - Bouton Non
     */
    positionButtons(ouiBtn, nonBtn) {
        if (!ouiBtn || !nonBtn) return;

        const isMobile = this.isMobile();
        const ouiWidth = isMobile ? 120 : 140;
        const spacing = isMobile ? 10 : 20;
        
        ouiBtn.style.left = `calc(50% - ${ouiWidth + spacing}px)`;
        ouiBtn.style.top = 'calc(50% + 30px)';
        nonBtn.style.left = `calc(50% + ${spacing}px)`;
        nonBtn.style.top = 'calc(50% + 30px)';
    }
};

/**
 * Gestion du stockage local
 */
const Storage = {
    /**
     * Sauvegarde une donnée avec expiration
     * @param {string} key - Clé
     * @param {any} data - Donnée à sauvegarder
     * @param {number} ttl - Temps de vie en millisecondes
     */
    setWithExpiry(key, data, ttl = 24 * 60 * 60 * 1000) { // 24h par défaut
        const item = {
            data,
            expiry: Date.now() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    /**
     * Récupère une donnée avec vérification d'expiration
     * @param {string} key - Clé
     * @returns {any|null} - Donnée ou null
     */
    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return item.data;
    },

    /**
     * Nettoie les données expirées
     */
    clearExpired() {
        Object.keys(localStorage).forEach(key => {
            this.getWithExpiry(key); // Supprime automatiquement si expiré
        });
    }
};

/**
 * Utilitaires URL
 */
const URLUtils = {
    /**
     * Génère une URL unique pour la proposition
     * @param {string} uniqueId - ID unique
     * @param {string} fromName - Nom de l'expéditeur
     * @param {string} toName - Nom du destinataire
     * @returns {string} - URL complète
     */
    generateProposalUrl(uniqueId, fromName, toName) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            id: uniqueId,
            from: encodeURIComponent(fromName)
        });
        
        if (toName) {
            params.append('to', encodeURIComponent(toName));
        }
        
        return `${baseUrl}?${params.toString()}`;
    },

    /**
     * Extrait et valide les paramètres de l'URL actuelle
     * @returns {Object} - Paramètres validés
     */
    getCurrentParams() {
        try {
            const params = new URLSearchParams(window.location.search);
            return Validator.validateUrlParams(params);
        } catch (error) {
            console.error('❌ Erreur lecture URL:', error);
            return { isValid: false, data: null };
        }
    }
};

/**
 * Nettoyage des entrées (répétition de database.js pour éviter les dépendances)
 */
function sanitizeInput(input) {
    if (!input) return '';
    
    return input
        .toString()
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .substring(0, 50);
}

/**
 * Formateurs de date
 */
const DateFormatter = {
    /**
     * Formate une date pour l'affichage
     * @param {string|Date} date - Date à formater
     * @returns {string} - Date formatée
     */
    format(date) {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR') + ' à ' + 
               d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Formate une date relative (il y a...)
     * @param {string|Date} date - Date à formater
     * @returns {string} - Date relative
     */
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'à l\'instant';
        if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
};

// Export des utilitaires
window.Utils = {
    DOM,
    Validator,
    Animator,
    Responsive,
    Storage,
    URLUtils,
    DateFormatter,
    sanitizeInput
};
