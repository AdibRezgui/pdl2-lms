"""
EduBot — Pedagogical chatbot.
Rule-based for structured queries (progress, quiz, catalogue).
Groq LLM (llama-3.3-70b) for free-form / course-specific questions.
"""

import os
import re
import json
import logging
import httpx
from typing import List, Dict, Optional, Any

logger = logging.getLogger("eduai.chatbot")

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _groq_key() -> str:
    return os.getenv("GROQ_API_KEY", "")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _words(text: str) -> List[str]:
    return [w for w in re.findall(r"[a-záàâäéèêëîïôöùûüç]+", text.lower()) if len(w) >= 3]


def _has(text: str, kw_set) -> bool:
    return bool(set(_words(text)) & kw_set)


def _score(query_words: List[str], course: Dict) -> int:
    fields = " ".join([
        course.get("title", ""),
        course.get("courseTitle", ""),
        course.get("category", ""),
        course.get("description", ""),
        " ".join(course.get("tags", []) or []),
    ])
    course_words = set(_words(fields))
    return sum(1 for w in query_words if w in course_words)


def _fmt_bar(pct: int) -> str:
    filled = round(pct / 10)
    return "█" * filled + "░" * (10 - filled) + f" {pct}%"


def _course_line(c: Dict, enrolled=False, progress=0, completed=False) -> str:
    title   = c.get("title") or c.get("courseTitle", "")
    level   = c.get("level", "")
    trainer = c.get("trainerName", "")
    meta    = []
    if level:   meta.append(level)
    if trainer: meta.append(f"par {trainer}")
    meta_str = f" *({', '.join(meta)})*" if meta else ""

    if not enrolled:
        return f"- **{title}**{meta_str}"
    if completed:
        return f"- **{title}**{meta_str} — ✅ Terminé"
    return f"- **{title}**{meta_str} — {_fmt_bar(progress)}"


# ── Intent keywords ───────────────────────────────────────────────────────────

_GREETING_RE = re.compile(r"\b(bonjour|salut|hello|bonsoir|hey|coucou|salam)\b")

_PROGRESS_KW = {"progression", "avancement", "progrès", "statut", "niveau",
                "bilan", "résumé", "recap", "overview"}

_QUIZ_KW = {"quiz", "évaluation", "examen", "test", "score", "note", "résultat",
            "question", "tentative", "tentatives"}

_RECO_KW = {"recommande", "recommandation", "conseil", "suggestion", "suite",
            "continuer", "parcours", "commencer", "débuter", "apprendre", "proposer"}

_CERT_KW = {"certificat", "certification", "diplôme", "badge", "attestation"}

_HELP_KW = {"aide", "help", "fonctionnalité", "capable", "comment"}

_ALL_KW  = {"tous", "toutes", "liste", "catalogue", "disponible", "cours"}


# ── Structured response builders ─────────────────────────────────────────────

def _resp_greeting(ctx: Dict) -> str:
    name      = (ctx.get("name") or "").split()[0] if ctx.get("name") else ""
    total     = ctx.get("totalCourses", 0)
    completed = ctx.get("completedCourses", 0)
    available = len(ctx.get("availableCourses", []))
    g = f", {name}" if name else ""

    if total > 0:
        in_progress = total - completed
        status = (f"**{in_progress}** cours en cours, **{completed}** terminé(s)."
                  if in_progress else f"**{completed}** cours terminé(s). Bravo !")
        catalog = f" **{available}** cours disponibles dans le catalogue." if available else ""
        return (f"Bonjour{g} ! Je suis **EduBot**, votre assistant pédagogique.\n\n"
                f"📊 {status}{catalog}\n\n"
                "Je peux vous aider à :\n"
                "- Suivre votre **progression** par cours\n"
                "- Consulter vos **résultats aux quiz**\n"
                "- Trouver un cours dans le **catalogue**\n"
                "- Obtenir des **recommandations** personnalisées\n\n"
                "Quelle est votre question ?")
    return (f"Bonjour{g} ! Je suis **EduBot**, votre assistant pédagogique.\n\n"
            f"{'**' + str(available) + '** cours disponibles dans le catalogue. ' if available else ''}"
            "Posez-moi vos questions sur les cours, votre progression ou vos évaluations !")


