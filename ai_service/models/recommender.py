"""
Content-based course recommender.
Uses TF-IDF cosine similarity on course metadata.
Falls back to popularity ranking when TF-IDF produces low-confidence results.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any


class CourseRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words=None, max_features=1000, ngram_range=(1, 2))
        self._courses: List[Dict] = []
        self._matrix = None

    def fit(self, courses: List[Dict]) -> None:
        if not courses:
            return
        self._courses = courses
        corpus = [
            " ".join(filter(None, [
                c.get("title", ""),
                c.get("title", ""),  # double weight on title
                c.get("description", ""),
                c.get("category", ""),
                c.get("category", ""),  # double weight on category
                c.get("level", ""),
                " ".join(c.get("tags", []) or []),
            ]))
            for c in courses
        ]
        try:
            self._matrix = self.vectorizer.fit_transform(corpus)
        except Exception:
            self._matrix = None

    def recommend(
        self,
        enrolled_ids: List[str],
        student_profile: Dict,
        top_n: int = 5,
    ) -> List[Dict]:
        if not self._courses:
            return []

        enrolled_set = set(str(eid) for eid in enrolled_ids)
        candidates = [
            (i, c) for i, c in enumerate(self._courses)
            if str(c.get("id", "")) not in enrolled_set
        ]
        if not candidates:
            return []

        # ── Cold-start: no enrollment history or TF-IDF unavailable ──────────
        if self._matrix is None:
            return self._popularity_fallback(candidates, top_n)

        enrolled_indices = [
            i for i, c in enumerate(self._courses)
            if str(c.get("id", "")) in enrolled_set
        ]

        # No enrollments → popularity-based cold start
        if not enrolled_indices:
            return self._popularity_fallback(candidates, top_n)

        # ── Content-based filtering ───────────────────────────────────────────
        try:
            profile_vec = np.asarray(
                self._matrix[enrolled_indices].mean(axis=0)
            )
            candidate_matrix = self._matrix[[i for i, _ in candidates]]
            scores = cosine_similarity(profile_vec, candidate_matrix)[0]

            max_score = float(np.max(scores)) if len(scores) > 0 else 0.0

            # Low confidence → blend with popularity
            if max_score < 0.05:
                return self._popularity_fallback(candidates, top_n, reason_prefix="Populaire")

            ranked = sorted(
                zip(scores.tolist(), [c for _, c in candidates]),
                key=lambda x: x[0],
                reverse=True,
            )

            results = []
            for score, course in ranked[:top_n]:
                results.append({
                    **course,
                    "score": round(float(score), 4),
                    "reason": _reason(float(score), enrolled_set, course),
                })
            return results

        except Exception:
            return self._popularity_fallback(candidates, top_n)

    def _popularity_fallback(
        self,
        candidates: List[tuple],
        top_n: int,
        reason_prefix: str = "Recommandé",
    ) -> List[Dict]:
        """Sort by rating × studentsCount when TF-IDF can't help."""
        sorted_courses = sorted(
            [c for _, c in candidates],
            key=lambda c: (
                float(c.get("rating", 0)) * 2
                + min(int(c.get("studentsCount", 0)) / 50, 3)
            ),
            reverse=True,
        )
        return [
            {
                **c,
                "score": round(0.8 - i * 0.05, 4),
                "reason": f"{reason_prefix} · {c.get('category', 'Formation')}",
            }
            for i, c in enumerate(sorted_courses[:top_n])
        ]


def _reason(score: float, enrolled_ids: set, course: Dict) -> str:
    cat = course.get("category", "ce domaine")
    if score > 0.5:
        return f"Très similaire à vos cours en {cat}"
    if score > 0.2:
        return f"Complète votre parcours en {cat}"
    if score > 0.05:
        return f"Suggéré d'après votre profil — {cat}"
    return f"Nouveau domaine à explorer : {cat}"
