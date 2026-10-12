"""Classify and tidy haze headlines for the JB haze page. Stdlib only.

Tabs: impact (Impact in Malaysia), govt (Malaysia government response), indonesia (Indonesia action).
Singapore-only stories are dropped. Each story appears in at most one tab.
"""
import re
from datetime import datetime, timedelta, timezone

# (?i:...) scopes case-insensitivity to words; acronyms stay case-sensitive.
HAZE_RE = re.compile("|".join([
    r"(?i:\bhaze\b|\bsmoke\b|air quality|\bAPI reading|\bPM\s?2\.5\b|open burning|forest fires?|\bpeat|\bhotspots?\b|"
    r"cloud seeding|\bN95\b|visibility|transboundary)",
    r"(?i:jerebu|\bIPU\b|kualiti udara|pembakaran terbuka|kebakaran hutan|titik panas|pembenihan awan|jarak penglihatan)",
    r"(?i:kabut asap|karhutla|kebakaran hutan dan lahan|titik api|water bombing|hujan buatan|gambut)",
]))

MY_RE = re.compile("|".join([
    r"(?i:\bMalaysia(n|ns)?\b|\bJohor\b|\bJohor Bahru\b|\bPasir Gudang\b|\bIskandar\b|\bCauseway\b|Tambak Johor|"
    r"\bSelangor\b|\bKedah\b|\bPerak\b|\bPenang\b|\bPulau Pinang\b|\bMelaka\b|\bMalacca\b|\bNegeri Sembilan\b|\bPahang\b|"
    r"\bTerengganu\b|\bKelantan\b|\bPerlis\b|\bSabah\b|\bSarawak\b|\bPutrajaya\b|\bKuala Lumpur\b|Menteri Besar|Semenanjung)",
    r"\bJB\b|\bDOE\b|\bJAS\b|\bNRES\b|\bMOE\b|\bKPM\b|\bKL\b",
]))

GOVT_RE = re.compile("|".join([
    r"(?i:Department of Environment|Jabatan Alam Sekitar|ministry|kementerian|minister|menteri|cloud seeding|"
    r"pembenihan awan|open burning ban|larangan pembakaran terbuka|enforcement|penguatkuasaan|compounds?|kompaun|"
    r"diplomatic note|nota diplomatik|National Haze Action Plan|Menteri Besar|state government|kerajaan negeri|"
    r"emergency|darurat|school closures?|penutupan sekolah|schools? (closed|shut)|sekolah ditutup)",
    r"\bDOE\b|\bJAS\b|\bNRES\b|\bKPM\b|\bMOE\b|\bNADMA\b",
]))

INDO_RE = re.compile("|".join([
    r"(?i:\bIndonesia(n)?\b|\bSumatra\b|\bSumatera\b|\bRiau\b|\bJambi\b|\bPalembang\b|\bKalimantan\b|\bPontianak\b|"
    r"Manggala Agni|karhutla|water bombing|plantation|ladang|ASEAN transboundary)",
    r"\bBNPB\b|\bKLHK\b|\bKLH\b|\bBMKG\b",
]))

SG_RE = re.compile(r"(?i:\bSingapore\b|\bSingaporeans?\b)|\bNEA\b|\bPSI\b")

WINDOWS_DAYS = {"impact": 4, "govt": 4, "indonesia": 7}
MAX_PER_TAB = 10
STOPWORDS = set(("a an the of in on at to for and or with from by as is are was were be been its it this that these "
                 "those after over amid says say said new more than into out up yang dan di ke dari untuk dengan "
                 "pada ini itu akan telah oleh").split())


def text_of(item):
    return "%s %s" % (item.get("title", ""), item.get("description", ""))


def is_haze(item):
    return bool(HAZE_RE.search(text_of(item)))


def classify(item):
    """item: dict with title, description, source_indonesian (bool). Returns 'impact'|'govt'|'indonesia'|None."""
    text = text_of(item)
    if not HAZE_RE.search(text):
        return None
    has_my, has_indo = bool(MY_RE.search(text)), bool(INDO_RE.search(text))
    if SG_RE.search(text) and not has_my and not has_indo:
        return None
    govt = bool(GOVT_RE.search(text))
    if item.get("source_indonesian"):
        return "indonesia"
    # Malaysian outlet: counts as Malaysian context.
    if has_indo and not (govt and has_my):
        return "indonesia"
    if govt:
        return "govt"
    return "impact"


def norm_link(link):
    return re.sub(r"/+$", "", re.sub(r"[?#].*$", "", (link or "").strip())).lower()


def title_words(title):
    t = re.sub(r"[^\w\s]", " ", (title or "").lower())
    return set(w for w in t.split() if len(w) > 1 and w not in STOPWORDS)


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / float(len(a | b))


def organise(items, now=None, max_per_tab=MAX_PER_TAB):
    """items: [{title, description, link, source, lang, published(ISO str), source_indonesian}].
    Returns {tab: [{t,u,s,l,p}]} newest first, deduped, within the windows."""
    now = now or datetime.now(timezone.utc)
    parsed = []
    for it in items:
        try:
            when = datetime.fromisoformat(it["published"].replace("Z", "+00:00"))
        except Exception:
            continue
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        parsed.append((when, it))
    parsed.sort(key=lambda x: x[0], reverse=True)
    out = {"impact": [], "govt": [], "indonesia": []}
    seen_links, seen_words = set(), []
    for when, it in parsed:
        link = it.get("link", "")
        if not link.startswith("https://"):
            continue
        tab = classify(it)
        if tab is None:
            continue
        if (now - when).total_seconds() > WINDOWS_DAYS[tab] * 86400 or when > now + timedelta(hours=2):
            continue
        nl = norm_link(link)
        words = title_words(it.get("title", ""))
        if nl in seen_links or any(jaccard(words, w) >= 0.5 for w in seen_words):
            continue
        seen_links.add(nl)
        seen_words.append(words)
        if len(out[tab]) < max_per_tab:
            out[tab].append({
                "t": it["title"].strip()[:200], "u": link, "s": it.get("source", ""),
                "l": it.get("lang", "en"), "p": when.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
    return out
