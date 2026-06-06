"""
EduAI Pro — Python AI Microservice
Handles: chat completions, quiz generation, content recommendations, learning path AI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import json
import re

app = FastAPI(
    title="EduAI Service",
    description="AI backend for EduAI Pro LMS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[str] = None
    history: Optional[list] = []

class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []

class QuizGenerationRequest(BaseModel):
    topic: str
    level: str = "intermediate"
    num_questions: int = 5
    language: str = "fr"

class RecommendationRequest(BaseModel):
    user_id: str
    completed_courses: list[str] = []
    interests: list[str] = []

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "eduai-ai-service"}

# ── Chat endpoint ─────────────────────────────────────────────────────────────

KEYWORD_RESPONSES = {
    "python": "Python est un excellent choix ! Je vous recommande de commencer par les bases : variables, boucles, fonctions. Ensuite, explorez les bibliothèques comme NumPy et Pandas pour la data science.",
    "machine learning": "Le Machine Learning est un domaine passionnant. Commencez par comprendre les concepts fondamentaux : régression, classification, clustering. Scikit-learn est parfait pour débuter.",
    "docker": "Docker simplifie le déploiement des applications. Les concepts clés sont : images, conteneurs, volumes et réseaux. Docker Compose est idéal pour orchestrer plusieurs services.",
    "javascript": "JavaScript est incontournable pour le web. Maîtrisez d'abord les fondamentaux ES6+, puis explorez React ou Vue.js pour le frontend, et Node.js pour le backend.",
    "react": "React est une bibliothèque puissante pour créer des interfaces utilisateur. Commencez par les composants, props et state, puis explorez les hooks comme useState et useEffect.",
    "sql": "SQL est fondamental pour travailler avec les bases de données. Maîtrisez les requêtes SELECT, JOIN, et les agrégations. PostgreSQL est une excellente base de données relationnelle.",
    "default": "Je suis votre assistant pédagogique IA. Je peux vous aider avec vos cours, générer des quiz personnalisés, et vous recommander des ressources adaptées à votre niveau. Que souhaitez-vous apprendre aujourd'hui ?",
}

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    msg_lower = req.message.lower()
    reply = KEYWORD_RESPONSES["default"]

    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in msg_lower:
            reply = response
            break

    suggestions = [
        "Montrez-moi un exemple de code",
        "Quelles sont les ressources recommandées ?",
        "Créez un quiz sur ce sujet",
    ]

    return ChatResponse(reply=reply, suggestions=suggestions)

# ── Quiz generation ───────────────────────────────────────────────────────────

QUIZ_TEMPLATES = {
    "python": [
        {
            "text": "Quelle est la sortie de print(type(3.14)) en Python ?",
            "options": ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"],
            "correct": 1,
            "explanation": "3.14 est un nombre décimal, donc de type float en Python."
        },
        {
            "text": "Quelle méthode permet d'ajouter un élément à la fin d'une liste ?",
            "options": ["add()", "insert()", "append()", "push()"],
            "correct": 2,
            "explanation": "La méthode append() ajoute un élément à la fin d'une liste Python."
        },
        {
            "text": "Comment créer un dictionnaire vide en Python ?",
            "options": ["dict = []", "dict = {}", "dict = ()", "dict = set()"],
            "correct": 1,
            "explanation": "Les accolades {} créent un dictionnaire vide. [] crée une liste, () un tuple."
        },
    ],
    "default": [
        {
            "text": f"Question 1 sur le sujet {{topic}} : Quel est le concept fondamental ?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Explication détaillée du concept."
        },
        {
            "text": f"Question 2 : Comment appliquer ce concept en pratique ?",
            "options": ["Méthode 1", "Méthode 2", "Méthode 3", "Méthode 4"],
            "correct": 1,
            "explanation": "La méthode 2 est la plus adaptée dans ce contexte."
        },
    ]
}

@app.post("/generate-quiz")
async def generate_quiz(req: QuizGenerationRequest):
    topic_key = req.topic.lower()
    questions = QUIZ_TEMPLATES.get(topic_key, QUIZ_TEMPLATES["default"])

    formatted = []
    for i, q in enumerate(questions[:req.num_questions]):
        text = q["text"]
        if "{topic}" in text:
            text = text.replace("{topic}", req.topic)
        formatted.append({
            "id": f"q{i+1}",
            "text": text,
            "options": q["options"],
            "correctAnswer": q["correct"],
            "explanation": q["explanation"],
            "points": 10,
        })

    return {
        "quiz": {
            "title": f"Quiz — {req.topic}",
            "level": req.level,
            "language": req.language,
            "questions": formatted,
            "timeLimit": len(formatted) * 2,
            "passingScore": 70,
        }
    }

# ── Recommendations ───────────────────────────────────────────────────────────

@app.post("/recommendations")
async def recommendations(req: RecommendationRequest):
    recs = [
        {
            "course_id": "course_ml_intro",
            "title": "Introduction au Machine Learning",
            "reason": "Basé sur votre intérêt pour Python et la data science",
            "score": 0.95,
            "category": "IA & Machine Learning",
        },
        {
            "course_id": "course_react_adv",
            "title": "React Avancé & Next.js",
            "reason": "Complément naturel à vos compétences JavaScript",
            "score": 0.88,
            "category": "Développement Web",
        },
        {
            "course_id": "course_docker_k8s",
            "title": "Docker & Kubernetes en production",
            "reason": "Très demandé dans votre domaine",
            "score": 0.82,
            "category": "DevOps",
        },
    ]

    if req.interests:
        recs = sorted(recs, key=lambda x: x["score"], reverse=True)

    return {"recommendations": recs[:5]}

# ── Learning path generation ──────────────────────────────────────────────────

@app.get("/learning-path/{goal}")
async def learning_path(goal: str):
    paths = {
        "data-scientist": [
            {"step": 1, "title": "Python Fondamentaux", "duration": "4 semaines", "required": True},
            {"step": 2, "title": "Statistiques & Probabilités", "duration": "3 semaines", "required": True},
            {"step": 3, "title": "Machine Learning avec Scikit-learn", "duration": "6 semaines", "required": True},
            {"step": 4, "title": "Deep Learning avec PyTorch", "duration": "8 semaines", "required": False},
            {"step": 5, "title": "MLOps & Déploiement", "duration": "4 semaines", "required": False},
        ],
        "web-developer": [
            {"step": 1, "title": "HTML/CSS Fondamentaux", "duration": "2 semaines", "required": True},
            {"step": 2, "title": "JavaScript Moderne (ES6+)", "duration": "4 semaines", "required": True},
            {"step": 3, "title": "React & Next.js", "duration": "6 semaines", "required": True},
            {"step": 4, "title": "Node.js & API REST", "duration": "4 semaines", "required": True},
            {"step": 5, "title": "Docker & CI/CD", "duration": "3 semaines", "required": False},
        ],
    }

    path = paths.get(goal, paths["web-developer"])
    return {"goal": goal, "path": path, "total_duration": "~6 mois"}
