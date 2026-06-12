"""
AI Quiz Generator.
Primary: Groq LLM (free) — truly content-adaptive.
Fallback: keyword-based static banks.

Setup Groq (free, no credit card):
  1. https://console.groq.com  → create account → API Keys → Create Key
  2. Set env var: GROQ_API_KEY=gsk_...
  3. Restart the AI service
"""

import os
import re
import json
import random
import logging
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger("eduai.generator")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # stronger instruction-following, free tier


def _groq_key() -> str:
    """Read key at call time so .env loaded in main.py is always visible."""
    return os.getenv("GROQ_API_KEY", "")

QUIZ_PROMPT_SINGLE = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM (choix unique) basées sur le contenu ci-dessous.

{content}

RÈGLES ABSOLUES — respecte-les strictement :
1. Chaque question porte UNIQUEMENT sur le contenu fourni
2. EXACTEMENT 4 options (ni plus, ni moins) — pas de doublons dans les options
3. correctAnswer = index 0, 1, 2 ou 3 — VARIE la position (pas toujours 0)
4. Explication courte de la bonne réponse
5. points = 10, 15 ou 20
6. Rédige en français

Réponds UNIQUEMENT avec un tableau JSON valide (pas de texte avant, pas de texte après) :
[{{"text":"?","options":["A","B","C","D"],"correctAnswer":1,"explanation":"","points":10}}]"""

QUIZ_PROMPT_MIXED = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM variées (simple, analytique, application) basées sur le contenu ci-dessous.

{content}

RÈGLES ABSOLUES — respecte-les strictement :
1. Chaque question porte UNIQUEMENT sur le contenu fourni
2. Varie les niveaux : mémorisation, compréhension, application
3. EXACTEMENT 4 options (ni plus, ni moins) — pas de doublons dans les options
4. correctAnswer = index 0, 1, 2 ou 3 — VARIE la position (pas toujours 0)
5. Explication courte de la bonne réponse
6. points = 10 (facile), 15 (moyen), 20 (difficile)
7. Rédige en français

Réponds UNIQUEMENT avec un tableau JSON valide (pas de texte avant, pas de texte après) :
[{{"text":"?","options":["A","B","C","D"],"correctAnswer":1,"explanation":"","points":15}}]"""


# ─────────────────────────────────────────────────────────────────────────────
# Static keyword-based fallback banks (kept as fallback)
# ─────────────────────────────────────────────────────────────────────────────