def _resp_progress(ctx: Dict) -> str:
    name         = (ctx.get("name") or "").split()[0] if ctx.get("name") else ""
    enrollments  = ctx.get("enrollments", [])
    total        = ctx.get("totalCourses", 0)
    completed_c  = ctx.get("completedCourses", 0)
    avg_score    = ctx.get("averageQuizScore", 0)
    attempts     = ctx.get("totalQuizAttempts", 0)
    passed       = ctx.get("passedQuizzes", 0)

    if total == 0:
        available = ctx.get("availableCourses", [])
        intro = f"Bonjour {name} ! " if name else ""
        if available:
            lines = [f"{intro}Vous n'êtes inscrit à aucun cours pour l'instant.\n",
                     "**Cours disponibles dans le catalogue :**"]
            for c in available[:5]:
                lines.append(_course_line(c))
            if len(available) > 5:
                lines.append(f"*…et {len(available) - 5} autre(s).*")
            return "\n".join(lines)
        return f"{intro}Vous n'êtes inscrit à aucun cours. Explorez le catalogue pour commencer !"

    n = f", {name}" if name else ""
    lines = [f"**Votre progression{n}**\n",
             f"📚 Cours : **{total}** inscrits | **{completed_c}** terminés"]
    if attempts > 0:
        lines.append(f"📝 Quiz : **{passed}/{attempts}** réussis | Score moyen : **{avg_score}%**")
    lines.append("")
    for e in enrollments:
        lines.append(_course_line(e, enrolled=True,
                                  progress=e.get("progress", 0),
                                  completed=e.get("completed", False)))

    in_progress = [e for e in enrollments if not e.get("completed") and e.get("progress", 0) > 0]
    not_started = [e for e in enrollments if e.get("progress", 0) == 0 and not e.get("completed")]
    if in_progress:
        best = max(in_progress, key=lambda e: e.get("progress", 0))
        lines.append(f"\n💡 Continuez **{best.get('courseTitle')}** — vous êtes à {best.get('progress')}% !")
    elif not_started:
        lines.append(f"\n💡 Vous n'avez pas encore commencé **{not_started[0].get('courseTitle')}**. Lancez-vous !")
    if attempts > 0 and avg_score < 60:
        lines.append("⚠️ Score moyen aux quiz < 60% — revoyez les modules avant de repasser.")
    return "\n".join(lines)


def _resp_quiz(ctx: Dict) -> str:
    name       = (ctx.get("name") or "").split()[0] if ctx.get("name") else ""
    avg_score  = ctx.get("averageQuizScore", 0)
    attempts   = ctx.get("totalQuizAttempts", 0)
    passed     = ctx.get("passedQuizzes", 0)
    details    = ctx.get("quizAttempts", [])
    n = f", {name}" if name else ""

    if attempts == 0:
        return (f"Vous n'avez pas encore tenté de quiz{n}.\n\n"
                "**Conseils :**\n"
                "- Terminez au moins 50% du contenu d'un module avant l'évaluation\n"
                "- Le score minimum de validation est **70%**\n"
                "- Vous pouvez repasser les quiz autant de fois que nécessaire")

    lines = [f"**Vos résultats aux évaluations{n}**\n",
             f"- Tentatives : **{attempts}** | Réussies : **{passed}** | Score moyen : **{avg_score}%**\n"]

    if details:
        lines.append("**Détail par quiz :**")
        for q in details[-8:]:
            icon = "✅" if q.get("passed") else "❌"
            lines.append(f"- {icon} **{q.get('quizTitle', 'Quiz')}** "
                         f"({q.get('courseTitle', '')}) — {q.get('score', 0)}%")
        lines.append("")

    if avg_score >= 80:
        lines.append("🏆 Excellent niveau ! Pensez aux **certificats** en complétant vos cours.")
    elif avg_score >= 60:
        lines.append("👍 Bon niveau. Visez 80% pour consolider vos connaissances.")
    else:
        lines.append("📖 Score perfectible — repassez les leçons vidéo avant chaque quiz.")
    return "\n".join(lines)


def _resp_recommendation(ctx: Dict) -> str:
    name        = (ctx.get("name") or "").split()[0] if ctx.get("name") else ""
    enrollments = ctx.get("enrollments", [])
    available   = ctx.get("availableCourses", [])
    n = f", {name}" if name else ""

    if not available and not enrollments:
        return f"Aucun cours n'est encore disponible sur la plateforme{n}.\nRevenez bientôt !"

    lines = [f"**Recommandations personnalisées{n}**\n"]
    in_progress = [e for e in enrollments if not e.get("completed") and e.get("progress", 0) > 0]
    if in_progress:
        lines.append("**Continuez là où vous en êtes :**")
        for e in sorted(in_progress, key=lambda x: -x.get("progress", 0))[:3]:
            lines.append(_course_line(e, enrolled=True, progress=e.get("progress", 0)))
        lines.append("")
    if available:
        top = sorted(available, key=lambda c: (-c.get("rating", 0), -c.get("studentsCount", 0)))
        lines.append("**Cours disponibles à découvrir :**")
        for c in top[:5]:
            lines.append(_course_line(c))
        if len(available) > 5:
            lines.append(f"*…et {len(available) - 5} autre(s) dans le catalogue.*")
    return "\n".join(lines)


