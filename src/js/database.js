/**
 * Configuration et connexion à la base de données Supabase
 * Gère toutes les opérations CRUD pour les propositions et réponses
 */

// Configuration Supabase - Remplacer par vos clés
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anonyme';

// Initialisation du client Supabase
let supabase;

/**
 * Initialise la connexion à Supabase
 */
async function initializeDatabase() {
    try {
        // Import dynamique pour éviter les erreurs en développement
        if (typeof supabaseClient === 'undefined') {
            // Charger Supabase depuis CDN si pas disponible
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Base de données initialisée');
            };
            document.head.appendChild(script);
        } else {
            supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Base de données initialisée');
        }
    } catch (error) {
        console.error('❌ Erreur initialisation DB:', error);
        // Fallback vers localStorage pour développement
        return false;
    }
    return true;
}

/**
 * Crée une nouvelle proposition dans la base de données
 * @param {Object} proposalData - Données de la proposition
 * @returns {Object} - Proposition créée ou null
 */
async function createProposal(proposalData) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase non disponible, utilisation localStorage');
            return createProposalLocal(proposalData);
        }

        const { data, error } = await supabase
            .from('proposals')
            .insert([{
                from_name: sanitizeInput(proposalData.fromName),
                to_name: sanitizeInput(proposalData.toName),
                from_email: proposalData.fromEmail ? sanitizeInput(proposalData.fromEmail) : null,
                ip_address: await getClientIP(),
                user_agent: navigator.userAgent
            }])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Proposition créée:', data);
        return data;
    } catch (error) {
        console.error('❌ Erreur création proposition:', error);
        return createProposalLocal(proposalData);
    }
}

/**
 * Récupère une proposition par son URL unique
 * @param {string} uniqueUrlId - ID unique de l'URL
 * @returns {Object} - Proposition trouvée ou null
 */
async function getProposalByUniqueId(uniqueUrlId) {
    try {
        if (!supabase) {
            return getProposalLocal(uniqueUrlId);
        }

        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('unique_url_id', sanitizeInput(uniqueUrlId))
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return data;
    } catch (error) {
        console.error('❌ Erreur récupération proposition:', error);
        return getProposalLocal(uniqueUrlId);
    }
}

/**
 * Enregistre une réponse à une proposition
 * @param {Object} responseData - Données de la réponse
 * @returns {Object} - Réponse enregistrée ou null
 */
async function createResponse(responseData) {
    try {
        if (!supabase) {
            return createResponseLocal(responseData);
        }

        // Vérifier si une réponse existe déjà
        const existingResponse = await getExistingResponse(responseData.proposalId);
        if (existingResponse) {
            console.warn('⚠️ Réponse déjà existante pour cette proposition');
            return null;
        }

        // Enregistrer la réponse détaillée
        const { data: responseData, error: responseError } = await supabase
            .from('responses')
            .insert([{
                proposal_id: responseData.proposalId,
                response: sanitizeInput(responseData.response),
                responder_name: sanitizeInput(responseData.responderName),
                ip_address: await getClientIP(),
                user_agent: navigator.userAgent,
                session_id: getSessionId()
            }])
            .select()
            .single();

        if (responseError) throw responseError;

        // Mettre à jour la proposition principale
        const { error: updateError } = await supabase
            .from('proposals')
            .update({
                response: responseData.response === 'OUI' ? 'OUI' : 'PENDING',
                responded_at: new Date().toISOString(),
                actual_responder_name: sanitizeInput(responseData.responderName)
            })
            .eq('id', responseData.proposalId);

        if (updateError) throw updateError;

        console.log('✅ Réponse enregistrée:', responseData);
        return responseData;
    } catch (error) {
        console.error('❌ Erreur enregistrement réponse:', error);
        return createResponseLocal(responseData);
    }
}

/**
 * Vérifie si une réponse existe déjà pour cette proposition
 * @param {string} proposalId - ID de la proposition
 * @returns {Object} - Réponse existante ou null
 */