TEMPLATES: Dict[str, List[Dict]] = {
    "python": [
        {"text": "Quelle méthode ajoute un élément à la fin d'une liste Python ?",
         "options": ["append()", "add()", "insert()", "push()"], "correctAnswer": 0,
         "explanation": "list.append(x) ajoute x à la fin.", "points": 10},
        {"text": "Qu'est-ce qu'un décorateur Python ?",
         "options": ["Une fonction qui modifie une autre fonction", "Un type de boucle", "Une classe abstraite", "Un module externe"],
         "correctAnswer": 0, "explanation": "Fonction d'ordre supérieur qui enveloppe une autre fonction.", "points": 15},
        {"text": "Complexité temporelle d'un accès à un dict Python ?",
         "options": ["O(1) en moyenne", "O(n)", "O(log n)", "O(n²)"],
         "correctAnswer": 0, "explanation": "Les dicts Python utilisent des tables de hachage.", "points": 20},
        {"text": "Comment déclarer une variable globale dans une fonction Python ?",
         "options": ["global x", "var x", "static x", "public x"],
         "correctAnswer": 0, "explanation": "Le mot-clé `global` déclare une variable comme globale.", "points": 10},
        {"text": "Quelle est la sortie de `[x**2 for x in range(3)]` ?",
         "options": ["[0, 1, 4]", "[1, 4, 9]", "[0, 1, 2]", "[0, 2, 4]"],
         "correctAnswer": 0, "explanation": "0²=0, 1²=1, 2²=4.", "points": 10},
        {"text": "Quel module Python gère les expressions régulières ?",
         "options": ["re", "regex", "pattern", "match"],
         "correctAnswer": 0, "explanation": "Le module `re` fournit les outils pour les regex.", "points": 10},
        {"text": "Qu'est-ce que `*args` dans une fonction Python ?",
         "options": ["Arguments positionnels variables", "Arguments nommés obligatoires", "Un pointeur", "Un tableau fixe"],
         "correctAnswer": 0, "explanation": "`*args` capture un nombre variable d'arguments positionnels.", "points": 15},
        {"text": "Quelle structure Python garantit l'unicité des éléments ?",
         "options": ["set", "list", "tuple", "dict"],
         "correctAnswer": 0, "explanation": "Un `set` ne contient que des éléments uniques.", "points": 10},
        {"text": "Qu'est-ce qu'un générateur Python ?",
         "options": ["Une fonction qui utilise `yield`", "Une classe abstraite", "Un module", "Une liste immuable"],
         "correctAnswer": 0, "explanation": "Les générateurs produisent les valeurs à la demande via `yield`.", "points": 20},
        {"text": "Quel est le rôle de `__init__` dans une classe Python ?",
         "options": ["Constructeur — initialise l'objet", "Destructeur", "Méthode statique", "Surcharge d'opérateur"],
         "correctAnswer": 0, "explanation": "`__init__` est appelé automatiquement à la création de l'objet.", "points": 10},
        {"text": "Qu'est-ce que le duck typing en Python ?",
         "options": ["Le type est déterminé par les méthodes, pas la classe", "Un type spécial", "Une convention de nommage", "Un algorithme"],
         "correctAnswer": 0, "explanation": "Si un objet a les méthodes nécessaires, il peut être utilisé.", "points": 20},
    ],
    "machine learning": [
        {"text": "Qu'est-ce que le sur-apprentissage (overfitting) ?",
         "options": ["Le modèle mémorise les données mais généralise mal", "Le modèle est trop simple", "L'algorithme ne converge pas", "Les données sont mal étiquetées"],
         "correctAnswer": 0, "explanation": "L'overfitting = trop bien mémoriser les exemples d'entraînement.", "points": 15},
        {"text": "Quelle métrique pour une classification déséquilibrée ?",
         "options": ["F1-Score", "Accuracy", "MSE", "R²"],
         "correctAnswer": 0, "explanation": "Le F1-Score équilibre précision et rappel.", "points": 20},
        {"text": "Qu'est-ce que la descente de gradient ?",
         "options": ["Algorithme minimisant une fonction de coût", "Un algorithme de tri", "Une normalisation", "Un réseau de neurones"],
         "correctAnswer": 0, "explanation": "Ajuste les paramètres dans le sens opposé au gradient.", "points": 15},
        {"text": "Qu'est-ce qu'une Random Forest ?",
         "options": ["Ensemble d'arbres de décision sur des sous-ensembles aléatoires", "Un seul arbre profond", "Un CNN", "Un clustering"],
         "correctAnswer": 0, "explanation": "Random Forest combine plusieurs arbres pour réduire l'overfitting.", "points": 15},
        {"text": "Quelle activation dans les réseaux profonds ?",
         "options": ["ReLU", "Sigmoid", "Tanh", "Softmax"],
         "correctAnswer": 0, "explanation": "ReLU évite le vanishing gradient.", "points": 15},
        {"text": "Qu'est-ce que la cross-validation ?",
         "options": ["Évaluation en k parties pour tester la généralisation", "Un algorithme de classification", "Une normalisation", "Une augmentation de données"],
         "correctAnswer": 0, "explanation": "K-fold divise les données en k parties.", "points": 20},
        {"text": "Différence apprentissage supervisé vs non supervisé ?",
         "options": ["Supervisé : étiquetés ; non supervisé : sans étiquettes", "Supervisé plus lent", "Non supervisé plus de données", "Identiques"],
         "correctAnswer": 0, "explanation": "Supervisé utilise des paires (entrée, sortie).", "points": 15},
        {"text": "Qu'est-ce que le Transfer Learning ?",
         "options": ["Réutiliser un modèle pré-entraîné", "Transférer des données", "Copier un modèle", "Augmenter le dataset"],
         "correctAnswer": 0, "explanation": "Réutilise les connaissances pour une tâche similaire.", "points": 20},
    ],
    "intelligence artificielle": [
        {"text": "Qu'est-ce qu'un agent IA ?",
         "options": ["Système percevant son environnement et prenant des décisions", "Un programme séquentiel", "Une base de données", "Un compilateur"],
         "correctAnswer": 0, "explanation": "Agent IA = capteurs + effecteurs.", "points": 15},
        {"text": "Qu'est-ce que le NLP ?",
         "options": ["Domaine de l'IA traitant le langage humain", "Un algorithme de tri", "Un protocole réseau", "Un outil de visualisation"],
         "correctAnswer": 0, "explanation": "NLP permet de comprendre et générer le langage humain.", "points": 10},
        {"text": "Qu'est-ce qu'un transformer ?",
         "options": ["Architecture basée sur l'attention", "Un circuit électrique", "Une normalisation", "Un clustering"],
         "correctAnswer": 0, "explanation": "Transformers traitent les séquences en parallèle (GPT, BERT).", "points": 20},
    ],
    "react": [
        {"text": "Qu'est-ce qu'un Hook React ?",
         "options": ["Fonction utilisant l'état dans des composants fonctionnels", "Un composant de classe", "Un middleware Redux", "Un fichier de config"],
         "correctAnswer": 0, "explanation": "Hooks (useState, useEffect…) sans classes.", "points": 10},
        {"text": "Que fait `useEffect(() => {}, [])` ?",
         "options": ["S'exécute une seule fois au montage", "S'exécute à chaque rendu", "Ne s'exécute jamais", "Au démontage uniquement"],
         "correctAnswer": 0, "explanation": "Tableau vide [] = exécution au montage uniquement.", "points": 15},
        {"text": "Différence props vs state ?",
         "options": ["Props : du parent ; state : interne au composant", "Identiques", "State vient du parent", "Props sont mutables"],
         "correctAnswer": 0, "explanation": "Props = lecture seule depuis parent. State = interne.", "points": 10},
        {"text": "Qu'est-ce que le Virtual DOM ?",
         "options": ["Représentation mémoire du DOM réel optimisant les mises à jour", "Un DOM plus rapide", "Un DOM côté serveur", "Un DOM sans JS"],
         "correctAnswer": 0, "explanation": "React compare le Virtual DOM avec le DOM réel (diffing).", "points": 15},
        {"text": "Quel hook mémorise une valeur calculée ?",
         "options": ["useMemo", "useCallback", "useRef", "useReducer"],
         "correctAnswer": 0, "explanation": "useMemo recalcule seulement si les dépendances changent.", "points": 20},
        {"text": "Qu'est-ce que JSX ?",
         "options": ["Syntaxe pour écrire du HTML dans JavaScript", "Un framework CSS", "Un format de données", "Un gestionnaire d'état"],
         "correctAnswer": 0, "explanation": "JSX est transpilé en React.createElement().", "points": 10},
        {"text": "Que retourne `useState` ?",
         "options": ["[valeur, fonction de mise à jour]", "{value, setValue}", "Une valeur", "Un Observable"],
         "correctAnswer": 0, "explanation": "const [count, setCount] = useState(0).", "points": 10},
    ],
    "angular": [
        {"text": "Qu'est-ce qu'un composant Angular ?",
         "options": ["Classe TypeScript avec @Component, template HTML et styles CSS", "Un module JS", "Un service REST", "Une config"],
         "correctAnswer": 0, "explanation": "Composants = blocs de construction d'Angular.", "points": 10},
        {"text": "Qu'est-ce que le two-way binding ?",
         "options": ["Synchronisation bidirectionnelle via [(ngModel)]", "Liaison unidirectionnelle", "Liaison événementielle", "Un pipe"],
         "correctAnswer": 0, "explanation": "[(ngModel)] = [ngModel] + (ngModelChange).", "points": 15},
        {"text": "Qu'est-ce qu'un service Angular ?",
         "options": ["Classe injectable partagée via DI", "Un composant sans template", "Un fichier de routing", "Un décorateur"],
         "correctAnswer": 0, "explanation": "@Injectable encapsule la logique métier partagée.", "points": 15},
        {"text": "Que fait `*ngFor` ?",
         "options": ["Itère sur une liste", "Condition dans le template", "Gestionnaire d'événements", "Filtre"],
         "correctAnswer": 0, "explanation": "*ngFor génère un élément DOM pour chaque item.", "points": 10},
        {"text": "Qu'est-ce qu'un Angular Signal ?",
         "options": ["Primitive réactive pour suivre les changements d'état", "Un événement DOM", "Un service", "Un hook"],
         "correctAnswer": 0, "explanation": "Signals (Angular 17+) pour la gestion d'état local.", "points": 20},
        {"text": "Qu'est-ce que RxJS ?",
         "options": ["Bibliothèque réactive basée sur les Observables", "Un framework de test", "Un bundler", "Un routeur"],
         "correctAnswer": 0, "explanation": "RxJS gère les flux asynchrones dans Angular.", "points": 15},
    ],
    "typescript": [
        {"text": "Qu'est-ce que TypeScript ?",
         "options": ["Sur-ensemble typé de JavaScript compilé en JS", "Langage indépendant", "Framework JS", "Un bundler"],
         "correctAnswer": 0, "explanation": "TypeScript ajoute le typage statique à JavaScript.", "points": 10},
        {"text": "Qu'est-ce qu'une interface TypeScript ?",
         "options": ["Contrat définissant la forme d'un objet", "Classe abstraite", "Module", "Décorateur"],
         "correctAnswer": 0, "explanation": "Interfaces = contrats de type sans implémentation.", "points": 10},
        {"text": "Différence `unknown` vs `any` ?",
         "options": ["`unknown` exige vérification ; `any` désactive le typage", "Identiques", "`unknown` plus permissif", "`any` nécessite vérification"],
         "correctAnswer": 0, "explanation": "`unknown` est le type sûr pour valeurs inconnues.", "points": 20},
    ],
    "spring": [
        {"text": "Que fait @RestController ?",
         "options": ["@Controller + @ResponseBody pour renvoyer JSON", "Configure la BDD", "Gère la sécurité", "Crée un bean service"],
         "correctAnswer": 0, "explanation": "@RestController = @Controller + @ResponseBody.", "points": 10},
        {"text": "Rôle de Spring Security ?",
         "options": ["Gérer l'authentification et les autorisations", "Optimiser SQL", "Compresser HTTP", "Configurer le serveur"],
         "correctAnswer": 0, "explanation": "Protège les endpoints via authentification et rôles.", "points": 15},
        {"text": "Que fait @Transactional ?",
         "options": ["Gère automatiquement les transactions BDD", "Sécurise un endpoint", "Met en cache", "Configure le pool"],
         "correctAnswer": 0, "explanation": "@Transactional assure commit/rollback atomique.", "points": 20},
        {"text": "Qu'est-ce que JWT ?",
         "options": ["Standard JSON signé pour l'authentification stateless", "Session côté serveur", "Framework sécurité", "Type de cookie"],
         "correctAnswer": 0, "explanation": "header.payload.signature — authentification sans état.", "points": 15},
        {"text": "Qu'est-ce que JPA ?",
         "options": ["Java Persistence API — mapper objets Java vers BDD", "Serveur d'application", "Protocole réseau", "Framework test"],
         "correctAnswer": 0, "explanation": "Hibernate est l'implémentation principale de JPA.", "points": 10},
    ],
    "java": [
        {"text": "Qu'est-ce que l'héritage en Java ?",
         "options": ["Hériter des propriétés via `extends`", "Type d'interface", "Pattern de conception", "Annotation"],
         "correctAnswer": 0, "explanation": "Java supporte l'héritage simple pour les classes.", "points": 10},
        {"text": "Différence interface vs classe abstraite en Java ?",
         "options": ["Interface : contrat pur ; abstraite : peut avoir implémentations", "Identiques", "Multi-héritage de classes abstraites", "Interface sans constantes"],
         "correctAnswer": 0, "explanation": "Java 8+ : interfaces avec méthodes default.", "points": 15},
        {"text": "Qu'est-ce que Optional<T> ?",
         "options": ["Conteneur évitant les NullPointerException", "Type générique standard", "Interface fonctionnelle", "Collection"],
         "correctAnswer": 0, "explanation": "Optional force la gestion explicite de l'absence de valeur.", "points": 15},
        {"text": "Qu'est-ce que Stream API (Java 8+) ?",
         "options": ["Traitement fonctionnel des collections (filter, map, reduce)", "Flux réseau", "Logging", "Type de thread"],
         "correctAnswer": 0, "explanation": "Streams : traitement déclaratif et parallèle.", "points": 20},
    ],
    "docker": [
        {"text": "Quelle commande construit une image Docker ?",
         "options": ["docker build -t nom:tag .", "docker run", "docker create", "docker make"],
         "correctAnswer": 0, "explanation": "docker build lit le Dockerfile du répertoire courant.", "points": 10},
        {"text": "Différence image vs conteneur Docker ?",
         "options": ["Image : modèle immuable ; conteneur : instance en cours", "Synonymes", "Conteneur sur le registre", "Image éphémère"],
         "correctAnswer": 0, "explanation": "Image immuable → conteneur = image lancée.", "points": 15},
        {"text": "Qu'est-ce que Docker Compose ?",
         "options": ["Outil multi-conteneurs via YAML", "Registre Docker", "Monitoring", "Gestionnaire volumes"],
         "correctAnswer": 0, "explanation": "docker-compose.yml définit services, réseaux et volumes.", "points": 15},
        {"text": "Qu'est-ce qu'un volume Docker ?",
         "options": ["Persistance des données hors cycle de vie du conteneur", "Réseau Docker", "Image légère", "Type de port"],
         "correctAnswer": 0, "explanation": "Les volumes persistent même si le conteneur est supprimé.", "points": 15},
        {"text": "Différence CMD vs ENTRYPOINT ?",
         "options": ["ENTRYPOINT fixe ; CMD arguments par défaut modifiables", "CMD prioritaire", "Identiques", "CMD non surchargeable"],
         "correctAnswer": 0, "explanation": "ENTRYPOINT est fixe, CMD peut être remplacé.", "points": 20},
    ],
    "kubernetes": [
        {"text": "Qu'est-ce qu'un Pod Kubernetes ?",
         "options": ["Plus petite unité déployable avec un ou plusieurs conteneurs", "Un nœud de cluster", "Un service", "Un volume"],
         "correctAnswer": 0, "explanation": "Les Pods partagent adresse IP et volumes.", "points": 10},
        {"text": "Qu'est-ce qu'un Deployment Kubernetes ?",
         "options": ["Ressource gérant Pods avec rolling updates et rollback", "Un conteneur unique", "Un service réseau", "Un volume"],
         "correctAnswer": 0, "explanation": "Deployment gère réplicas, mises à jour et rollbacks.", "points": 15},
        {"text": "Qu'est-ce qu'un Service Kubernetes ?",
         "options": ["Abstraction réseau exposant Pods sous IP stable", "Pod spécial", "Monitoring", "Nœud maître"],
         "correctAnswer": 0, "explanation": "Service = découverte + load balancing entre Pods.", "points": 15},
        {"text": "Qu'est-ce que Helm ?",
         "options": ["Gestionnaire de paquets pour Kubernetes (charts)", "Monitoring", "Remplacement kubectl", "Type de réseau"],
         "correctAnswer": 0, "explanation": "Helm simplifie le déploiement via des charts réutilisables.", "points": 20},
    ],
    "devops": [
        {"text": "Qu'est-ce que CI/CD ?",
         "options": ["Intégration Continue / Déploiement Continu", "Configuration Initiale", "Protocole réseau", "Framework test"],
         "correctAnswer": 0, "explanation": "CI valide le code, CD automatise le déploiement.", "points": 10},
        {"text": "Qu'est-ce que Jenkins ?",
         "options": ["Serveur d'automatisation open-source pour CI/CD", "Framework Java", "Gestionnaire paquets", "Monitoring"],
         "correctAnswer": 0, "explanation": "Jenkins automatise build, tests et déploiement.", "points": 10},
        {"text": "Qu'est-ce que l'Infrastructure as Code ?",
         "options": ["Gérer l'infrastructure via fichiers versionnés (Terraform, Ansible)", "Écrire du code dans l'infra", "Un langage", "Type CI/CD"],
         "correctAnswer": 0, "explanation": "IaC = provisionner l'infra comme du code source.", "points": 15},
        {"text": "Blue-green vs canary deployment ?",
         "options": ["Blue-green : bascule 100% ; canary : % progressif du trafic", "Identiques", "Canary plus risqué", "Blue-green plus lent"],
         "correctAnswer": 0, "explanation": "Canary teste en production sur un sous-ensemble.", "points": 20},
    ],
    "sécurité": [
        {"text": "Qu'est-ce que l'injection SQL ?",
         "options": ["Code SQL malveillant via les entrées utilisateur", "Outil d'optimisation SQL", "Type de jointure", "Chiffrement"],
         "correctAnswer": 0, "explanation": "Solution : requêtes paramétrées. Top OWASP.", "points": 10},
        {"text": "Qu'est-ce que XSS ?",
         "options": ["Injection de scripts malveillants dans des pages web", "Protocole d'échange", "Algorithme de chiffrement", "Authentification"],
         "correctAnswer": 0, "explanation": "XSS exécute du JS dans le navigateur d'une victime.", "points": 15},
        {"text": "Qu'est-ce que HTTPS ?",
         "options": ["HTTP sécurisé par TLS chiffrant les communications", "HTTP plus rapide", "Sans état", "Type de firewall"],
         "correctAnswer": 0, "explanation": "HTTPS chiffre les données en transit via TLS.", "points": 10},
        {"text": "Qu'est-ce que le chiffrement asymétrique ?",
         "options": ["Paire clé publique/privée (RSA, TLS)", "Même clé pour chiffrer/déchiffrer", "Sans clé", "Hachage"],
         "correctAnswer": 0, "explanation": "Clé publique → chiffrer, clé privée → déchiffrer.", "points": 20},
        {"text": "Qu'est-ce qu'une attaque CSRF ?",
         "options": ["Forcer un utilisateur authentifié à agir involontairement", "Vol de cookie", "Injection SQL", "DDoS"],
         "correctAnswer": 0, "explanation": "CSRF exploite la confiance du serveur envers le navigateur.", "points": 15},
        {"text": "Principe du moindre privilège ?",
         "options": ["Accorder uniquement les droits minimum nécessaires", "Tous les droits aux admins", "Supprimer comptes inutilisés", "Chiffrer les MDP"],
         "correctAnswer": 0, "explanation": "Limite la surface d'attaque en cas de compromission.", "points": 15},
        {"text": "Qu'est-ce que le hachage de mot de passe ?",
         "options": ["Transformation irréversible (bcrypt, argon2)", "Chiffrement réversible", "Encodage Base64", "Compression"],
         "correctAnswer": 0, "explanation": "Hachage unidirectionnel — impossible de retrouver le MDP.", "points": 15},
        {"text": "Qu'est-ce que OAuth 2.0 ?",
         "options": ["Protocole d'autorisation pour accès à des ressources tierces", "Algorithme de chiffrement", "Authentification unique", "Gestionnaire sessions"],
         "correctAnswer": 0, "explanation": "Utilisé pour 'Connexion avec Google/GitHub'.", "points": 20},
        {"text": "Qu'est-ce qu'un VPN ?",
         "options": ["Réseau privé virtuel chiffrant les communications", "Type de firewall", "Protocole de routage", "Serveur proxy"],
         "correctAnswer": 0, "explanation": "VPN crée un tunnel chiffré sur des réseaux publics.", "points": 10},
        {"text": "Qu'est-ce qu'un firewall ?",
         "options": ["Système filtrant le trafic réseau selon des règles", "Antivirus", "VPN", "Protocole de routage"],
         "correctAnswer": 0, "explanation": "Firewall contrôle le trafic entrant/sortant.", "points": 10},
        {"text": "Qu'est-ce que l'authentification 2FA ?",
         "options": ["Deux méthodes distinctes (MDP + OTP)", "Deux mots de passe", "Deux appareils", "Algorithme de chiffrement"],
         "correctAnswer": 0, "explanation": "2FA : savoir + avoir ou être.", "points": 10},
    ],
    "database": [
        {"text": "Différence SQL vs NoSQL ?",
         "options": ["SQL : relationnel schéma fixe ; NoSQL : flexible", "NoSQL plus lent", "SQL sans jointures", "NoSQL sans texte"],
         "correctAnswer": 0, "explanation": "SQL : PostgreSQL, MySQL. NoSQL : MongoDB, Redis.", "points": 10},
        {"text": "Qu'est-ce qu'une clé primaire ?",
         "options": ["Identifiant unique de chaque enregistrement", "Première colonne", "Index automatique", "Clé étrangère spéciale"],
         "correctAnswer": 0, "explanation": "Clé primaire identifie chaque ligne de façon unique.", "points": 10},
        {"text": "Qu'est-ce que ACID ?",
         "options": ["Atomicité, Cohérence, Isolation, Durabilité", "Algorithme de chiffrement", "Type NoSQL", "ORM"],
         "correctAnswer": 0, "explanation": "ACID garantit la fiabilité des transactions.", "points": 20},
        {"text": "Qu'est-ce qu'un index de BDD ?",
         "options": ["Structure accélérant les requêtes", "Identifiant unique", "Type de relation", "Contrainte"],
         "correctAnswer": 0, "explanation": "B-Tree index : O(log n) au lieu de O(n).", "points": 15},
        {"text": "Qu'est-ce que la normalisation ?",
         "options": ["Organiser les tables pour réduire la redondance", "Augmenter les performances via index", "Compression", "Chiffrement"],
         "correctAnswer": 0, "explanation": "1NF, 2NF, 3NF éliminent les dépendances inutiles.", "points": 20},
    ],
    "javascript": [
        {"text": "Différence `let`, `const`, `var` ?",
         "options": ["const : immutable, let : block-scope, var : function-scope", "Identiques", "var le plus moderne", "const réassignable"],
         "correctAnswer": 0, "explanation": "Préférer const, let si réassignation. var à éviter.", "points": 10},
        {"text": "Qu'est-ce qu'une Promise ?",
         "options": ["Opération asynchrone : pending/fulfilled/rejected", "Variable spéciale", "Boucle", "Module ES6"],
         "correctAnswer": 0, "explanation": "Promises remplacent les callbacks imbriqués.", "points": 15},
        {"text": "Qu'est-ce que `async/await` ?",
         "options": ["Syntaxe simplifiée pour les Promises", "Nouveau type de variable", "Framework", "Protocole"],
         "correctAnswer": 0, "explanation": "Rend le code asynchrone plus lisible.", "points": 15},
        {"text": "Qu'est-ce que l'event loop ?",
         "options": ["Mécanisme gérant l'asynchronisme en JS monothreadé", "Boucle for spéciale", "Gestionnaire DOM", "Timer"],
         "correctAnswer": 0, "explanation": "Traite call stack et callback queue.", "points": 20},
        {"text": "Qu'est-ce qu'un closure ?",
         "options": ["Accès aux variables de portée parente après exécution", "Fonction anonyme", "Module fermé", "Gestionnaire d'erreurs"],
         "correctAnswer": 0, "explanation": "Closures mémorisent leur environnement lexical.", "points": 20},
    ],
    "git": [
        {"text": "Différence `git rebase` vs `git merge` ?",
         "options": ["rebase : historique linéaire ; merge : historique complet", "Identiques", "merge dangereux", "rebase local uniquement"],
         "correctAnswer": 0, "explanation": "Rebase crée un historique propre.", "points": 20},
        {"text": "Que fait `git stash` ?",
         "options": ["Sauvegarde temporaire des modifications non commitées", "Supprime des branches", "Merge deux branches", "Revert"],
         "correctAnswer": 0, "explanation": "Met de côté les changements en cours.", "points": 10},
        {"text": "Qu'est-ce qu'un Pull Request ?",
         "options": ["Demande de fusion avec code review", "Récupération de code distant", "Type de commit", "Tag de version"],
         "correctAnswer": 0, "explanation": "PRs facilitent la revue avant fusion.", "points": 10},
    ],
    "réseau": [
        {"text": "Qu'est-ce que le modèle OSI ?",
         "options": ["Modèle en 7 couches pour les communications réseau", "Protocole de routage", "Algorithme", "Type de câblage"],
         "correctAnswer": 0, "explanation": "OSI : Physique, Liaison, Réseau, Transport, Session, Présentation, Application.", "points": 15},
        {"text": "Différence TCP vs UDP ?",
         "options": ["TCP : fiable avec accusé de réception ; UDP : rapide sans garantie", "TCP plus rapide", "UDP garantit livraison", "Mêmes ports"],
         "correctAnswer": 0, "explanation": "TCP pour données critiques, UDP pour streaming.", "points": 15},
        {"text": "Qu'est-ce que DNS ?",
         "options": ["Traduit noms de domaine en adresses IP", "Protocole de sécurité", "Firewall", "Routage"],
         "correctAnswer": 0, "explanation": "DNS résout 'google.com' → '142.250.74.46'.", "points": 10},
    ],
    "default": [
        {"text": "Qu'est-ce que le principe DRY ?",
         "options": ["Don't Repeat Yourself — éviter la duplication", "Do Refactor Yearly", "Dynamic Runtime Yield", "Design Review Yearly"],
         "correctAnswer": 0, "explanation": "Chaque logique n'existe qu'à un seul endroit.", "points": 10},
        {"text": "Qu'est-ce que le pattern MVC ?",
         "options": ["Model-View-Controller — séparation métier/interface/contrôle", "Multi-Version-Control", "Managed Virtual Container", "Module View Component"],
         "correctAnswer": 0, "explanation": "MVC sépare les responsabilités pour la maintenabilité.", "points": 10},
        {"text": "Qu'est-ce que le TDD ?",
         "options": ["Écrire les tests avant le code", "Tester après déploiement", "Framework de test", "Type de CI/CD"],
         "correctAnswer": 0, "explanation": "TDD : Red → Green → Refactor.", "points": 15},
        {"text": "Qu'est-ce que la complexité O(n) ?",
         "options": ["Temps d'exécution linéaire avec la taille", "Temps constant", "Quadratique", "Logarithmique"],
         "correctAnswer": 0, "explanation": "Big O = complexité dans le pire cas.", "points": 15},
        {"text": "Qu'est-ce que le principe SOLID ?",
         "options": ["5 principes de conception OO (SRP, OCP, LSP, ISP, DIP)", "Langage de programmation", "Framework agile", "Versioning"],
         "correctAnswer": 0, "explanation": "SOLID guide la conception de systèmes maintenables.", "points": 20},
        {"text": "Qu'est-ce qu'un microservice ?",
         "options": ["Architecture en services indépendants déployables séparément", "Service web minimal", "Composant React", "Lambda"],
         "correctAnswer": 0, "explanation": "Chaque microservice a sa BDD et communique via API.", "points": 15},
        {"text": "Qu'est-ce que GraphQL ?",
         "options": ["Langage de requête permettant de demander exactement les données voulues", "Base de données", "Protocole réseau", "Framework JS"],
         "correctAnswer": 0, "explanation": "GraphQL évite over-fetching et under-fetching.", "points": 15},
        {"text": "Qu'est-ce que WebSocket ?",
         "options": ["Protocole bidirectionnel temps réel sur TCP persistant", "HTTP amélioré", "Proxy", "Chiffrement"],
         "correctAnswer": 0, "explanation": "WebSocket = push serveur sans polling.", "points": 15},
        {"text": "Qu'est-ce que la récursivité ?",
         "options": ["Fonction qui s'appelle avec un cas de base d'arrêt", "Boucle infinie", "Pointeur", "Tri"],
         "correctAnswer": 0, "explanation": "Cas de base + réduction du problème.", "points": 10},
        {"text": "Qu'est-ce qu'un algorithme quicksort ?",
         "options": ["Diviser-pour-régner O(n log n) en moyenne", "O(n²) toujours", "Stable", "Tri par insertion"],
         "correctAnswer": 0, "explanation": "Quicksort partitionne autour d'un pivot récursivement.", "points": 15},
        {"text": "Qu'est-ce que le versioning sémantique (SemVer) ?",
         "options": ["MAJEUR.MINEUR.PATCH selon l'impact", "Outil Git", "Protocole de déploiement", "Format de config"],
         "correctAnswer": 0, "explanation": "1.2.3 → MAJEUR (breaking), MINEUR (feature), PATCH (fix).", "points": 10},
        {"text": "Qu'est-ce qu'une pile (Stack) ?",
         "options": ["LIFO — dernier entré, premier sorti", "FIFO", "Tableau indexé", "Arbre binaire"],
         "correctAnswer": 0, "explanation": "Pile utilisée pour récursion, annulation, analyse syntaxique.", "points": 10},
    ],
}

