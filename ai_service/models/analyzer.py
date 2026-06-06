"""
Student difficulty analyzer.
Detects weak areas from quiz scores and progress data.
"""

from typing import List, Dict, Any
import numpy as np


class DifficultyAnalyzer:

    def analyze(
        self,
        enrollments: List[Dict],
        quiz_attempts: List[Dict],
    ) -> Dict[str, Any]:
        """
        Returns:
          - weak_areas: list of topic/category where student struggles
          - strong_areas: mastered topics
          - overall_level: Débutant / Intermédiaire / Avancé
          - recommendations: actionable advice list
        """
        if not enrollments and not quiz_attempts:
            return self._empty()

        # Average progress per course
        avg_progress = (
            np.mean([e.get("progress", 0) for e in enrollments])
            if enrollments else 0
        )

        # Quiz performance per category
        cat_scores: Dict[str, List[float]] = {}
        for attempt in quiz_attempts:
            cat = attempt.get("category", "Général")
            score = attempt.get("score", 0)
            cat_scores.setdefault(cat, []).append(score)

        cat_avg = {cat: np.mean(scores) for cat, scores in cat_scores.items()}

        weak_areas = [cat for cat, avg in cat_avg.items() if avg < 60]
        strong_areas = [cat for cat, avg in cat_avg.items() if avg >= 75]

        # Stalled courses (enrolled but < 20% progress)
        stalled = [
            e.get("courseTitle", "un cours")
            for e in enrollments
            if e.get("progress", 0) < 20 and not e.get("completed", False)
        ]

        # Overall level
        if avg_progress >= 70 and len(strong_areas) >= 2:
            level = "Avancé"
        elif avg_progress >= 40 or len(strong_areas) >= 1:
            level = "Intermédiaire"
        else:
            level = "Débutant"

        recommendations = self._build_recommendations(
            weak_areas, strong_areas, stalled, avg_progress, cat_avg
        )

        return {
            "overallLevel": level,
            "averageProgress": round(avg_progress, 1),
            "weakAreas": weak_areas,
            "strongAreas": strong_areas,
            "stalledCourses": stalled,
            "categoryScores": {k: round(v, 1) for k, v in cat_avg.items()},
            "recommendations": recommendations,
        }

    def _build_recommendations(
        self,
        weak: List[str],
        strong: List[str],
        stalled: List[str],
        progress: float,
        cat_avg: Dict[str, float],
    ) -> List[str]:
        tips = []
        for area in weak[:2]:
            score = cat_avg.get(area, 0)
            tips.append(
                f"Retravailler {area} — score moyen {score:.0f}%. "
                f"Consultez les ressources complémentaires du cours."
            )
        for course in stalled[:1]:
            tips.append(
                f"Vous avez commencé '{course}' mais n'avez pas progressé. "
                f"Dédier 20 minutes par jour suffit pour avancer."
            )
        if progress < 30 and not tips:
            tips.append(
                "Démarrez par les modules d'introduction pour construire une base solide."
            )
        if strong:
            tips.append(
                f"Vous maîtrisez bien {strong[0]}. "
                f"Passez aux cours avancés de ce domaine."
            )
        if not tips:
            tips.append("Continuez à ce rythme, vous progressez bien !")
        return tips

    def _empty(self) -> Dict:
        return {
            "overallLevel": "Débutant",
            "averageProgress": 0,
            "weakAreas": [],
            "strongAreas": [],
            "stalledCourses": [],
            "categoryScores": {},
            "recommendations": [
                "Inscrivez-vous à votre premier cours pour commencer votre parcours."
            ],
        }
