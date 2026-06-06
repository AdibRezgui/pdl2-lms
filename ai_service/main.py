"""
EduAI — Python AI Microservice
FastAPI app exposing AI endpoints for the LMS platform.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from models.recommender import CourseRecommender
from models.analyzer import DifficultyAnalyzer
from models.generator import QuizGenerator
from models.chatbot import PedagogicalChatbot

# --------------------------------------------------------------------------- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eduai")

app = FastAPI(
    title="EduAI — Service IA",
    description="Microservice Python pour recommandations, analyse et génération de contenu IA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singletons
recommender = CourseRecommender()
analyzer = DifficultyAnalyzer()
generator = QuizGenerator()
chatbot = PedagogicalChatbot()

# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #

class Course(BaseModel):
    id: str
    title: str
    description: str = ""
    category: str = ""
    level: str = ""
    tags: List[str] = []
    published: bool = True
    rating: float = 0.0
    studentsCount: int = 0

class RecommendRequest(BaseModel):
    enrolledCourseIds: List[str] = []
    allCourses: List[Course] = []
    studentProfile: Dict[str, Any] = {}
    topN: int = 5

class Enrollment(BaseModel):
    courseId: str
    courseTitle: str = ""
    progress: int = 0
    completed: bool = False
    category: str = ""

class QuizAttempt(BaseModel):
    quizId: str = ""
    category: str = ""
    score: float = 0
    passed: bool = False

class AnalyzeRequest(BaseModel):
    enrollments: List[Enrollment] = []
    quizAttempts: List[QuizAttempt] = []

class GenerateQuizRequest(BaseModel):
    topic: str
    courseTitle: str = ""
    count: int = 5

class GenerateSummaryRequest(BaseModel):
    topic: str
    level: str = "Intermédiaire"

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    userContext: Dict[str, Any] = {}

# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@app.get("/health")
def health():
    return {"status": "ok", "service": "EduAI Python AI Service"}


@app.post("/ai/recommend")
def recommend_courses(req: RecommendRequest):
    """Recommend courses for a student based on their enrollment history."""
    if not req.allCourses:
        raise HTTPException(status_code=400, detail="allCourses is required")

    courses_dicts = [c.model_dump() for c in req.allCourses]
    recommender.fit(courses_dicts)

    results = recommender.recommend(
        enrolled_ids=req.enrolledCourseIds,
        student_profile=req.studentProfile,
        top_n=req.topN,
    )
    return {"recommendations": results, "count": len(results)}


@app.post("/ai/analyze")
def analyze_student(req: AnalyzeRequest):
    """Analyze a student's performance and identify difficulty areas."""
    enrollments = [e.model_dump() for e in req.enrollments]
    attempts = [a.model_dump() for a in req.quizAttempts]
    result = analyzer.analyze(enrollments, attempts)
    return result


@app.post("/ai/generate-quiz")
def generate_quiz(req: GenerateQuizRequest):
    """Generate quiz questions for a given topic."""
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="topic is required")
    questions = generator.generate(
        topic=req.topic,
        course_title=req.courseTitle,
        count=min(req.count, 10),
    )
    return {"questions": questions, "topic": req.topic, "count": len(questions)}


@app.post("/ai/generate-summary")
def generate_summary(req: GenerateSummaryRequest):
    """Generate a course introduction/description for a topic."""
    summary = generator.generate_summary(req.topic, req.level)
    return {"summary": summary, "topic": req.topic, "level": req.level}


@app.post("/ai/chat")
def chat(req: ChatRequest):
    """Enhanced pedagogical chatbot endpoint."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    response = chatbot.respond(
        message=req.message,
        history=req.history,
        user_context=req.userContext,
    )
    return {"response": response, "model": "EduBot-v1"}
