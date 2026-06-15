"""
AI Quiz Generator — Groq cloud backend (llama-3.1-8b-instant).
Falls back to keyword-based static banks when GROQ_API_KEY is absent.
"""

import os
import re
import json
import random
import logging
import time
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger("eduai.generator")

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


def _groq_key() -> str:
    return os.getenv("GROQ_API_KEY", "")

QUIZ_PROMPT_SINGLE = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM à CHOIX UNIQUE basées sur le texte ci-dessous.

=== TEXTE SOURCE ===
{content}
=== FIN DU TEXTE ===

RÈGLES ABSOLUES — violations = réponse rejetée :
1. FORMULATION AUTONOME : la question doit être compréhensible SANS le texte. INTERDIT : "selon l'énoncé", "d'après le texte", "dans le document", "selon le passage". Reformule le contexte DANS la question elle-même.
2. DIVERSITÉ COGNITIVE OBLIGATOIRE — répartis les {count} questions ainsi :
   - 30% RAPPEL : "Quel est…", "Quelle est la définition de…", "Combien…"
   - 40% COMPRÉHENSION/ANALYSE : "Comment fonctionne…", "Pourquoi…", "Quelle différence entre X et Y…"
   - 30% APPLICATION : "Dans quel cas utiliserait-on…", "Lequel de ces scénarios illustre…", "Quel problème résout…"
3. SUJETS DIFFÉRENTS : chaque question doit porter sur un concept/fait DISTINCT du texte. Aucune reformulation d'une question précédente.
4. EXACTEMENT 4 options — aucun doublon. correctAnswer = index 0..3, DISTRIBUÉ uniformément sur toutes les questions (pas toujours 0 ou 1).
5. Les 3 mauvaises options : plausibles, du même domaine, mais factuellement incorrectes. Évite les options absurdes ou hors sujet.
6. INTERDIT dans les options : "Toutes les réponses", "Toutes les options", "Aucune des réponses", "Tous les protocoles", "Toutes les méthodes" — jamais d'option générique fourre-tout.
7. Explication : justifie en 1-2 phrases précises sans dire "le texte dit" ou "d'après le cours".
8. points = 10 (rappel de fait), 15 (compréhension), 20 (application/analyse).
9. Français obligatoire.

EXEMPLES DE BONNES FORMULATIONS :
- Rappel : "Quelle est la principale caractéristique d'un ransomware ?"
- Analyse : "Pourquoi le ransomware chiffre-t-il les fichiers avant d'afficher la demande de rançon ?"
- Application : "Un administrateur constate que des fichiers sont chiffrés et qu'une note de rançon est affichée. Quelle est la première action à entreprendre ?"

Réponds UNIQUEMENT avec un tableau JSON valide :
[{{"text":"Question autonome et précise ?","options":["Option A","Option B","Option C","Option D"],"correctAnswer":2,"explanation":"Parce que...","points":15}}]"""

QUIZ_PROMPT_TOPIC_SINGLE = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM à CHOIX UNIQUE sur le sujet : "{subject}" (cours : "{course}").

RÈGLES ABSOLUES :
1. DIVERSITÉ COGNITIVE — répartis les {count} questions :
   - 30% RAPPEL : définitions, faits précis, chiffres clés de "{subject}"
   - 40% COMPRÉHENSION : mécanismes, fonctionnement, différences, comparaisons
   - 30% APPLICATION : scénarios réels, cas d'usage, résolution de problèmes
2. SUJETS VARIÉS : chaque question porte sur un ASPECT DIFFÉRENT de "{subject}". Interdis les reformulations.
3. INTERDIT absolu : questions méta ("que contient ce cours", "quels modules", "selon l'énoncé").
4. INTERDIT : questions trop génériques ("Qu'est-ce que X ?"). Préfère "Comment X fonctionne-t-il ?", "Pourquoi utilise-t-on X plutôt que Y ?", "Dans quel cas X est-il préférable ?".
5. EXACTEMENT 4 options. correctAnswer = index 0..3, bien distribué sur les {count} questions.
6. Options incorrectes : plausibles, dans le même domaine, mais factuellement fausses.
7. Explication : 1-2 phrases précises.
8. points = 10 (fait simple), 15 (compréhension), 20 (analyse/application).
9. Français obligatoire.

Réponds UNIQUEMENT avec un tableau JSON valide :
[{{"text":"Question précise sur {subject} ?","options":["Option A","Option B","Option C","Option D"],"correctAnswer":2,"explanation":"Parce que...","points":15}}]"""

