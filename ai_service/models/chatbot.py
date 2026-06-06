"""
Pedagogical chatbot — fully dynamic, based on real platform courses.
No hardcoded course topics. All responses are derived from actual
courses created by trainers (received in user_context).
"""

import re
import random
from typing import List, Dict, Optional


def _words(text: str) -> List[str]:
    """Tokenize and lowercase a string into significant words (3+ chars)."""
    return [w for w in re.findall(r"[a-záàâäéèêëîïôöùûüç]+", text.lower()) if len(w) >= 3]


def _score(query_words: List[str], course: Dict) -> int:
    """Score how well a course matches a query by counting word overlaps."""
    fields = " ".join([
        course.get("title", ""),
        course.get("category", ""),
        course.get("description", ""),
        " ".join(course.get("tags", [])),
    ])
    course_words = set(_words(fields))
    return sum(1 for w in query_words if w in course_words)


def _fmt_bar(pct: int) -> str:
    filled = round(pct / 10)
    return "█" * filled + "░" * (10 - filled) + f" {pct}%"


def _course_line(c: Dict, enrolled: bool = False, progress: int = 0, completed: bool = False) -> str:
    level = c.get("level", "")
    trainer = c.get("trainerName", "")
    meta = []
    if level:
        meta.append(level)
    if trainer:
        meta.append(f"par {trainer}")
    meta_str = f" *({', '.join(meta)})*" if meta else ""

    title = c.get("title") or c.get("courseTitle", "")
    if not enrolled:
        return f"- **{title}**{meta_str}"
    if completed:
        return f"- **{title}**{meta_str} — ✅ Terminé"
    return f"- **{title}**{meta_str} — {_fmt_bar(progress)}"


# ── Intent detectors ────────────────────────────────────────────────────────

_GREETING_RE = re.compile(r"\b(bonjour|salut|hello|bonsoir|hey|coucou)\b")

_PROGRESS_KW = {"progression", "avancement", "progrès", "statut", "niveau",
                "comment je", "où en suis", "mes cours", "mon bilan", "bilan"}

_QUIZ_KW = {"quiz", "évaluation", "examen", "test", "score", "note", "résultat",
            "évaluer", "passer", "question"}

_RECO_KW = {"recommande", "recommandation", "conseil", "suggestion", "que faire",
            "suite", "continuer", "quoi apprendre", "parcours", "formation",
            "commencer", "débuter", "apprendre", "proposer"}

_CERT_KW = {"certificat", "certification", "diplôme", "badge", "attestation"}

_HELP_KW = {"aide", "help", "fonctionnalité", "que peux", "que sais", "capable",
            "comment tu", "tu fais quoi"}

_ALL_KW = {"tous", "toutes", "liste", "catalogue", "disponible", "offre", "cours"}


def _has(text: str, kw_set) -> bool:
    tokens = set(_words(text))
    return bool(tokens & kw_set)


# ── Response builders ───────────────────────────────────────────────────────

def _resp_greeting(ctx: Dict) -> str:
    name = (ctx.get("name") or "").split()[0]
    total = ctx.get("totalCourses", 0)
    completed = ctx.get("completedCourses", 0)
    available = len(ctx.get("availableCourses", []))
    g = f", {name}" if name else ""

    if total > 0:
        in_progress = total - completed
        status = (
            f"**{in_progress}** cours en cours, **{completed}** terminé(s)."
            if in_progress else f"**{completed}** cours terminé(s). Bravo !"
        )
        catalog = f" {available} autre(s) cours disponible(s) dans le catalogue." if available else ""
        return (
            f"Bonjour{g} ! Je suis **EduBot**, votre assistant pédagogique.\n\n"
            f"📊 {status}{catalog}\n\n"
            "Je peux vous aider à :\n"
            "- Suivre votre **progression** par cours\n"
            "- Trouver un cours dans le **catalogue**\n"
            "- Vous conseiller sur vos **évaluations**\n"
            "- Vous recommander la **suite** de votre parcours\n\n"
            "Quelle est votre question ?"
        )
    return (
        f"Bonjour{g} ! Je suis **EduBot**, votre assistant pédagogique.\n\n"
        f"{'Il y a **' + str(available) + '** cours disponibles dans le catalogue. ' if available else ''}"
        "Posez-moi vos questions sur les cours, votre progression ou vos évaluations !"
    )


