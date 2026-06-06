"""
Content-based + collaborative filtering course recommender.
Uses TF-IDF on course metadata and cosine similarity.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any


class CourseRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words=None, max_features=500)
        self._courses: List[Dict] = []
        self._matrix = None

    def fit(self, courses: List[Dict]) -> None:
        """Build TF-IDF matrix from course metadata."""
        if not courses:
            return
        self._courses = courses
        corpus = [
            f"{c.get('title', '')} {c.get('description', '')} "
            f"{c.get('category', '')} {c.get('level', '')} "
            f"{' '.join(c.get('tags', []))}"
            for c in courses
        ]
        self._matrix = self.vectorizer.fit_transform(corpus)

    def recommend(
        self,
        enrolled_ids: List[str],
        student_profile: Dict,
        top_n: int = 5,
    ) -> List[Dict]:
        """Return top_n courses not yet enrolled, ranked by relevance."""
        if self._matrix is None or not self._courses:
            return []

        enrolled_set = set(enrolled_ids)
        candidates = [
            (i, c) for i, c in enumerate(self._courses)
            if str(c.get("id", "")) not in enrolled_set and c.get("published", True)
        ]
        if not candidates:
            return []

        # Build a preference vector from enrolled courses
        enrolled_indices = [
            i for i, c in enumerate(self._courses)
            if str(c.get("id", "")) in enrolled_set
        ]

        if enrolled_indices:
            profile_vec = np.asarray(
                self._matrix[enrolled_indices].mean(axis=0)
            )
        else:
            # No history → use student level preference
            level = student_profile.get("preferredLevel", "Débutant")
            query = f"{level} {student_profile.get('interests', '')}"
            profile_vec = self.vectorizer.transform([query]).toarray()

        scores = cosine_similarity(
            profile_vec,
            self._matrix[[i for i, _ in candidates]],
        )[0]

        ranked = sorted(
            zip(scores, [c for _, c in candidates]),
            key=lambda x: x[0],
            reverse=True,
        )

        results = []
        for score, course in ranked[:top_n]:
            results.append({
                **course,
                "score": round(float(score), 4),
                "reason": _reason(score, enrolled_set, course),
            })
        return results


def _reason(score: float, enrolled_ids: set, course: Dict) -> str:
    cat = course.get("category", "ce domaine")
    if score > 0.6:
        return f"Très similaire aux cours que vous suivez en {cat}"
    if score > 0.3:
        return f"Complète bien votre parcours en {cat}"
    return f"Nouveau domaine recommandé : {cat}"