async function getExistingResponse(proposalId) {
    try {
        if (!supabase) {
            return getExistingResponseLocal(proposalId);
        }

        const { data, error } = await supabase
            .from('responses')
            .select('*')
            .eq('proposal_id', proposalId)
            .eq('response', 'OUI')
            .single();

        if (error && error.code !== 'PGRST116') return null;

        return data;
    } catch (error) {
        console.error('❌ Erreur vérification réponse existante:', error);
        return null;
    }
}

/**
 * Récupère toutes les réponses pour un demandeur
 * @param {string} fromName - Nom du demandeur
 * @returns {Array} - Liste des réponses
 */
async function getResponsesByAsker(fromName) {
    try {
        if (!supabase) {
            return getResponsesByAskerLocal(fromName);
        }

        const { data, error } = await supabase
            .from('proposals')
            .select(`
                *,
                responses (
                    response,
                    responder_name,
                    responded_at
                )
            `)
            .eq('from_name', sanitizeInput(fromName))
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('❌ Erreur récupération réponses:', error);
        return getResponsesByAskerLocal(fromName);
    }
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Nettoie les entrées utilisateur pour éviter les injections
 * @param {string} input - Texte à nettoyer
 * @returns {string} - Texte nettoyé
 */
function sanitizeInput(input) {
    if (!input) return '';
    
    return input
        .toString()
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprime les scripts
        .replace(/<[^>]*>/g, '') // Supprime les balises HTML
        .substring(0, 50); // Limite la longueur
}

/**
 * Récupère l'adresse IP du client (approximatif)
 * @returns {string} - Adresse IP
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Génère un ID de session unique
 * @returns {string} - ID de session
 */
function getSessionId() {
    let sessionId = sessionStorage.getItem('valentine_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('valentine_session_id', sessionId);
    }
    return sessionId;
}

// ===== FONCTIONS FALLBACK LOCALSTORAGE =====

/**
 * Crée une proposition en localStorage (fallback)
 */
function createProposalLocal(proposalData) {
    const proposal = {
        id: 'local_' + Date.now(),
        unique_url_id: 'valentine_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        from_name: sanitizeInput(proposalData.fromName),
        to_name: sanitizeInput(proposalData.toName),
        from_email: proposalData.fromEmail,
        created_at: new Date().toISOString(),
        response: 'PENDING'
    };

    localStorage.setItem(proposal.unique_url_id, JSON.stringify(proposal));
    return proposal;
}

/**
 * Récupère une proposition en localStorage (fallback)
 */
function getProposalLocal(uniqueUrlId) {
    const data = localStorage.getItem(uniqueUrlId);
    return data ? JSON.parse(data) : null;
}

/**
 * Crée une réponse en localStorage (fallback)
 */
function createResponseLocal(responseData) {
    const responses = JSON.parse(localStorage.getItem('valentine_responses') || '[]');
    
    // Vérifier si réponse existe déjà
    const existing = responses.find(r => r.proposal_id === responseData.proposalId && r.response === 'OUI');
    if (existing) return null;

    const response = {
        id: 'local_' + Date.now(),
        proposal_id: responseData.proposalId,
        response: responseData.response,
        responder_name: sanitizeInput(responseData.responderName),
        responded_at: new Date().toISOString()
    };

    responses.push(response);
    localStorage.setItem('valentine_responses', JSON.stringify(responses));
    
    return response;
}

/**
 * Récupère les réponses par demandeur en localStorage (fallback)
 */
function getResponsesByAskerLocal(fromName) {
    const responses = JSON.parse(localStorage.getItem('valentine_responses') || '[]');
    return responses.filter(r => r.askerName === sanitizeInput(fromName));
}

/**
 * Vérifie réponse existante en localStorage (fallback)
 */
function getExistingResponseLocal(proposalId) {
    const responses = JSON.parse(localStorage.getItem('valentine_responses') || '[]');
    return responses.find(r => r.proposal_id === proposalId && r.response === 'OUI') || null;
}

// Export des fonctions principales
window.DatabaseService = {
    initializeDatabase,
    createProposal,
    getProposalByUniqueId,
    createResponse,
    getExistingResponse,
    getResponsesByAsker
};