def _resp_progress(ctx: Dict) -> str:
    name = (ctx.get("name") or "").split()[0]
    enrollments = ctx.get("enrollments", [])
    total = ctx.get("totalCourses", 0)
    completed_count = ctx.get("completedCourses", 0)
    avg_score = ctx.get("averageQuizScore", 0)
    attempts = ctx.get("totalQuizAttempts", 0)
    passed = ctx.get("passedQuizzes", 0)

    if total == 0:
        available = ctx.get("availableCourses", [])
        intro = f"Bonjour {name} ! " if name else ""
        if available:
            lines = [f"{intro}Vous n'êtes inscrit à aucun cours pour l'instant.\n"]
            lines.append("**Cours disponibles dans le catalogue :**")
            for c in available[:5]:
                lines.append(_course_line(c))
            if len(available) > 5:
                lines.append(f"*…et {len(available) - 5} autre(s). Consultez l'onglet Explorer.*")
            return "\n".join(lines)
        return f"{intro}Vous n'êtes inscrit à aucun cours. Explorez le catalogue pour commencer !"

    n = f", {name}" if name else ""
    lines = [f"**Votre progression{n}**\n"]
    lines.append(f"📚 Cours : **{total}** inscrits | **{completed_count}** terminés")
    if attempts > 0:
        lines.append(f"📝 Quiz : **{passed}/{attempts}** réussis | Score moyen : **{avg_score}%**")
    lines.append("")

    for e in enrollments:
        lines.append(_course_line(e, enrolled=True, progress=e.get("progress", 0), completed=e.get("completed", False)))

    in_progress = [e for e in enrollments if not e.get("completed") and e.get("progress", 0) > 0]
    not_started = [e for e in enrollments if e.get("progress", 0) == 0 and not e.get("completed")]

    if in_progress:
        closest = max(in_progress, key=lambda e: e.get("progress", 0))
        lines.append(f"\n💡 Continuez **{closest['courseTitle']}** — vous êtes à {closest['progress']}% !")
    elif not_started:
        lines.append(f"\n💡 Vous n'avez pas encore commencé **{not_started[0]['courseTitle']}**. Lancez-vous !")

    if attempts > 0 and avg_score < 60:
        lines.append("⚠️ Score moyen aux quiz < 60% — revoyez les modules avant de repasser.")

    return "\n".join(lines)


def _resp_quiz(ctx: Dict) -> str:
    name = (ctx.get("name") or "").split()[0]
    avg_score = ctx.get("averageQuizScore", 0)
    attempts = ctx.get("totalQuizAttempts", 0)
    passed = ctx.get("passedQuizzes", 0)
    n = f", {name}" if name else ""

    if attempts == 0:
        return (
            f"Vous n'avez pas encore tenté de quiz{n}.\n\n"
            "**Conseils :**\n"
            "- Terminez au moins 50% du contenu d'un module avant l'évaluation\n"
            "- Les questions portent sur la compréhension, pas la mémorisation\n"
            "- Vous pouvez repasser les quiz autant de fois que nécessaire\n"
            "- Le score minimum de validation est indiqué sur chaque évaluation"
        )

    lines = [f"**Vos résultats aux évaluations{n}**\n"]
    lines.append(f"- Tentatives : **{attempts}** | Réussies : **{passed}**")
    lines.append(f"- Score moyen : **{avg_score}%**\n")

    if avg_score >= 80:
        lines.append("🏆 Excellent niveau ! Pensez à compléter les cours pour obtenir vos **certificats**.")
    elif avg_score >= 60:
        lines.append("👍 Bon niveau. Pour progresser :")
        lines.append("- Relisez les explications après chaque mauvaise réponse")
        lines.append("- Visez 80% pour consolider vos connaissances")
    else:
        lines.append("📖 Score perfectible. Comment améliorer :")
        lines.append("- Repassez les leçons vidéo avant chaque quiz")
        lines.append("- Prenez des notes sur les concepts clés")
        lines.append("- Repasser plusieurs fois est normal et conseillé")

    return "\n".join(lines)