def _resp_catalogue(ctx: Dict) -> str:
    available   = ctx.get("availableCourses", [])
    enrollments = ctx.get("enrollments", [])
    all_courses = list(enrollments) + available

    if not all_courses:
        return "Aucun cours n'est encore publié sur la plateforme.\nRevenez bientôt !"

    lines = [f"**Catalogue de la plateforme** ({len(all_courses)} cours)\n"]
    by_cat: Dict[str, List] = {}
    for e in enrollments:
        cat = e.get("category") or "Autres"
        by_cat.setdefault(cat, []).append(("enrolled", e))
    for c in available:
        cat = c.get("category") or "Autres"
        by_cat.setdefault(cat, []).append(("available", c))

    for cat, items in sorted(by_cat.items()):
        lines.append(f"\n**{cat}**")
        for kind, c in items[:6]:
            if kind == "enrolled":
                lines.append(_course_line(c, enrolled=True,
                                          progress=c.get("progress", 0),
                                          completed=c.get("completed", False)))
            else:
                lines.append(_course_line(c))
        if len(items) > 6:
            lines.append(f"  *…et {len(items) - 6} autre(s)*")
    return "\n".join(lines)


def _resp_cert(ctx: Dict) -> str:
    enrollments = ctx.get("enrollments", [])
    completed   = [e for e in enrollments if e.get("completed")]
    lines = ["**Certificats EduAI**\n"]
    if completed:
        lines.append(f"Vous avez **{len(completed)}** cours terminé(s) :")
        for e in completed:
            lines.append(f"- ✅ {e.get('courseTitle')}")
        lines.append("\nVos certificats sont disponibles dans **Mes Certificats**.")
    else:
        lines.append("Pour obtenir un certificat :\n"
                     "1. Compléter **100%** du contenu du cours\n"
                     "2. Valider toutes les évaluations avec un score ≥ **70%**\n\n"
                     "Consultez votre progression pour savoir où vous en êtes !")
    return "\n".join(lines)


def _resp_help(ctx: Dict) -> str:
    available = len(ctx.get("availableCourses", []))
    enrolled  = ctx.get("totalCourses", 0)
    return (
        "**Ce que je sais faire**\n\n"
        "Je suis **EduBot**, votre assistant pédagogique. Je m'appuie sur les cours "
        f"réels de la plateforme.\n\n"
        f"📚 **{enrolled}** cours dans votre parcours | **{available}** disponibles\n\n"
        "**Exemples de questions :**\n"
        "- *\"Montre-moi ma progression\"*\n"
        "- *\"Comment vont mes quiz ?\"*\n"
        "- *\"Quels cours sont disponibles ?\"*\n"
        "- *\"Que me recommandes-tu ?\"*\n"
        "- *\"Explique-moi [concept du cours]\"*\n"
        "- *\"Mes certificats\"*"
    )


def _resp_search(query_words: List[str], ctx: Dict) -> Optional[str]:
    enrollments = ctx.get("enrollments", [])
    available   = ctx.get("availableCourses", [])
    enrolled_matches  = [(s, e) for e in enrollments if (s := _score(query_words, {
        "title": e.get("courseTitle", ""), "category": e.get("category", ""),
        "description": e.get("description", ""), "tags": e.get("tags", []),
    })) > 0]
    available_matches = [(s, c) for c in available if (s := _score(query_words, c)) > 0]

    if not enrolled_matches and not available_matches:
        return None

    lines = ["**Cours correspondant à votre recherche :**\n"]
    if enrolled_matches:
        lines.append("*Dans votre parcours :*")
        for _, e in sorted(enrolled_matches, key=lambda x: -x[0])[:4]:
            lines.append(_course_line(
                {"title": e.get("courseTitle"), "level": e.get("level"), "trainerName": e.get("trainerName", "")},
                enrolled=True, progress=e.get("progress", 0), completed=e.get("completed", False)))
        lines.append("")
    if available_matches:
        lines.append("*Disponibles dans le catalogue :*")
        for _, c in sorted(available_matches, key=lambda x: -x[0])[:4]:
            lines.append(_course_line(c))
    return "\n".join(lines)


# ── Groq LLM fallback ─────────────────────────────────────────────────────────