KEYWORD_MAP = {
    "python": "python", "flask": "python", "fastapi": "python", "pandas": "python", "numpy": "python",
    "machine learning": "machine learning", "deep learning": "machine learning",
    "tensorflow": "machine learning", "pytorch": "machine learning", "sklearn": "machine learning",
    "neural": "machine learning", "réseau de neurones": "machine learning",
    "ia": "intelligence artificielle", "intelligence artificielle": "intelligence artificielle", "nlp": "intelligence artificielle", "gpt": "intelligence artificielle",
    "react": "react", "redux": "react",
    "angular": "angular", "rxjs": "angular",
    "typescript": "typescript", "ts": "typescript",
    "spring": "spring", "spring boot": "spring", "jpa": "spring", "hibernate": "spring", "jwt": "spring",
    "java": "java",
    "docker": "docker", "conteneur": "docker", "container": "docker",
    "kubernetes": "kubernetes", "k8s": "kubernetes", "helm": "kubernetes",
    "devops": "devops", "ci/cd": "devops", "jenkins": "devops", "gitlab": "devops", "pipeline": "devops",
    "sécurité": "sécurité", "security": "sécurité", "firewall": "sécurité", "injection": "sécurité", "xss": "sécurité",
    "sql": "database", "base de données": "database", "nosql": "database", "mongodb": "database", "postgresql": "database",
    "javascript": "javascript", "js": "javascript", "es6": "javascript", "node": "javascript",
    "git": "git",
    "réseau": "réseau", "network": "réseau", "tcp": "réseau", "http": "réseau", "dns": "réseau",
}


