/**
 * Application principale Saint-Valentine
 * Gère toute la logique métier et les interactions utilisateur
 */

// Variables globales de l'application
const AppState = {
    currentProposal: null,
    isDatabaseReady: false,
    userSession: null,
    currentMode: null // 'asker', 'responder', 'viewer'
};

// Éléments DOM principaux
const Elements = {
    // Écrans
    loadingScreen: null,
    askerPopup: null,
    responderPopup: null,
    mainContent: null,
    shareLink: null,
    resultsView: null,
    success: null,
    
    // Formulaires
    askerForm: null,
    responderForm: null,
    
    // Champs
    askerName: null,
    responderNameForLink: null,
    askerEmail: null,
    responderName: null,
    
    // Affichage
    fromName: null,
    responderDisplay: null,
    askerDisplay: null,
    generatedLink: null,
    resultsContent: null,
    finalFromName: null,
    finalToName: null,
    
    // Boutons
    ouiBtn: null,
    nonBtn: null
};

/**
 * Initialisation de l'application
 */
async function initializeApp() {
    try {
        console.log('🚀 Initialisation de l\'application...');
        
        // Initialiser les éléments DOM
        initializeElements();
        
        // Initialiser la base de données
        AppState.isDatabaseReady = await DatabaseService.initializeDatabase();
        
        // Nettoyer le stockage local expiré
        Utils.Storage.clearExpired();
        
        // Créer la session utilisateur
        createUserSession();
        
        // Analyser l'URL pour déterminer le mode
        const urlParams = Utils.URLUtils.getCurrentParams();
        
        if (urlParams.isValid && urlParams.data) {
            await handleDirectLink(urlParams.data);
        } else {
            showAskerMode();
        }
        
        // Masquer l'écran de chargement
        hideLoadingScreen();
        
        console.log('✅ Application initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        Utils.Animator.showNotification('Erreur de chargement. Actualise la page.', 'error');
        hideLoadingScreen();
    }
}

/**
 * Initialise les références aux éléments DOM
 */
function initializeElements() {
    // Écrans
    Elements.loadingScreen = Utils.DOM.get('#loadingScreen');
    Elements.askerPopup = Utils.DOM.get('#askerPopup');
    Elements.responderPopup = Utils.DOM.get('#responderPopup');
    Elements.mainContent = Utils.DOM.get('#mainContent');
    Elements.shareLink = Utils.DOM.get('#shareLink');
    Elements.resultsView = Utils.DOM.get('#resultsView');
    Elements.success = Utils.DOM.get('#success');
    
    // Formulaires
    Elements.askerForm = Utils.DOM.get('#askerForm');
    Elements.responderForm = Utils.DOM.get('#responderForm');
    
    // Champs
    Elements.askerName = Utils.DOM.get('#askerName');
    Elements.responderNameForLink = Utils.DOM.get('#responderNameForLink');
    Elements.askerEmail = Utils.DOM.get('#askerEmail');
    Elements.responderName = Utils.DOM.get('#responderName');
    
    // Affichage
    Elements.fromName = Utils.DOM.get('#fromName');
    Elements.responderDisplay = Utils.DOM.get('#responderDisplay');
    Elements.askerDisplay = Utils.DOM.get('#askerDisplay');
    Elements.generatedLink = Utils.DOM.get('#generatedLink');
    Elements.resultsContent = Utils.DOM.get('#resultsContent');
    Elements.finalFromName = Utils.DOM.get('#finalFromName');
    Elements.finalToName = Utils.DOM.get('#finalToName');
    
    // Boutons
    Elements.ouiBtn = Utils.DOM.get('#oui');
    Elements.nonBtn = Utils.DOM.get('#non');
}

/**
 * Crée une session utilisateur unique
 */
function createUserSession() {
    AppState.userSession = {
        id: Utils.Storage.getWithExpiry('user_session_id') || 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        startTime: new Date().toISOString(),
        isMobile: Utils.Responsive.isMobile()
    };
    
    Utils.Storage.setWithExpiry('user_session_id', AppState.userSession.id, 24 * 60 * 60 * 1000); // 24h
}

/**
 * Gère un lien direct vers une proposition
 */
async function handleDirectLink(params) {
    try {
        console.log('🔗 Lien direct détecté:', params);
        
        // Récupérer la proposition depuis la base de données
        const proposal = await DatabaseService.getProposalByUniqueId(params.id);
        
        if (!proposal) {
            Utils.Animator.showNotification('Lien invalide ou expiré', 'error');
            showAskerMode();
            return;
        }
        
        AppState.currentProposal = {
            id: proposal.id,
            uniqueId: proposal.unique_url_id,
            askerName: proposal.from_name,
            responderName: proposal.to_name || params.to
        };
        
        if (params.to) {
            // Mode avec destinataire connu - affichage direct
            showDirectProposal();
        } else {
            // Mode ancien - demande du nom du destinataire
            showResponderMode(proposal.from_name);
        }
        
    } catch (error) {
        console.error('❌ Erreur gestion lien direct:', error);
        Utils.Animator.showNotification('Erreur de chargement de la demande', 'error');
        showAskerMode();
    }
}

/**
 * Affiche le mode demandeur
 */
function showAskerMode() {
    AppState.currentMode = 'asker';
    Utils.DOM.toggle(Elements.askerPopup, true, 'fadeInUp');
    Elements.askerName?.focus();
}

/**
 * Affiche le mode répondeur
 */
function showResponderMode(askerName) {
    AppState.currentMode = 'responder';
    Elements.fromName.textContent = askerName;
    Utils.DOM.toggle(Elements.responderPopup, true, 'fadeInUp');
    Elements.responderName?.focus();
}

/**
 * Affiche directement la proposition (mode nouveau)
 */
function showDirectProposal() {
    AppState.currentMode = 'direct';
    
    // Masquer tous les popups
    hideAllPopups();
    
    // Afficher le contenu principal
    Utils.DOM.toggle(Elements.mainContent, true);
    
    // Remplir les noms
    Elements.responderDisplay.textContent = AppState.currentProposal.responderName;
    Elements.askerDisplay.textContent = AppState.currentProposal.askerName;
    
    // Positionner les boutons
    Utils.Responsive.positionButtons(Elements.ouiBtn, Elements.nonBtn);
    
    // Afficher les boutons
    Utils.DOM.toggle(Elements.ouiBtn, true);
    Utils.DOM.toggle(Elements.nonBtn, true);
}

/**
 * Masque l'écran de chargement
 */
function hideLoadingScreen() {
    if (Elements.loadingScreen) {
        Elements.loadingScreen.style.opacity = '0';
        Elements.loadingScreen.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
            Elements.loadingScreen.style.display = 'none';
        }, 500);
    }
}