def _build_system_prompt(ctx: Dict) -> str:
    name        = ctx.get("name", "Stagiaire")
    enrollments = ctx.get("enrollments", [])
    available   = ctx.get("availableCourses", [])
    avg_score   = ctx.get("averageQuizScore", 0)
    attempts    = ctx.get("totalQuizAttempts", 0)
    passed      = ctx.get("passedQuizzes", 0)
    quiz_detail = ctx.get("quizAttempts", [])

    courses_info = "\n".join([
        f"- {e.get('courseTitle')} [{e.get('category', '')}] "
        f"Progression: {e.get('progress', 0)}%"
        f"{' — Terminé ✅' if e.get('completed') else ''}"
        f"\n  Description: {e.get('description', '')[:100]}"
        for e in enrollments
    ]) or "Aucun cours inscrit"

    quiz_info = "\n".join([
        f"- {'✅' if q.get('passed') else '❌'} {q.get('quizTitle', 'Quiz')} "
        f"({q.get('courseTitle', '')}) — {q.get('score', 0)}%"
        for q in quiz_detail[-6:]
    ]) or "Aucune tentative"

    available_info = "\n".join([
        f"- {c.get('title')} [{c.get('category', '')}]"
        for c in available[:8]
    ]) or "Aucun cours disponible"

    return f"""Tu es EduBot, l'assistant pédagogique de la plateforme EduAI — une plateforme de formation e-learning.

PROFIL DU STAGIAIRE:
- Nom: {name}
- Cours inscrits: {len(enrollments)} | Terminés: {ctx.get('completedCourses', 0)}
- Quiz: {attempts} tentatives, {passed} réussies, score moyen: {avg_score}%

COURS DU STAGIAIRE:
{courses_info}

DERNIERS QUIZ:
{quiz_info}

COURS DISPONIBLES DANS LE CATALOGUE:
{available_info}

INSTRUCTIONS:
- Réponds UNIQUEMENT en français, de façon concise et bienveillante
- Utilise le markdown pour structurer tes réponses (gras, listes, emojis)
- Base-toi sur les données réelles du stagiaire ci-dessus
- Si tu expliques un concept technique lié à un de ses cours, fais-le clairement
- Le score minimum pour valider un quiz est 70%
- Ne mentionne PAS d'autres plateformes (Udemy, Coursera, etc.)
- Encourage le stagiaire et sois positif"""


def _call_groq(message: str, history: List[Dict], ctx: Dict) -> Optional[str]:
    key = _groq_key()
    if not key:
        return None

    system = _build_system_prompt(ctx)
    messages = [{"role": "system", "content": system}]

    for h in history[-8:]:
        role = h.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": h.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        resp = httpx.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": messages, "max_tokens": 600, "temperature": 0.65},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning("Groq call failed: %s", e)
        return None


# ── Main chatbot class ────────────────────────────────────────────────────────

class PedagogicalChatbot:

    def respond(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        user_context: Optional[Dict] = None,
    ) -> str:
        ctx     = user_context or {}
        history = history or []
        low     = message.strip().lower()

        # 1. Greeting
        if _GREETING_RE.search(low):
            return _resp_greeting(ctx)

        # 2. Help
        if _has(low, _HELP_KW):
            return _resp_help(ctx)

        # 3. Progress overview
        if _has(low, _PROGRESS_KW):
            return _resp_progress(ctx)

        # 4. Quiz / evaluations
        if _has(low, _QUIZ_KW):
            return _resp_quiz(ctx)

        # 5. Certificates
        if _has(low, _CERT_KW):
            return _resp_cert(ctx)

        # 6. Full catalogue
        if _has(low, _ALL_KW):
            return _resp_catalogue(ctx)

        # 7. Recommendation
        if _has(low, _RECO_KW):
            return _resp_recommendation(ctx)

        # 8. Dynamic course search
        qw = _words(low)
        if qw:
            match = _resp_search(qw, ctx)
            if match:
                return match

        # 9. Groq LLM for free-form / course-specific questions
        llm_reply = _call_groq(message, history, ctx)
        if llm_reply:
            return llm_reply

        # 10. Final fallback
        name = (ctx.get("name") or "").split()[0] if ctx.get("name") else ""
        in_progress = [e for e in ctx.get("enrollments", [])
                       if not e.get("completed") and e.get("progress", 0) > 0]
        if in_progress:
            return (f"Je n'ai pas trouvé de réponse précise{', ' + name if name else ''}.\n\n"
                    f"En attendant, vous avez **{in_progress[0].get('courseTitle')}** en cours — continuez !\n\n"
                    "Tapez **\"aide\"** pour voir ce que je sais faire.")

        return ("Je n'ai pas trouvé de cours correspondant.\n\n"
                "Essayez :\n- *\"liste des cours\"* pour le catalogue\n"
                "- *\"recommandation\"* pour une suggestion personnalisée\n"
                "- *\"aide\"* pour mes fonctionnalités")