QUIZ_PROMPT_TOPIC_MIXED = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM à CHOIX MULTIPLE sur le sujet : "{subject}" (cours : "{course}").

FORMAT OBLIGATOIRE — chaque objet JSON DOIT avoir "correctAnswers" (tableau, PAS "correctAnswer") :
[
  {{
    "text": "Quelles caractéristiques définissent {subject} ?",
    "options": ["Option A","Option B","Option C","Option D","Option E"],
    "correctAnswers": [0, 2],
    "explanation": "A car... C car...",
    "points": 15
  }},
  {{
    "text": "Quels avantages offre {subject} par rapport à une approche classique ?",
    "options": ["Option A","Option B","Option C","Option D"],
    "correctAnswers": [1, 3],
    "explanation": "B car... D car...",
    "points": 15
  }}
]

RÈGLES STRICTES :
1. "correctAnswers" EST UN TABLEAU avec 2 ou 3 indices. JAMAIS "correctAnswer" (singulier). JAMAIS 1 seul indice.
2. Entre 4 et 6 options. Exactement 2-3 correctes, le reste incorrectes mais plausibles.
3. DIVERSITÉ : chaque question teste un ASPECT DIFFÉRENT de "{subject}" (mécanismes, cas d'usage, propriétés, comparaisons, impacts).
4. INTERDIT : questions méta ("que contient ce cours"). Questions d'expertise réelle uniquement.
5. INTERDIT dans les options : "Toutes les réponses", "Toutes les options", "Aucune des réponses" — jamais de fourre-tout.
6. points = 15 (2 correctes) ou 20 (3 correctes).
7. Français obligatoire.

Réponds UNIQUEMENT avec le tableau JSON :
[{{"text":"...","options":["A","B","C","D"],"correctAnswers":[0,2],"explanation":"...","points":15}}]"""

QUIZ_PROMPT_MIXED = """\
Tu es un expert pédagogique francophone. Génère exactement {count} questions QCM à CHOIX MULTIPLE basées sur le texte ci-dessous.

=== TEXTE SOURCE ===
{content}
=== FIN DU TEXTE ===

FORMAT OBLIGATOIRE — TOUS les objets JSON DOIVENT avoir "correctAnswers" (tableau, JAMAIS "correctAnswer") :
[
  {{
    "text": "Quels mécanismes caractérisent X ?",
    "options": ["Option A","Option B","Option C","Option D","Option E"],
    "correctAnswers": [0, 3],
    "explanation": "A car... D car...",
    "points": 15
  }}
]

RÈGLES STRICTES :
1. "correctAnswers" EST UN TABLEAU avec 2 ou 3 indices. JAMAIS "correctAnswer" (singulier). JAMAIS 1 seul indice. JAMAIS tous les indices.
2. Entre 4 et 6 options par question. Exactement 2-3 correctes, le reste incorrectes mais plausibles.
3. FORMULATION AUTONOME : question compréhensible sans le texte. INTERDIT : "selon l'énoncé", "d'après le texte", "selon le passage".
4. DIVERSITÉ COGNITIVE — répartis les {count} questions :
   - Questions sur des faits précis du texte (propriétés, exemples, valeurs)
   - Questions sur des mécanismes et fonctionnements
   - Questions comparatives (différences, similitudes entre concepts du texte)
5. Mauvaises options : plausibles du même domaine, mais factuellement incorrectes.
6. INTERDIT dans les options : "Toutes les réponses", "Toutes les options", "Aucune des réponses" — jamais de fourre-tout.
7. points = 15 (2 correctes) ou 20 (3 correctes).
8. Français obligatoire.

Réponds UNIQUEMENT avec le tableau JSON (pas de texte avant, pas après) :
[{{"text":"...","options":["A","B","C","D"],"correctAnswers":[1,3],"explanation":"...","points":15}}]"""


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
    "malware": "sécurité", "malwares": "sécurité", "virus": "sécurité", "ransomware": "sécurité",
    "cheval de troie": "sécurité", "trojan": "sécurité", "botnet": "sécurité", "phishing": "sécurité",
    "cryptographie": "sécurité", "chiffrement": "sécurité", "vulnérabilité": "sécurité",
    "sql": "database", "base de données": "database", "nosql": "database", "mongodb": "database", "postgresql": "database",
    "javascript": "javascript", "js": "javascript", "es6": "javascript", "node": "javascript",
    "git": "git",
    "réseau": "réseau", "network": "réseau", "tcp": "réseau", "http": "réseau", "dns": "réseau",
    "protocole": "réseau", "routage": "réseau", "commutation": "réseau", "vlan": "réseau",
    "adresse ip": "réseau", "sous-réseau": "réseau", "pare-feu": "sécurité",
}


# ─────────────────────────────────────────────────────────────────────────────
# Main generator class
# ─────────────────────────────────────────────────────────────────────────────

def _extract_meta(topic: str, prefix: str) -> str:
    """Extract a single metadata value from the topic string."""
    for line in topic.splitlines():
        if line.startswith(prefix):
            return line[len(prefix):].strip()
    return ""


# Common question-structure words that appear in almost every quiz question —
# excluded from topic-similarity so they don't inflate Jaccard between different topics.
_TOPIC_STOP = frozenset({
    'quels', 'quelles', 'quelle', 'comment', 'pourquoi', 'lequel', 'laquelle',
    'quel', 'types', 'type', 'avantages', 'avantage', 'mécanismes', 'mécanisme',
    'éléments', 'élément', 'prendre', 'compte', 'recommandés', 'courants',
    'objectif', 'principal', 'principales', 'utilisation', 'utiliser',
    'permet', 'permettent', 'toutes', 'leurs', 'cette',
})


def _word_set(text: str) -> frozenset:
    """Domain-significant words (len≥5) for topic-similarity dedup, with structural stop words removed."""
    words = re.findall(r'[a-zA-Zàâçéèêëîïôûùüÿñæœ]{5,}', text.lower())
    return frozenset(w for w in words if w not in _TOPIC_STOP)


def _is_topic_dup(new_words: frozenset, seen_word_sets: list, threshold: float = 0.58) -> bool:
    """True if Jaccard similarity of domain words exceeds threshold with any seen question."""
    if not new_words:
        return False
    for existing in seen_word_sets:
        if not existing:
            continue
        union = len(new_words | existing)
        if union > 0 and len(new_words & existing) / union >= threshold:
            return True
    return False


class QuizGenerator:

    def generate(self, topic: str, course_title: str = "", count: int = 10,
                 question_type: str = "single") -> List[Dict]:
        count = min(count, 10)
        is_mixed = question_type == "mixed"

        content = self._extract_content_section(topic)
        subject = _extract_meta(topic, "LEÇON:") or _extract_meta(topic, "MODULE:") or course_title

        logger.info("Quiz gen: content_len=%d subject='%s' type=%s count=%d",
                    len(content), subject, question_type, count)

        if _groq_key():
            if is_mixed:
                return self._generate_mixed_batched(content, subject, course_title, count)
            else:
                return self._generate_single_batched(content, subject, course_title, count)

        # No LLM available — fall back to keyword bank
        return self._generate_from_banks(topic, course_title, count)

    def _generate_single_batched(self, content: str, subject: str,
                                  course_title: str, count: int) -> List[Dict]:
        """
        Generate SINGLE questions in batches of 5, passing already-seen question texts
        AND option fingerprints as exclusions so the model generates genuinely different
        questions instead of paraphrasing the same concept multiple times.
        """
        BATCH = 5
        all_questions: List[Dict] = []
        seen_texts: set = set()
        seen_opts: set = set()
        seen_topic_words: list = []  # word sets for Jaccard topic-similarity dedup
        max_batches = (count // BATCH) + 4
        consecutive_failures = 0
        zero_new_streak = 0
        content_exhausted = False

        for _ in range(max_batches):
            if len(all_questions) >= count:
                break
            need = min(BATCH, count - len(all_questions))
            exclusions = [q.get("text", "") for q in all_questions]

            batch: Optional[List[Dict]] = None
            if not content_exhausted and len(content) >= 200:
                batch = self._generate_with_groq(content, course_title, need, "single",
                                                  exclusions=exclusions)
            if not batch and subject:
                batch = self._generate_from_topic(subject, course_title, need, "single",
                                                   exclusions=exclusions)

            if not batch:
                consecutive_failures += 1
                zero_new_streak = 0
                if consecutive_failures >= 3:
                    break
                continue

            consecutive_failures = 0
            prev_len = len(all_questions)
            for q in batch:
                txt = q.get("text", "")
                opts_key = frozenset(str(o).lower().strip() for o in q.get("options", []))
                new_words = _word_set(txt)
                if (txt and txt not in seen_texts
                        and opts_key not in seen_opts
                        and not _is_topic_dup(new_words, seen_topic_words)):
                    seen_texts.add(txt)
                    seen_opts.add(opts_key)
                    seen_topic_words.append(new_words)
                    all_questions.append(q)
            added = len(all_questions) - prev_len
            logger.info("Single batch: +%d new questions (%d/%d total)",
                        added, len(all_questions), count)
            if added == 0:
                zero_new_streak += 1
                if zero_new_streak >= 2:
                    if not content_exhausted:
                        # PDF content exhausted — switch to topic-only for remaining slots
                        content_exhausted = True
                        zero_new_streak = 0
                        logger.info("Single batching: PDF exhausted, switching to topic-only (%d/%d)",
                                    len(all_questions), count)
                    else:
                        # Topic also exhausted — truly stop
                        logger.info("Single batching: content+topic exhausted after %d questions",
                                    len(all_questions))
                        break
            else:
                zero_new_streak = 0

        if all_questions:
            return [{"sortOrder": i, **q} for i, q in enumerate(all_questions[:count])]

        return self._generate_from_banks(f"{subject} {course_title}", course_title, count)

    def _generate_mixed_batched(self, content: str, subject: str,
                                 course_title: str, count: int) -> List[Dict]:
        """
        Generate MIXED questions in batches of 5.
        Small batches keep llama-3.1-8b-instant consistent: it generates correctAnswers (array)
        for all 5 questions instead of drifting back to correctAnswer (single) mid-output.
        Passes already-seen question texts as exclusions so the model avoids duplicates.
        Retries up to 3 consecutive failures before giving up.
        """
        BATCH = 5
        all_questions: List[Dict] = []
        seen_texts: set = set()
        seen_opts: set = set()
        seen_topic_words: list = []  # word sets for Jaccard topic-similarity dedup
        max_batches = (count // BATCH) + 5
        consecutive_failures = 0
        zero_new_streak = 0
        content_exhausted = False

        for _ in range(max_batches):
            if len(all_questions) >= count:
                break
            need = min(BATCH, count - len(all_questions))

            exclusions = [q.get("text", "") for q in all_questions]

            batch: Optional[List[Dict]] = None
            if not content_exhausted and len(content) >= 200:
                batch = self._generate_with_groq(content, course_title, need, "mixed",
                                                  exclusions=exclusions)
            if not batch and subject:
                batch = self._generate_from_topic(subject, course_title, need, "mixed",
                                                   exclusions=exclusions)

            if not batch:
                consecutive_failures += 1
                zero_new_streak = 0
                logger.warning("Mixed batch failure #%d (all questions had wrong format)",
                               consecutive_failures)
                if consecutive_failures >= 3:
                    logger.warning("Mixed batching: 3 consecutive failures, stopping early")
                    break
                continue

            consecutive_failures = 0
            prev_len = len(all_questions)
            for q in batch:
                txt = q.get("text", "")
                opts_key = frozenset(str(o).lower().strip() for o in q.get("options", []))
                new_words = _word_set(txt)
                if (txt and txt not in seen_texts
                        and opts_key not in seen_opts
                        and not _is_topic_dup(new_words, seen_topic_words)):
                    seen_texts.add(txt)
                    seen_opts.add(opts_key)
                    seen_topic_words.append(new_words)
                    all_questions.append(q)
            added = len(all_questions) - prev_len
            logger.info("Mixed batch: +%d new questions (%d/%d total)",
                        added, len(all_questions), count)
            if added == 0:
                zero_new_streak += 1
                if zero_new_streak >= 2:
                    # PDF content exhausted for MIXED — stop here (topic fallback creates off-topic questions)
                    logger.info("Mixed batching: PDF content exhausted after %d questions (stopping)",
                                len(all_questions))
                    break
            else:
                zero_new_streak = 0

        if all_questions:
            return [{"sortOrder": i, **q} for i, q in enumerate(all_questions[:count])]

        return self._generate_from_banks(f"{subject} {course_title}", course_title, count)

    @staticmethod
    def _extract_content_section(topic: str) -> str:
        """
        Extract only prose content from the structured topic string.
        Strips ALL structural headers (## Module:, ### Lesson:) and metadata labels.
        """
        STRUCTURAL_PREFIXES = ("##", "###", "#", "LEÇON:", "MODULE:", "COURS:",
                               "CATÉGORIE:", "TAGS:", "DESCRIPTION:")

        for marker in ("CONTENU EXTRAIT DU PDF:\n", "CONTENU DES LEÇONS:\n",
                       "CONTENU DU COURS:\n", "CONTENU:\n"):
            if marker in topic:
                raw = topic.split(marker, 1)[1]
                # Keep only prose lines — discard structural headers
                lines = [
                    l for l in raw.splitlines()
                    if l.strip() and not any(l.lstrip().startswith(p) for p in STRUCTURAL_PREFIXES)
                ]
                return "\n".join(lines).strip()

        # Fallback: filter all known metadata/structural prefixes
        lines = [
            l for l in topic.splitlines()
            if l.strip() and not any(l.startswith(p) for p in STRUCTURAL_PREFIXES)
        ]
        return "\n".join(lines).strip()

    def _generate_from_content(self, content: str, course_title: str, count: int) -> List[Dict]:
        """
        Build quiz questions directly from lesson text without Groq.
        Extracts declarative sentences and turns them into fill-in questions.
        """
        import re as _re
        sentences = [
            s.strip() for s in _re.split(r'[.!?]\s+', content)
            if 40 < len(s.strip()) < 350 and not s.strip().startswith(('#', '-', '*'))
        ]
        random.shuffle(sentences)

        questions: List[Dict] = []
        used: set = set()

        for sent in sentences:
            if len(questions) >= count:
                break

            # Skip sentences that are too vague
            if not any(c.isupper() for c in sent) and len(sent.split()) < 8:
                continue

            # Find a key term in the sentence (first UPPER-CASE word or proper noun-ish token)
            words = sent.split()
            key_term = next(
                (w.strip('.,;:()') for w in words[2:]
                 if len(w) >= 4 and (w[0].isupper() or w.isupper())),
                None
            )
            if not key_term or key_term in used:
                continue
            used.add(key_term)

            # Build question by replacing the key term with a blank
            question_text = sent.replace(key_term, "___", 1)
            if "___" not in question_text:
                continue

            # Generate plausible distractors from other key terms found in the content
            other_terms = list({
                w.strip('.,;:()') for w in content.split()
                if len(w) >= 4 and w[0].isupper() and w.strip('.,;:()') != key_term
                and w.strip('.,;:()') not in used
            })
            random.shuffle(other_terms)
            distractors = other_terms[:3]

            if len(distractors) < 3:
                # Pad with generic wrong answers
                pads = ["Aucune des réponses", "Non applicable", "Valeur non définie"]
                distractors += pads[:3 - len(distractors)]

            options = distractors[:3] + [key_term]
            random.shuffle(options)
            correct_idx = options.index(key_term)

            questions.append({
                "text": f"Complétez : « {question_text} »",
                "options": options,
                "correctAnswer": correct_idx,
                "explanation": f"La bonne réponse est **{key_term}**. Phrase originale : « {sent}. »",
                "points": 10,
            })

        return questions

    # ── Groq LLM caller ──────────────────────────────────────────────────────

    def _call_llm(self, prompt: str, max_tokens: int, temperature: float,
                  question_type: str) -> Optional[List[Dict]]:
        """Call Groq API with automatic 429 back-off. Up to 3 attempts."""
        key = _groq_key()
        if not key:
            logger.warning("No GROQ_API_KEY set")
            return None

        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

        for attempt in range(3):
            try:
                resp = httpx.post(
                    GROQ_URL,
                    headers=headers,
                    json={
                        "model": GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    timeout=60,
                )

                if resp.status_code == 429:
                    wait = 8.0
                    try:
                        msg = resp.json().get("error", {}).get("message", "")
                        m = re.search(r'in (\d+\.?\d*)s', msg)
                        if m:
                            wait = float(m.group(1)) + 1.0
                    except Exception:
                        pass
                    logger.warning("Groq 429 — sleeping %.1fs (attempt %d)", wait, attempt + 1)
                    time.sleep(wait)
                    continue

                if resp.status_code != 200:
                    logger.warning("Groq HTTP %s: %s", resp.status_code, resp.text[:200])
                    return None

                raw = resp.json()["choices"][0]["message"]["content"]
                logger.info("Groq response: %d chars", len(raw))
                questions = self._parse_questions_json(raw)
                if questions is None:
                    logger.warning("JSON parse failed for Groq response")
                    return None
                valid = self._validate_questions(questions, question_type)
                logger.info("Groq: %d valid questions parsed", len(valid))
                return valid if valid else None

            except httpx.TimeoutException:
                logger.warning("Groq timeout on attempt %d", attempt + 1)
                if attempt == 2:
                    return None
                time.sleep(2)
            except Exception as e:
                logger.warning("Groq attempt %d failed: %s", attempt + 1, e)
                if attempt == 2:
                    return None
                time.sleep(2)

        return None

    def _generate_with_groq(self, content: str, course_title: str, count: int,
                             question_type: str = "single",
                             exclusions: Optional[List[str]] = None) -> Optional[List[Dict]]:
        """Generate questions from PDF content using the best available LLM."""
        is_mixed = question_type == "mixed"
        template = QUIZ_PROMPT_MIXED if is_mixed else QUIZ_PROMPT_SINGLE
        max_tokens = min(count * 220 + 500, 7000) if is_mixed else min(count * 130 + 300, 4000)
        temperature = 0.15 if is_mixed else 0.4
        llm_content = (f"Cours : {course_title}\n\n{content[:8000]}"
                       if course_title else content[:9000])
        prompt = template.format(count=count, content=llm_content)
        if exclusions:
            excl_lines = "\n".join(f"- {t[:70]}" for t in exclusions[:15])
            prompt += f"\n\nSUJETS DÉJÀ COUVERTS — génère des questions sur d'AUTRES aspects :\n{excl_lines}"
        return self._call_llm(prompt, max_tokens, temperature, question_type)

    def _generate_from_topic(self, subject: str, course_title: str, count: int,
                              question_type: str = "single",
                              exclusions: Optional[List[str]] = None) -> Optional[List[Dict]]:
        """Generate questions from subject title when no PDF content is available."""
        is_mixed = question_type == "mixed"
        template = QUIZ_PROMPT_TOPIC_MIXED if is_mixed else QUIZ_PROMPT_TOPIC_SINGLE
        max_tokens = min(count * 220 + 400, 6000) if is_mixed else min(count * 130 + 300, 3500)
        prompt = template.format(count=count, subject=subject, course=course_title or subject)
        if exclusions:
            excl_lines = "\n".join(f"- {t[:70]}" for t in exclusions[:15])
            prompt += f"\n\nSUJETS DÉJÀ COUVERTS — génère des questions sur d'AUTRES aspects de {subject} :\n{excl_lines}"
        valid = self._call_llm(prompt, max_tokens, 0.15 if is_mixed else 0.5, question_type)
        if valid:
            logger.info("Topic '%s': %d valid questions (%s)", subject, len(valid), question_type)
        return valid

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

    def _validate_questions(self, questions: List, question_type: str = "single") -> List[Dict]:
        """Filter and normalise raw question dicts. Supports single and multi-correct (mixed) formats."""
        is_mixed = question_type == "mixed"
        valid: List[Dict] = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            if "text" not in q or "options" not in q:
                continue

            has_multi = isinstance(q.get("correctAnswers"), list) and len(q.get("correctAnswers", [])) >= 2
            has_single = "correctAnswer" in q

            # MIXED requires a proper correctAnswers array — single-only questions are rejected
            if is_mixed and not has_multi:
                continue
            if not is_mixed and not has_single:
                continue

            opts = q.get("options", [])
            if not isinstance(opts, list) or len(opts) < 2:
                continue
            seen_opts: set = set()
            clean_opts: List[str] = []
            max_opts = 6 if is_mixed else 4
            _GENERIC_OPT = re.compile(
                r'toutes?\s+les\s+(options?|r[eé]ponses?|m[eé]thodes?|protocoles?|mesures?)'
                r'|aucune\s+des\s+r[eé]ponses?'
                r'|none\s+of\s+the',
                re.IGNORECASE,
            )
            for o in opts:
                o_str = str(o).strip()
                if o_str and o_str not in seen_opts and not _GENERIC_OPT.search(o_str):
                    seen_opts.add(o_str)
                    clean_opts.append(o_str)
                if len(clean_opts) == max_opts:
                    break
            if len(clean_opts) < 2:
                continue

            # Single correctAnswer (used for SINGLE or as fallback)
            ca = q.get("correctAnswer", 0)
            try:
                ca = int(ca)
            except (ValueError, TypeError):
                ca = 0
            ca = max(0, min(ca, len(clean_opts) - 1))

            entry: Dict = {
                "text": str(q["text"]).strip(),
                "options": clean_opts,
                "correctAnswer": ca,
                "explanation": str(q.get("explanation", "")).strip(),
                "points": int(q.get("points", 10)),
            }

            # Multi-correct answers for MIXED questions
            if is_mixed and has_multi:
                raw_multi = q["correctAnswers"]
                clean_multi: List[int] = []
                for v in raw_multi:
                    try:
                        idx = int(v)
                        if 0 <= idx < len(clean_opts) and idx not in clean_multi:
                            clean_multi.append(idx)
                    except (ValueError, TypeError):
                        pass
                if len(clean_multi) >= 2:
                    entry["correctAnswers"] = clean_multi
                    entry["correctAnswer"] = clean_multi[0]
                    entry["points"] = 20 if len(clean_multi) >= 3 else 15

            valid.append(entry)
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
        _level_map = {
            "BEGINNER": "Débutant", "beginner": "Débutant",
            "INTERMEDIATE": "Intermédiaire", "intermediate": "Intermédiaire",
            "ADVANCED": "Avancé", "advanced": "Avancé",
        }
        clean_level = _level_map.get(level, level)

        key = _groq_key()
        if key:
            prompt = (
                f"Tu es un expert pédagogique. Rédige une description de cours professionnelle et engageante en français.\n\n"
                f"Cours : {topic}\nNiveau : {clean_level}\n\n"
                f"Exigences :\n"
                f"- 3 à 5 phrases percutantes, texte fluide (pas de listes ou de puces)\n"
                f"- Commence par une accroche sur ce que l'apprenant va maîtriser\n"
                f"- Mentionne les compétences acquises, les prérequis adaptés au niveau et l'application pratique\n"
                f"- Ton professionnel mais accessible\n\n"
                f"Réponds UNIQUEMENT avec la description (sans titre ni préambule)."
            )
            try:
                resp = httpx.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                    json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                          "max_tokens": 280, "temperature": 0.65},
                    timeout=10,
                )
                if resp.status_code == 200:
                    content = resp.json()["choices"][0]["message"]["content"].strip()
                    if content:
                        return content
                else:
                    logger.warning("Groq summary HTTP %s", resp.status_code)
            except Exception as e:
                logger.warning("Groq summary generation failed: %s", e)

        intros = {
            "Débutant": (
                f"Découvrez les fondamentaux de {topic} à travers une approche progressive et accessible. "
                f"Ce cours vous guidera pas à pas depuis les bases essentielles jusqu'aux premiers projets pratiques, "
                f"sans prérequis nécessaire. À la fin de ce parcours, vous disposerez des outils concrets pour démarrer "
                f"votre pratique en toute confiance."
            ),
            "Intermédiaire": (
                f"Approfondissez vos connaissances en {topic} et franchissez un cap décisif dans votre maîtrise du sujet. "
                f"Ce cours suppose des bases solides et vous guide vers les concepts avancés à travers des exercices "
                f"pratiques et des études de cas réels. Vous en ressortirez capable d'aborder des projets de plus grande envergure."
            ),
            "Avancé": (
                f"Maîtrisez les aspects les plus sophistiqués de {topic} dans ce cours expert. "
                f"Conçu pour des praticiens expérimentés, il explore les subtilités techniques, les architectures complexes "
                f"et les meilleures pratiques du secteur. Vous développerez une expertise pointue directement applicable "
                f"sur des projets professionnels ambitieux."
            ),
        }
        return intros.get(clean_level, intros["Intermédiaire"])
