"""
Unit tests for the EduAI FastAPI microservice.
Covers health check, input validation, and core endpoint contracts.
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health_returns_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "service" in body


# ---------------------------------------------------------------------------
# /ai/recommend
# ---------------------------------------------------------------------------

def test_recommend_empty_courses_returns_400():
    resp = client.post("/ai/recommend", json={"allCourses": [], "enrolledCourseIds": []})
    assert resp.status_code == 400
    assert "allCourses" in resp.json()["detail"]


def test_recommend_returns_recommendations():
    courses = [
        {"id": "1", "title": "Python pour débutants", "description": "Bases de Python",
         "category": "Informatique", "level": "Débutant", "published": True},
        {"id": "2", "title": "Django avancé", "description": "Web avec Django",
         "category": "Informatique", "level": "Avancé", "published": True},
    ]
    resp = client.post("/ai/recommend", json={
        "allCourses": courses,
        "enrolledCourseIds": ["1"],
        "topN": 1,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "recommendations" in body
    assert "count" in body


# ---------------------------------------------------------------------------
# /ai/generate-quiz
# ---------------------------------------------------------------------------

def test_generate_quiz_empty_topic_returns_400():
    resp = client.post("/ai/generate-quiz", json={"topic": "   ", "count": 3})
    assert resp.status_code == 400
    assert "topic" in resp.json()["detail"]


def test_generate_quiz_valid_topic_returns_questions():
    resp = client.post("/ai/generate-quiz", json={"topic": "Python", "count": 3})
    assert resp.status_code == 200
    body = resp.json()
    assert "questions" in body
    assert "topic" in body
    assert body["topic"] == "Python"


# ---------------------------------------------------------------------------
# /ai/generate-summary
# ---------------------------------------------------------------------------

def test_generate_summary_returns_summary():
    resp = client.post("/ai/generate-summary", json={"topic": "Machine Learning", "level": "Intermédiaire"})
    assert resp.status_code == 200
    body = resp.json()
    assert "summary" in body
    assert "topic" in body


# ---------------------------------------------------------------------------
# /ai/chat
# ---------------------------------------------------------------------------

def test_chat_empty_message_returns_400():
    resp = client.post("/ai/chat", json={"message": ""})
    assert resp.status_code == 400
    assert "message" in resp.json()["detail"]


def test_chat_returns_response():
    resp = client.post("/ai/chat", json={"message": "Qu'est-ce que Python ?"})
    assert resp.status_code == 200
    body = resp.json()
    assert "response" in body
    assert len(body["response"]) > 0


# ---------------------------------------------------------------------------
# /ai/analyze
# ---------------------------------------------------------------------------

def test_analyze_empty_data_returns_200():
    resp = client.post("/ai/analyze", json={"enrollments": [], "quizAttempts": []})
    assert resp.status_code == 200