# ─────────────────────────────────────────────────────────────────────────────
# Main generator class
# ─────────────────────────────────────────────────────────────────────────────

class QuizGenerator:

    def generate(self, topic: str, course_title: str = "", count: int = 10,
                 question_type: str = "single") -> List[Dict]:
        count = min(count, 40)

        # ── 1. Try Groq LLM (content-adaptive) ──────────────────────────────
        if _groq_key():
            result = self._generate_with_groq(topic, course_title, count, question_type)
            if result and len(result) >= max(1, count // 2):
                return [{"sortOrder": i, **q} for i, q in enumerate(result[:count])]

        # ── 2. Keyword-based fallback (static banks) ─────────────────────────
        return self._generate_from_banks(topic, course_title, count)

    # ── Groq LLM ─────────────────────────────────────────────────────────────

    def _generate_with_groq(self, topic: str, course_title: str, count: int,
                             question_type: str = "single") -> Optional[List[Dict]]:
        template = QUIZ_PROMPT_MIXED if question_type == "mixed" else QUIZ_PROMPT_SINGLE
        prompt = template.format(count=count, content=topic[:6000])
        api_key = _groq_key()
        try:
            with httpx.Client(timeout=60) as client:
                resp = client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                        "max_tokens": 6000,
                    },
                )
            if resp.status_code != 200:
                logger.warning("Groq HTTP %s: %s", resp.status_code, resp.text[:300])
                return None

            raw = resp.json()["choices"][0]["message"]["content"]
            logger.info("Groq raw response length: %d chars", len(raw))

            questions = self._parse_questions_json(raw)
            if questions is None:
                logger.warning("All JSON parse strategies failed")
                return None

            valid = self._validate_questions(questions)
            logger.info("Groq: %d valid questions parsed", len(valid))
            return valid if valid else None

        except Exception as e:
            logger.error("Groq generation failed: %s", e, exc_info=True)
            return None

    def _parse_questions_json(self, raw: str) -> Optional[List]:
        """Try multiple strategies to extract a JSON array from a (possibly malformed) LLM response."""
        # Strategy 1: direct parse of the whole response
        try:
            data = json.loads(raw.strip())
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

        # Strategy 2: extract the outer [...] block and parse it
        match = re.search(r'\[[\s\S]*\]', raw)
        if match:
            candidate = match.group(0)
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

            # Strategy 3: clean common LLM mistakes then retry
            cleaned = self._clean_json(candidate)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass

        # Strategy 4: extract individual {...} objects with a scanner
        return self._extract_objects(raw)

    @staticmethod
    def _clean_json(text: str) -> str:
        """Fix the most common LLM JSON mistakes."""
        # Trailing commas before } or ]
        text = re.sub(r',\s*([\}\]])', r'\1', text)
        # Replace smart/curly quotes
        text = text.replace('‘', "'").replace('’', "'")
        text = text.replace('“', '"').replace('”', '"')
        # Remove literal newlines inside strings (replace with \n escape)
        def fix_strings(m: re.Match) -> str:
            return m.group(0).replace('\n', '\\n').replace('\r', '')
        text = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', fix_strings, text, flags=re.DOTALL)
        return text

    @staticmethod
    def _extract_objects(raw: str) -> Optional[List]:
        """
        Last-resort: scan character-by-character for balanced {...} blocks
        and parse each one individually.
        """
        results = []
        depth = 0
        start = -1
        for i, ch in enumerate(raw):
            if ch == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0 and start != -1:
                    blob = raw[start:i + 1]
                    try:
                        obj = json.loads(blob)
                        if isinstance(obj, dict):
                            results.append(obj)
                    except json.JSONDecodeError:
                        try:
                            cleaned = re.sub(r',\s*([\}\]])', r'\1', blob)
                            obj = json.loads(cleaned)
                            if isinstance(obj, dict):
                                results.append(obj)
                        except Exception:
                            pass
                    start = -1
        return results if results else None

    def _validate_questions(self, questions: List) -> List[Dict]:
        """Filter and normalise raw question dicts."""
        valid: List[Dict] = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            if not all(k in q for k in ("text", "options", "correctAnswer")):
                continue
            opts = q.get("options", [])
            if not isinstance(opts, list) or len(opts) < 2:
                continue
            seen_opts: set = set()
            clean_opts: List[str] = []
            for o in opts:
                o_str = str(o).strip()
                if o_str and o_str not in seen_opts:
                    seen_opts.add(o_str)
                    clean_opts.append(o_str)
                if len(clean_opts) == 6:
                    break
            if len(clean_opts) < 2:
                continue
            ca = q.get("correctAnswer", 0)
            try:
                ca = int(ca)
            except (ValueError, TypeError):
                ca = 0
            ca = max(0, min(ca, len(clean_opts) - 1))
            valid.append({
                "text": str(q["text"]).strip(),
                "options": clean_opts,
                "correctAnswer": ca,
                "explanation": str(q.get("explanation", "")).strip(),
                "points": int(q.get("points", 10)),
            })
        return valid

    # ── Static keyword-based fallback ────────────────────────────────────────

    def _match_topics(self, text: str) -> List[str]:
        lower = text.lower()
        matched: set = set()
        for kw, key in KEYWORD_MAP.items():
            if kw in lower:
                matched.add(key)
        for key in TEMPLATES:
            if key in lower:
                matched.add(key)
        return list(matched) if matched else ["default"]

    def _generate_from_banks(self, topic: str, course_title: str, count: int) -> List[Dict]:
        combined = topic + " " + course_title
        matched_keys = self._match_topics(combined)

        pool: List[Dict] = []
        for key in matched_keys:
            pool.extend(TEMPLATES.get(key, []))
        if "default" not in matched_keys:
            pool.extend(random.sample(TEMPLATES["default"], min(6, len(TEMPLATES["default"]))))

        random.shuffle(pool)
        seen: set = set()
        unique: List[Dict] = []
        for q in pool:
            if q["text"] not in seen:
                seen.add(q["text"])
                unique.append(q)

        for q in TEMPLATES["default"]:
            if q["text"] not in seen:
                seen.add(q["text"])
                unique.append(q)

        while len(unique) < count:
            extra = random.choice(list(TEMPLATES.values()))
            for q in extra:
                if len(unique) >= count:
                    break
                unique.append({**q, "text": q["text"] + " (bis)"})

        return [{"sortOrder": i, **q} for i, q in enumerate(unique[:count])]

    def generate_summary(self, topic: str, level: str = "Intermédiaire") -> str:
        intros = {
            "Débutant": f"Ce cours introduit les fondamentaux de **{topic}** sans prérequis. Vous apprendrez les concepts essentiels avec des exemples concrets.",
            "Intermédiaire": f"Ce cours approfondit **{topic}**. Il suppose une connaissance de base et guide vers la maîtrise des concepts avancés.",
            "Avancé": f"Ce cours expert couvre les aspects avancés de **{topic}**. Conçu pour les praticiens souhaitant maîtriser les subtilités du domaine.",
        }
        return intros.get(level, intros["Intermédiaire"])