/**
 * Masque tous les popups
 */
function hideAllPopups() {
    const popups = [Elements.askerPopup, Elements.responderPopup, Elements.shareLink, Elements.resultsView, Elements.success];
    popups.forEach(popup => Utils.DOM.toggle(popup, false));
    Utils.DOM.toggle(Elements.mainContent, false);
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

/**
 * Gère la soumission du formulaire demandeur
 */
async function handleAskerSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = {
            fromName: Elements.askerName.value.trim(),
            toName: Elements.responderNameForLink.value.trim(),
            fromEmail: Elements.askerEmail.value.trim()
        };
        
        // Validation
        const nameValidation = Utils.Validator.validateName(formData.fromName);
        if (!nameValidation.isValid) {
            Utils.Animator.showNotification(nameValidation.message, 'error');
            return;
        }
        
        const toNameValidation = Utils.Validator.validateName(formData.toName);
        if (!toNameValidation.isValid) {
            Utils.Animator.showNotification(toNameValidation.message, 'error');
            return;
        }
        
        if (formData.fromEmail) {
            const emailValidation = Utils.Validator.validateEmail(formData.fromEmail);
            if (!emailValidation.isValid) {
                Utils.Animator.showNotification(emailValidation.message, 'error');
                return;
            }
        }
        
        // Créer la proposition
        const proposal = await DatabaseService.createProposal(formData);
        
        if (proposal) {
            // Générer le lien de partage
            const shareUrl = Utils.URLUtils.generateProposalUrl(
                proposal.unique_url_id,
                formData.fromName,
                formData.toName
            );
            
            // Afficher l'écran de partage
            showShareScreen(shareUrl, formData.fromName);
            
            Utils.Animator.showNotification('Demande créée avec succès !', 'success');
        } else {
            Utils.Animator.showNotification('Erreur lors de la création', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur soumission demandeur:', error);
        Utils.Animator.showNotification('Erreur technique. Réessaie plus tard.', 'error');
    }
}

/**
 * Gère la soumission du formulaire répondeur
 */
async function handleResponderSubmit(event) {
    event.preventDefault();
    
    try {
        const responderName = Elements.responderName.value.trim();
        
        // Validation
        const nameValidation = Utils.Validator.validateName(responderName);
        if (!nameValidation.isValid) {
            Utils.Animator.showNotification(nameValidation.message, 'error');
            return;
        }
        
        // Masquer le popup et afficher la proposition
        hideAllPopups();
        Utils.DOM.toggle(Elements.mainContent, true);
        
        // Mettre à jour l'affichage
        Elements.responderDisplay.textContent = responderName;
        Elements.askerDisplay.textContent = AppState.currentProposal.askerName;
        
        // Positionner et afficher les boutons
        Utils.Responsive.positionButtons(Elements.ouiBtn, Elements.nonBtn);
        Utils.DOM.toggle(Elements.ouiBtn, true);
        Utils.DOM.toggle(Elements.nonBtn, true);
        
    } catch (error) {
        console.error('❌ Erreur soumission répondeur:', error);
        Utils.Animator.showNotification('Erreur technique. Réessaie plus tard.', 'error');
    }
}

/**
 * Gère le clic sur le bouton Oui
 */
async function handleOuiClick() {
    try {
        // Vérifier si une réponse existe déjà
        const existingResponse = await DatabaseService.getExistingResponse(AppState.currentProposal.id);
        if (existingResponse) {
            Utils.Animator.showNotification('Tu as déjà répondu à cette demande !', 'warning');
            return;
        }
        
        // Récupérer le nom du répondeur
        const responderName = AppState.currentMode === 'direct' 
            ? AppState.currentProposal.responderName
            : Elements.responderDisplay.textContent;
        
        // Enregistrer la réponse
        const response = await DatabaseService.createResponse({
            proposalId: AppState.currentProposal.id,
            response: 'OUI',
            responderName: responderName
        });
        
        if (response) {
            // Afficher l'écran de succès
            showSuccessScreen(AppState.currentProposal.askerName, responderName);
            
            // Créer des confettis
            Utils.Animator.createConfetti();
            
            Utils.Animator.showNotification('Réponse enregistrée avec succès !', 'success');
        } else {
            Utils.Animator.showNotification('Erreur lors de l\'enregistrement', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur clic Oui:', error);
        Utils.Animator.showNotification('Erreur technique. Réessaie plus tard.', 'error');
    }
}

/**
 * Gère le clic sur le bouton Non
 */
async function handleNonClick(event) {
    event.preventDefault();
    
    try {
        // Animation du bouton qui fuit
        Utils.Animator.moveNonButton(Elements.nonBtn);
        
        // Faire grandir le bouton Oui
        Utils.Animator.growOuiButton(Elements.ouiBtn);
        
        // Enregistrer la tentative (10% de chance pour éviter surcharge)
        if (Math.random() < 0.1 && AppState.currentProposal) {
            const responderName = AppState.currentMode === 'direct' 
                ? AppState.currentProposal.responderName
                : Elements.responderDisplay.textContent;
                
            await DatabaseService.createResponse({
                proposalId: AppState.currentProposal.id,
                response: 'NON_TENTATIVE',
                responderName: responderName
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur clic Non:', error);
    }
}

/**
 * Affiche l'écran de partage
 */
function showShareScreen(shareUrl, askerName) {
    Elements.generatedLink.textContent = shareUrl;
    hideAllPopups();
    Utils.DOM.toggle(Elements.shareLink, true);
    
    // Sauvegarder pour consultation des résultats
    Utils.Storage.setWithExpiry('current_asker', askerName, 60 * 60 * 1000); // 1h
}

/**
 * Affiche l'écran de succès
 */
function showSuccessScreen(fromName, toName) {
    Elements.finalFromName.textContent = fromName;
    Elements.finalToName.textContent = toName;
    
    hideAllPopups();
    Utils.DOM.toggle(Elements.success, true);
    
    // Rediriger vers la page d'accueil après 5 secondes
    setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
    }, 5000);
}

/**
 * Affiche les résultats de l'utilisateur
 */
async function viewResults() {
    try {
        const askerName = Utils.Storage.getWithExpiry('current_asker');
        if (!askerName) {
            Utils.Animator.showNotification('Session expirée. Crée une nouvelle demande.', 'warning');
            return;
        }
        
        const responses = await DatabaseService.getResponsesByAsker(askerName);
        displayResults(responses, askerName);
        
    } catch (error) {
        console.error('❌ Erreur affichage résultats:', error);
        Utils.Animator.showNotification('Erreur lors du chargement des résultats', 'error');
    }
}

/**
 * Affiche les résultats dans l'interface
 */
function displayResults(responses, askerName) {
    if (!responses || responses.length === 0) {
        Elements.resultsContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">📭</div>
                <p class="text-gray-600 text-lg mb-2">Aucune réponse enregistrée pour le moment</p>
                <p class="text-gray-500">Les réponses apparaîtront ici dès que tes Valentines répondront !</p>
            </div>
        `;
    } else {
        let html = '<div class="space-y-4">';
        
        responses.forEach(response => {
            const date = Utils.DateFormatter.format(response.responded_at || response.respondedAt);
            const timeAgo = Utils.DateFormatter.timeAgo(response.responded_at || response.respondedAt);
            
            if (response.response === 'OUI') {
                html += `
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 transform hover:scale-102 transition-all duration-200">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-green-800 font-bold text-lg flex items-center">
                                <span class="text-2xl mr-2">✅</span> OUI !
                            </span>
                            <span class="text-xs text-gray-500" title="${date}">${timeAgo}</span>
                        </div>
                        <p class="text-green-700 font-medium">
                            <strong>${response.responder_name || response.actual_responder_name}</strong> a accepté ta demande !
                        </p>
                        <p class="text-sm text-green-600 mt-1">
                            💕 De : ${response.from_name} → ${response.to_name || response.responder_name}
                        </p>
                    </div>
                `;
            } else if (response.response === 'NON_TENTATIVE') {
                html += `
                    <div class="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 transform hover:scale-102 transition-all duration-200">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-yellow-800 font-bold text-lg flex items-center">
                                <span class="text-2xl mr-2">🏃</span> Tentative de Non
                            </span>
                            <span class="text-xs text-gray-500" title="${date}">${timeAgo}</span>
                        </div>
                        <p class="text-yellow-700 font-medium">
                            <strong>${response.responder_name}</strong> a essayé de dire non... mais le bouton a fui ! 😄
                        </p>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        
        // Statistiques
        const stats = {
            oui: responses.filter(r => r.response === 'OUI').length,
            tentatives: responses.filter(r => r.response === 'NON_TENTATIVE').length
        };
        
        html += `
            <div class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="font-bold text-gray-800 mb-4 text-lg">📊 Tes statistiques d'amour</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl font-bold text-pink-600 mb-1">${stats.oui}</div>
                        <div class="text-sm text-pink-700 font-medium">Oui 💕</div>
                    </div>
                    <div class="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl font-bold text-yellow-600 mb-1">${stats.tentatives}</div>
                        <div class="text-sm text-yellow-700 font-medium">Tentatives Non 🏃</div>
                    </div>
                </div>
                <div class="mt-4 text-center">
                    <p class="text-sm text-gray-600">
                        Taux de réussite : ${responses.length > 0 ? Math.round((stats.oui / responses.length) * 100) : 0}%
                    </p>
                </div>
            </div>
        `;
        
        Elements.resultsContent.innerHTML = html;
    }
    
    hideAllPopups();
    Utils.DOM.toggle(Elements.resultsView, true);
}

/**
 * Ferme l'écran des résultats
 */
function closeResults() {
    Utils.DOM.toggle(Elements.resultsView, false);
    Utils.DOM.toggle(Elements.shareLink, true);
}

/**
 * Partage le lien (clipboard ou API Web Share)
 */
async function shareLink() {
    const link = Elements.generatedLink.textContent;
    
    try {
        // Utiliser l'API Web Share si disponible
        if (navigator.share) {
            await navigator.share({
                title: 'Demande de Saint-Valentine 💕',
                text: 'Quelqu\'un t\'a envoyé une demande spéciale !',
                url: link
            });
        } else {
            // Fallback vers le clipboard
            await navigator.clipboard.writeText(link);
            Utils.Animator.showNotification('Lien copié dans le presse-papiers ! 📋', 'success');
        }
    } catch (error) {
        console.error('❌ Erreur partage:', error);
        Utils.Animator.showNotification('Erreur lors du partage', 'error');
    }
}

/**
 * Réinitialise pour créer une nouvelle demande
 */
function resetToCreate() {
    hideAllPopups();
    showAskerMode();
    
    // Vider les formulaires
    if (Elements.askerForm) Elements.askerForm.reset();
    if (Elements.responderForm) Elements.responderForm.reset();
    
    // Réinitialiser l'état
    AppState.currentProposal = null;
    AppState.currentMode = null;
}

// ===== INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS =====

/**
 * Initialise tous les écouteurs d'événements
 */
function initializeEventListeners() {
    // Formulaires
    Elements.askerForm?.addEventListener('submit', handleAskerSubmit);
    Elements.responderForm?.addEventListener('submit', handleResponderSubmit);
    
    // Boutons principaux
    Elements.ouiBtn?.addEventListener('click', handleOuiClick);
    Elements.nonBtn?.addEventListener('click', handleNonClick);
    
    // Bouton Non - survol (desktop uniquement)
    if (!Utils.Responsive.isMobile()) {
        Elements.nonBtn?.addEventListener('mouseenter', () => {
            Utils.Animator.moveNonButton(Elements.nonBtn);
        });
    }
    
    // Bouton Oui - survol
    Elements.ouiBtn?.addEventListener('mouseenter', () => {
        Utils.Animator.growOuiButton(Elements.ouiBtn);
    });
    
    // Touch events pour mobile
    Elements.ouiBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        Utils.Animator.growOuiButton(Elements.ouiBtn);
    });
    
    // Redimensionnement fenêtre
    window.addEventListener('resize', () => {
        if (Elements.ouiBtn && Elements.nonBtn) {
            Utils.Responsive.positionButtons(Elements.ouiBtn, Elements.nonBtn);
        }
    });
    
    // Navigation clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (AppState.currentMode === 'asker') {
                // Réinitialiser en mode demandeur
                resetToCreate();
            }
        }
    });
}

// ===== DÉMARRAGE DE L'APPLICATION =====

// Démarrer l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM chargé, démarrage de l\'application...');
    
    // Initialiser les écouteurs d'événements
    initializeEventListeners();
    
    // Initialiser l'application
    await initializeApp();
});

// Gérer le cas où le script est chargé après le DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export pour le débogage
window.ValentineApp = {
    AppState,
    Elements,
    initializeApp,
    handleAskerSubmit,
    handleResponderSubmit,
    handleOuiClick,
    handleNonClick,
    viewResults,
    shareLink,
    resetToCreate
};