def _resp_recommendation(ctx: Dict) -> str:
    name = (ctx.get("name") or "").split()[0]
    enrollments = ctx.get("enrollments", [])
    available = ctx.get("availableCourses", [])
    n = f", {name}" if name else ""

    if not available and not enrollments:
        return (
            f"Aucun cours n'est encore disponible sur la plateforme{n}.\n"
            "Revenez bientôt — les formateurs ajoutent régulièrement du contenu !"
        )

    lines = [f"**Recommandations personnalisées{n}**\n"]

    # In-progress courses first
    in_progress = [e for e in enrollments if not e.get("completed") and e.get("progress", 0) > 0]
    if in_progress:
        lines.append("**Continuez là où vous en êtes :**")
        for e in sorted(in_progress, key=lambda x: -x.get("progress", 0))[:3]:
            lines.append(_course_line(e, enrolled=True, progress=e.get("progress", 0)))
        lines.append("")

    # Suggest available courses not yet started
    if available:
        # Sort by rating desc, then studentsCount
        top = sorted(available, key=lambda c: (-c.get("rating", 0), -c.get("studentsCount", 0)))
        lines.append("**Cours disponibles à découvrir :**")
        for c in top[:5]:
            lines.append(_course_line(c))
        if len(available) > 5:
            lines.append(f"*…et {len(available) - 5} autre(s). Explorez le catalogue complet.*")
    elif enrollments:
        completed = [e for e in enrollments if e.get("completed")]
        not_started = [e for e in enrollments if e.get("progress", 0) == 0 and not e.get("completed")]
        if not_started:
            lines.append("**À commencer :**")
            for e in not_started[:3]:
                lines.append(_course_line(e, enrolled=True, progress=0))
        if completed:
            lines.append(f"\nVous avez terminé **{len(completed)}** cours — tous les cours disponibles sont déjà dans votre parcours !")

    return "\n".join(lines)


def _resp_catalogue(ctx: Dict) -> str:
    available = ctx.get("availableCourses", [])
    enrollments = ctx.get("enrollments", [])
    all_courses = list(enrollments) + available  # enrolled first

    if not all_courses:
        return (
            "Aucun cours n'est encore publié sur la plateforme.\n"
            "Les formateurs ajoutent régulièrement du contenu — revenez bientôt !"
        )

    lines = [f"**Catalogue de la plateforme** ({len(all_courses)} cours)\n"]

    # Group by category
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
                lines.append(_course_line(c, enrolled=True, progress=c.get("progress", 0), completed=c.get("completed", False)))
            else:
                lines.append(_course_line(c))
        if len(items) > 6:
            lines.append(f"  *…et {len(items) - 6} autre(s)*")

    return "\n".join(lines)


def _resp_search(query_words: List[str], ctx: Dict) -> Optional[str]:
    """Match query against real courses. Returns None if no match found."""
    enrollments = ctx.get("enrollments", [])
    available = ctx.get("availableCourses", [])

    # Score enrolled courses
    enrolled_matches = []
    for e in enrollments:
        s = _score(query_words, {
            "title": e.get("courseTitle", ""),
            "category": e.get("category", ""),
            "description": e.get("description", ""),
            "tags": e.get("tags", []),
        })
        if s > 0:
            enrolled_matches.append((s, e))

    # Score available courses
    available_matches = []
    for c in available:
        s = _score(query_words, c)
        if s > 0:
            available_matches.append((s, c))

    if not enrolled_matches and not available_matches:
        return None

    lines = ["**Cours correspondant à votre recherche :**\n"]

    if enrolled_matches:
        lines.append("*Dans votre parcours :*")
        for _, e in sorted(enrolled_matches, key=lambda x: -x[0])[:4]:
            lines.append(_course_line(
                {"title": e.get("courseTitle"), "level": e.get("level"), "trainerName": e.get("trainerName", "")},
                enrolled=True, progress=e.get("progress", 0), completed=e.get("completed", False)
            ))
        lines.append("")

    if available_matches:
        lines.append("*Disponibles dans le catalogue :*")
        for _, c in sorted(available_matches, key=lambda x: -x[0])[:4]:
            lines.append(_course_line(c))

    return "\n".join(lines)


