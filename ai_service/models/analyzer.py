"""
Student difficulty analyzer.
- Statistical computation: category scores, weak/strong areas, level (fast + deterministic)
- Groq LLM: personalized recommendations generated from real student data
"""

import os
import json
import logging
import numpy as np
import httpx
from typing import List, Dict, Any

logger = logging.getLogger("eduai.analyzer")

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


class DifficultyAnalyzer:

    def analyze(
        self,
        enrollments: List[Dict],
        quiz_attempts: List[Dict],
    ) -> Dict[str, Any]:
        if not enrollments and not quiz_attempts:
            return self._empty()

        # ── Statistical base (fast, deterministic) ──────────────────────────
        avg_progress = (
            float(np.mean([e.get("progress", 0) for e in enrollments]))
            if enrollments else 0.0
        )

        cat_scores: Dict[str, List[float]] = {}
        for attempt in quiz_attempts:
            cat = attempt.get("category") or "Général"
            cat_scores.setdefault(cat, []).append(float(attempt.get("score", 0)))

        cat_avg = {cat: float(np.mean(scores)) for cat, scores in cat_scores.items()}

        weak_areas   = [cat for cat, avg in cat_avg.items() if avg < 60]
        strong_areas = [cat for cat, avg in cat_avg.items() if avg >= 75]
        stalled = [
            e.get("courseTitle", "un cours")
            for e in enrollments
            if e.get("progress", 0) < 20 and not e.get("completed", False)
        ]

        if avg_progress >= 70 and len(strong_areas) >= 2:
            level = "Avancé"
        elif avg_progress >= 40 or len(strong_areas) >= 1:
            level = "Intermédiaire"
        else:
            level = "Débutant"

        # ── LLM-generated recommendations ──────────────────────────────────
        recommendations = self._llm_recommendations(
            enrollments, quiz_attempts, cat_avg,
            weak_areas, strong_areas, stalled, avg_progress, level,
        )

        return {
            "overallLevel":    level,
            "averageProgress": round(avg_progress, 1),
            "weakAreas":       weak_areas,
            "strongAreas":     strong_areas,
            "stalledCourses":  stalled,
            "categoryScores":  {k: round(v, 1) for k, v in cat_avg.items()},
            "recommendations": recommendations,
        }

    # ── LLM layer ───────────────────────────────────────────────────────────

    def _llm_recommendations(
        self,
        enrollments: List[Dict],
        quiz_attempts: List[Dict],
        cat_avg: Dict[str, float],
        weak_areas: List[str],
        strong_areas: List[str],
        stalled: List[str],
        avg_progress: float,
        level: str,
    ) -> List[str]:
        key = os.getenv("GROQ_API_KEY", "")
        if not key:
            return self._fallback_recs(weak_areas, strong_areas, stalled, avg_progress, cat_avg)

        # Build compact context for the LLM
        courses_txt = "\n".join(
            f"- {e.get('courseTitle', '?')} [{e.get('category', '?')}] "
            f"{e.get('progress', 0)}%{' ✓' if e.get('completed') else ''}"
            for e in enrollments
        ) or "Aucun cours"

        scores_txt = "\n".join(
            f"- {cat}: {round(avg, 1)}% "
            f"({'faible' if avg < 60 else 'maîtrisé' if avg >= 75 else 'moyen'})"
            for cat, avg in cat_avg.items()
        ) or "Pas de données"

        recent_quiz_txt = "\n".join(
            f"- {a.get('category', '?')}: {a.get('score', 0)}% "
            f"({'✓' if a.get('passed') else '✗'})"
            for a in quiz_attempts[-8:]
        ) or "Aucune tentative"

        prompt = f"""Tu es un conseiller pédagogique expert sur une plateforme e-learning.
Analyse le profil ci-dessous et génère 3 conseils personnalisés, concrets et actionnables en français.

PROFIL:
- Niveau: {level}
- Progression moyenne: {round(avg_progress, 1)}%
- Domaines faibles (<60%): {', '.join(weak_areas) or 'aucun'}
- Domaines maîtrisés (≥75%): {', '.join(strong_areas) or 'aucun'}
- Cours bloqués (<20%): {', '.join(stalled) or 'aucun'}

COURS INSCRITS:
{courses_txt}

SCORES PAR CATÉGORIE:
{scores_txt}

QUIZ RÉCENTS:
{recent_quiz_txt}

Réponds UNIQUEMENT avec ce JSON valide (sans markdown):
{{"recommendations": ["conseil1", "conseil2", "conseil3"]}}

Règles:
- Chaque conseil: 1-2 phrases, commence par un verbe d'action
- Basé sur les VRAIES données ci-dessus, pas générique
- Langue: français uniquement"""

        try:
            resp = httpx.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 350,
                    "temperature": 0.45,
                },
                timeout=9,
            )
            if resp.status_code == 429:
                logger.warning("Groq analyzer 429 — using fallback")
                return self._fallback_recs(weak_areas, strong_areas, stalled, avg_progress, cat_avg)
            resp.raise_for_status()

            content = resp.json()["choices"][0]["message"]["content"].strip()

            # Strip markdown code fences if present
            if "```" in content:
                parts = content.split("```")
                content = parts[1] if len(parts) > 1 else parts[0]
                if content.startswith("json"):
                    content = content[4:]

            data = json.loads(content.strip())
            recs = data.get("recommendations", [])
            if isinstance(recs, list) and recs:
                return [str(r) for r in recs[:4]]

        except json.JSONDecodeError as e:
            logger.warning("Groq analyzer JSON parse error: %s", e)
        except Exception as e:
            logger.warning("Groq analyzer error: %s", e)

        return self._fallback_recs(weak_areas, strong_areas, stalled, avg_progress, cat_avg)

    # ── Fallback (Groq unavailable) ──────────────────────────────────────────

    def _fallback_recs(
        self,
        weak: List[str],
        strong: List[str],
        stalled: List[str],
        progress: float,
        cat_avg: Dict[str, float],
    ) -> List[str]:
        tips: List[str] = []
        for area in weak[:2]:
            score = cat_avg.get(area, 0)
            tips.append(
                f"Retravailler {area} — score moyen {score:.0f}%. "
                "Repassez les leçons clés avant de retenter le quiz."
            )
        for course in stalled[:1]:
            tips.append(
                f"Reprendre '{course}' sans attendre — "
                "20 minutes par jour suffisent pour progresser régulièrement."
            )
        if progress < 30 and not tips:
            tips.append("Commencer par les modules d'introduction pour poser des bases solides.")
        if strong:
            tips.append(
                f"Capitaliser sur {strong[0]} que vous maîtrisez bien — "
                "explorez les cours avancés de ce domaine."
            )
        if not tips:
            tips.append("Maintenir ce rythme — votre progression est constante et régulière.")
        return tips

    def _empty(self) -> Dict:
        return {
            "overallLevel":    "Débutant",
            "averageProgress": 0,
            "weakAreas":       [],
            "strongAreas":     [],
            "stalledCourses":  [],
            "categoryScores":  {},
            "recommendations": [
                "Inscrivez-vous à votre premier cours pour démarrer votre parcours d'apprentissage."
            ],
        }
