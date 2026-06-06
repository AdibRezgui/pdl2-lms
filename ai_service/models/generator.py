"""
AI Quiz & Content Generator.
Produces quiz questions and course summaries from topic + context.
"""

import random
from typing import List, Dict, Any


# --------------------------------------------------------------------------- #
#  Question templates per topic keyword                                        #
# --------------------------------------------------------------------------- #

TEMPLATES: Dict[str, List[Dict]] = {
    "python": [
        {
            "text": "Quelle méthode permet d'ajouter un élément à la fin d'une liste Python ?",
            "options": ["append()", "add()", "insert()", "push()"],
            "correctAnswer": 0,
            "explanation": "list.append(x) ajoute x à la fin de la liste.",
            "points": 10,
        },
        {
            "text": "Qu'est-ce qu'un décorateur en Python ?",
            "options": [
                "Une fonction qui modifie une autre fonction",
                "Un type de boucle",
                "Une classe abstraite",
                "Un module externe",
            ],
            "correctAnswer": 0,
            "explanation": "Un décorateur est une fonction d'ordre supérieur qui enveloppe une autre fonction.",
            "points": 15,
        },
        {
            "text": "Quelle est la complexité temporelle d'un accès à un dictionnaire Python ?",
            "options": ["O(1) en moyenne", "O(n)", "O(log n)", "O(n²)"],
            "correctAnswer": 0,
            "explanation": "Les dicts Python utilisent des tables de hachage, donc O(1) en moyenne.",
            "points": 20,
        },
    ],
    "machine learning": [
        {
            "text": "Qu'est-ce que le sur-apprentissage (overfitting) ?",
            "options": [
                "Le modèle mémorise les données d'entraînement mais généralise mal",
                "Le modèle est trop simple",
                "L'algorithme ne converge pas",
                "Les données sont mal étiquetées",
            ],
            "correctAnswer": 0,
            "explanation": "L'overfitting signifie que le modèle a trop appris les exemples d'entraînement.",
            "points": 15,
        },
        {
            "text": "Quelle métrique utiliser pour un problème de classification déséquilibré ?",
            "options": ["F1-Score", "Accuracy", "MSE", "R²"],
            "correctAnswer": 0,
            "explanation": "Le F1-Score équilibre précision et rappel, idéal pour les classes déséquilibrées.",
            "points": 20,
        },
    ],
    "docker": [
        {
            "text": "Quelle commande construit une image Docker à partir d'un Dockerfile ?",
            "options": ["docker build", "docker run", "docker create", "docker make"],
            "correctAnswer": 0,
            "explanation": "docker build -t nom:tag . construit l'image depuis le Dockerfile du répertoire courant.",
            "points": 10,
        },
        {
            "text": "Quelle est la différence entre une image et un conteneur Docker ?",
            "options": [
                "L'image est le modèle, le conteneur est l'instance en cours d'exécution",
                "Ce sont des synonymes",
                "Le conteneur est stocké sur le registre",
                "L'image est éphémère",
            ],
            "correctAnswer": 0,
            "explanation": "Une image est immuable ; un conteneur est une image en cours d'exécution.",
            "points": 15,
        },
    ],
    "spring": [
        {
            "text": "Que fait l'annotation @RestController dans Spring Boot ?",
            "options": [
                "Combine @Controller et @ResponseBody",
                "Configure la base de données",
                "Gère la sécurité",
                "Crée un bean de service",
            ],
            "correctAnswer": 0,
            "explanation": "@RestController = @Controller + @ResponseBody : renvoie JSON directement.",
            "points": 10,
        },
        {
            "text": "Quel est le rôle de Spring Security ?",
            "options": [
                "Gérer l'authentification et les autorisations",
                "Optimiser les requêtes SQL",
                "Compresser les réponses HTTP",
                "Configurer le serveur web",
            ],
            "correctAnswer": 0,
            "explanation": "Spring Security protège les endpoints via authentification et gestion des rôles.",
            "points": 15,
        },
    ],
    "react": [
        {
            "text": "Qu'est-ce qu'un Hook React ?",
            "options": [
                "Une fonction qui permet d'utiliser l'état dans les composants fonctionnels",
                "Un composant de classe",
                "Un middleware Redux",
                "Un fichier de configuration",
            ],
            "correctAnswer": 0,
            "explanation": "Les Hooks (useState, useEffect…) permettent d'accéder aux fonctionnalités React sans classes.",
            "points": 10,
        },
    ],
    "default": [
        {
            "text": "Qu'est-ce que le principe DRY en développement logiciel ?",
            "options": [
                "Don't Repeat Yourself — éviter la duplication de code",
                "Do Refactor Yearly",
                "Dynamic Runtime Yield",
                "Design Review Yearly",
            ],
            "correctAnswer": 0,
            "explanation": "DRY = Don't Repeat Yourself : chaque logique doit n'exister qu'à un seul endroit.",
            "points": 10,
        },
        {
            "text": "Quelle est la différence entre SQL et NoSQL ?",
            "options": [
                "SQL est relationnel avec schéma fixe, NoSQL est flexible",
                "NoSQL est plus lent",
                "SQL ne supporte pas les jointures",
                "NoSQL ne peut pas stocker de texte",
            ],
            "correctAnswer": 0,
            "explanation": "Les bases SQL (PostgreSQL, MySQL) utilisent des tables. NoSQL (MongoDB, Redis) est plus flexible.",
            "points": 15,
        },
        {
            "text": "Qu'est-ce que REST ?",
            "options": [
                "Un style architectural pour les APIs web basé sur HTTP",
                "Un langage de programmation",
                "Un protocole de sécurité",
                "Un framework JavaScript",
            ],
            "correctAnswer": 0,
            "explanation": "REST (Representational State Transfer) définit des conventions pour concevoir des APIs HTTP.",
            "points": 10,
        },
    ],
}


class QuizGenerator:

    def generate(
        self,
        topic: str,
        course_title: str = "",
        count: int = 5,
    ) -> List[Dict]:
        """Generate `count` quiz questions for `topic`."""
        topic_lower = topic.lower()

        # Find matching template bank
        bank: List[Dict] = []
        for key, questions in TEMPLATES.items():
            if key in topic_lower or topic_lower in key:
                bank.extend(questions)

        if not bank:
            bank = TEMPLATES["default"]

        # Sample without replacement (or with if bank is small)
        if len(bank) >= count:
            selected = random.sample(bank, count)
        else:
            selected = bank + random.choices(TEMPLATES["default"], k=count - len(bank))

        # Add sort order
        return [
            {**q, "sortOrder": i, "text": q["text"]}
            for i, q in enumerate(selected)
        ]

    def generate_summary(self, topic: str, level: str = "Intermédiaire") -> str:
        """Generate a short course introduction/summary."""
        intros = {
            "Débutant": f"Ce cours introduit les fondamentaux de **{topic}** sans prérequis. "
                        f"Vous apprendrez pas à pas les concepts essentiels avec des exemples concrets.",
            "Intermédiaire": f"Ce cours approfondit votre compréhension de **{topic}**. "
                             f"Il suppose une connaissance de base et vous guide vers la maîtrise des concepts avancés.",
            "Avancé": f"Ce cours expert couvre les aspects avancés de **{topic}**. "
                      f"Conçu pour les praticiens expérimentés souhaitant maîtriser les subtilités du domaine.",
        }
        return intros.get(level, intros["Intermédiaire"])