def _resp_cert(ctx: Dict) -> str:
    enrollments = ctx.get("enrollments", [])
    completed = [e for e in enrollments if e.get("completed")]
    lines = ["**Certificats EduAI Pro**\n"]
    if completed:
        lines.append(f"Vous avez **{len(completed)}** cours terminé(s) :")
        for e in completed:
            lines.append(f"- ✅ {e.get('courseTitle')}")
        lines.append("\nVos certificats sont disponibles dans **Mes Certificats** et partageables sur LinkedIn.")
    else:
        lines.append(
            "Pour obtenir un certificat :\n"
            "1. Compléter 100% du contenu du cours\n"
            "2. Valider toutes les évaluations avec le score minimum requis\n\n"
            "Consultez votre progression pour savoir où vous en êtes !"
        )
    return "\n".join(lines)


def _resp_help(ctx: Dict) -> str:
    available = len(ctx.get("availableCourses", []))
    enrolled = ctx.get("totalCourses", 0)
    return (
        "**Ce que je sais faire**\n\n"
        "Je suis **EduBot**, votre assistant pédagogique. Je m'appuie sur les cours "
        "réels de la plateforme pour vous répondre.\n\n"
        f"📚 Plateforme : **{enrolled}** cours dans votre parcours | **{available}** disponibles\n\n"
        "**Exemples de questions :**\n"
        "- *\"Montre-moi ma progression\"*\n"
        "- *\"Quels cours sont disponibles ?\"*\n"
        "- *\"Je cherche un cours sur [sujet]\"*\n"
        "- *\"Comment vont mes quiz ?\"*\n"
        "- *\"Que me recommandes-tu ?\"*\n"
        "- *\"Mes certificats\"*"
    )


# ── Main chatbot class ───────────────────────────────────────────────────────

class PedagogicalChatbot:

    def respond(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        user_context: Optional[Dict] = None,
    ) -> str:
        ctx = user_context or {}
        msg = message.strip()
        low = msg.lower()

        # 1. Greeting
        if _GREETING_RE.search(low):
            return _resp_greeting(ctx)

        # 2. Help
        if _has(low, _HELP_KW):
            return _resp_help(ctx)

        # 3. Progress
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

        # 8. Dynamic course search against real platform courses
        qw = _words(low)
        if qw:
            match = _resp_search(qw, ctx)
            if match:
                return match

        # 9. Fallback — guide toward something useful
        name = (ctx.get("name") or "").split()[0]
        in_progress = [e for e in ctx.get("enrollments", []) if not e.get("completed") and e.get("progress", 0) > 0]
        if in_progress and name:
            return (
                f"Je n'ai pas trouvé de réponse précise, {name}.\n\n"
                f"En attendant, vous avez **{in_progress[0]['courseTitle']}** en cours — continuez !\n\n"
                "Tapez **\"aide\"** pour voir ce que je sais faire, ou **\"liste des cours\"** pour le catalogue."
            )

        return random.choice([
            (
                "Je n'ai pas trouvé de cours correspondant sur la plateforme.\n\n"
                "Essayez :\n- *\"liste des cours\"* pour voir le catalogue complet\n"
                "- *\"que recommandes-tu ?\"* pour une suggestion personnalisée\n"
                "- *\"aide\"* pour voir toutes mes fonctionnalités"
            ),
            (
                "Je ne reconnais pas ce sujet dans les cours disponibles.\n\n"
                "Tapez **\"liste des cours\"** pour voir le catalogue ou "
                "**\"recommandation\"** pour une suggestion adaptée à votre niveau."
            ),
        ])
