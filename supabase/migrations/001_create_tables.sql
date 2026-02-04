-- Création de la table des propositions
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_name TEXT NOT NULL CHECK (length(from_name) >= 2 AND length(from_name) <= 50),
  to_name TEXT NOT NULL CHECK (length(to_name) >= 2 AND length(to_name) <= 50),
  from_email TEXT CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response TEXT DEFAULT 'PENDING' CHECK (response IN ('PENDING', 'OUI', 'NON')),
  responded_at TIMESTAMP WITH TIME ZONE,
  actual_responder_name TEXT CHECK (length(actual_responder_name) >= 2 AND length(actual_responder_name) <= 50),
  unique_url_id TEXT UNIQUE NOT NULL CHECK (length(unique_url_id) >= 10),
  ip_address TEXT,
  user_agent TEXT
);

-- Création de la table des réponses détaillées
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('OUI', 'NON_TENTATIVE')),
  responder_name TEXT NOT NULL CHECK (length(responder_name) >= 2 AND length(responder_name) <= 50),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT
);

-- Index pour optimiser les performances
CREATE INDEX idx_proposals_unique_url_id ON proposals(unique_url_id);
CREATE INDEX idx_proposals_from_name ON proposals(from_name);
CREATE INDEX idx_responses_proposal_id ON responses(proposal_id);
CREATE INDEX idx_responses_responded_at ON responses(responded_at);

-- Activer Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour les propositions
CREATE POLICY "Anyone can view proposals by unique_url_id" ON proposals
  FOR SELECT USING (unique_url_id IS NOT NULL);

CREATE POLICY "Anyone can insert proposals" ON proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update proposals" ON proposals
  FOR UPDATE USING (true);

-- Politiques de sécurité pour les réponses
CREATE POLICY "Anyone can insert responses" ON responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view responses" ON responses
  FOR SELECT USING (true);

-- Fonction pour générer un ID unique
CREATE OR REPLACE FUNCTION generate_unique_url_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'valentine_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8);
    SELECT EXISTS(SELECT 1 FROM proposals WHERE unique_url_id = new_id) INTO id_exists;
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement l'ID unique
CREATE OR REPLACE FUNCTION set_unique_url_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_url_id IS NULL THEN
    NEW.unique_url_id := generate_unique_url_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_unique_url_id
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION set_unique_url_id();
