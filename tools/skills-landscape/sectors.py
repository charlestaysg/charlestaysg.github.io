"""Keyword rules that map a course to one of the Pulse's 14 MOM sectors, or 'general'.

Conventions follow the hand tags in the Pulse's sctp.json: facilities management -> admin;
media, video and photography -> ICT; aircraft maintenance -> transport; food safety/science ->
manufacturing; tourism and attractions -> food & accommodation; data analytics, HR, digital
marketing, leadership, generic AI -> general (cross-sector).

Matching: title first. If the title names no sector, the course text (what_you_learn + about)
is used, but only when it points clearly to one sector: three or more different keyword hits,
or two hits and none for any other sector. One passing mention of "healthcare" is not enough. Ties go to the sector with more hits, then
to PRIORITY order (more specific sectors first). Delivery-mode notes in titles are ignored.
"""
import re

KEYWORDS = {
    "security": r"security officer|security guard|security supervisor|security operation|security system|security technolog"
                r"|private security|security agenc|security industr|guard(ing)? duties|patrol|surveillance|private investigat"
                r"|security (studies|business|management|industry|risk)|security & fire|fire safety|bodyguard|close protection|crowd control|screening (officer|operation)|alarm",
    "health": r"nurs(e|ing)|health ?care|patient|clinic(al)?|caregiv|elder ?care|eldercare|aged care|dementia|community care"
              r"|social work|social service|counsell?ing|mental health|early childhood|pre-?school|infant|child ?care|childcare"
              r"|pharmac|physiotherap|occupational therap|dental|medical|rehabilitat|hospital|palliative|postnatal|confinement"
              r"|ophthalm|optometr|radiograph|phlebotom|allied health|disabilit|special needs|youth work|gerontolog|\bpdecce|\becce\b|young children",
    "food": r"food (and|&) beverage|\bf ?& ?b\b|culinary|\bchef|\bcook(ing)?\b|pastry|baking|bakery|barista|coffee|bartend"
            r"|mixolog|\bwine|sommelier|hotel|hospitality|front office|housekeeping|kitchen|restaurant|catering|banquet"
            r"|food service|food handl|tourism|tourist|attraction|\bresort|guest (service|relation)|dim sum|hawker",
    "construction": r"construction|\bbim\b|building information model|scaffold|formwork|rebar|crane|civil engineer|structural"
                    r"|green mark|green building|plumb|tiling|\bbuilding (works|control|services)|excavat|piling|demolition"
                    r"|tower crane|lifting (operation|supervisor)|rigger|signalman|work at height|confined space|geotechnical"
                    r"|tunnel|\bmep\b|\bfacade|carpentr|electrical install|lift (maintenance|technician)",
    "transport": r"logistic|supply chain|warehous|forklift|freight|shipping|maritime|\bport\b|vessel|\bship\b|seafar|marine"
                 r"|aviation|aircraft|aerospace|airline|airport|cabin crew|\bbus\b|driving (licen|lesson|instruct|test)|class \d driving|\bdrivers?\b|\brail|\bmrt\b|courier"
                 r"|last[- ]mile|customs|dangerous goods|cold chain|inventory|fleet|passenger|ground handl"
                 r"|electric vehicle|\bev\b|automotive|motor vehicle",
    "finance": r"\bbank|insurance|insurer|wealth|financial (planning|advis|services|market|institution|crime)|fintech"
               r"|invest(ment|ing)|capital market|anti-money|money laundering|\baml\b|\bkyc\b|treasury|credit (risk|analys)"
               r"|trade finance|in finance\b|finance (industry|sector|professional)|asset management|private equity|fund management|securities|derivative|digital asset"
               r"|blockchain|payment (system|service)|\bcmfas|actuar|underwrit|claims (handl|management)",
    "realestate": r"real estate|property (management|agent|valuation|investment|market)|estate agent|realtor"
                  r"|\bcea\b|condominium|strata|leasing agent|valuation",
    "retail": r"retail|merchandis|wholesale|e-?commerce|\bstore (operation|manag)|shop ?floor|cashier|point of sale"
              r"|omni-?channel|beauty advisor|cosmetic|fashion|jewel|luxury|sales associate|trading (company|business)",
    "arts": r"\barts\b(?! management)|fine art|visual art|\bartist|music|dance|theatre|theater|performing|\bsports?\b|fitness|\bgym\b|personal train|coach(ing)? (athlet|sport)"
            r"|recreation|museum|heritage|\bcraft|pottery|ceramic|painting|drawing|calligraph|floral|florist"
            r"|yoga|pilates|swim|golf|esports|arts management",
    "publicedu": r"adult educat|\bacta\b|\bacld?p?\b|educator|teach(er|ing)|lecturer|tutor|curriculum|instructional design"
                 r"|learning design|facilitat(e|ion|ing) learning|training (and|&) development|\bassessor|\btrainer"
                 r"|public (service|sector|administration)|civil service|government|pedagog|e-?learning (design|develop|content)"
                 r"|workplace learning|on-the-job training|\bojt\b",
    "professional": r"account(ing|ancy|ant)|audit|\btax(ation)?\b|\bgst\b|legal|\blaw\b|lawyer|paralegal|litigation|contract law"
                    r"|corporate secretar|company secretar|architectural|architect(ure)? (practice|firm|design)|landscape architect|interior design|advertising|public relations"
                    r"|management consult|engineering consult|quantity survey|\bxbrl|bookkeep|payroll|\bifrs|\bacra\b"
                    r"|patent|intellectual property|forensic account",
    "admin": r"facilit(y|ies) (management|operation|manager|service)|environmental service|cleaning|cleaner|landscap"
             r"|horticultur|arborist|pest (control|management)|\bpest\b|waste management|recycl|janitor|travel agen"
             r"|tour guide|event management|events? (planning|operation)|\bmice\b|call cent|contact cent|outsourc"
             r"|employment agen|recruitment agen|security screening|car park|building maintenance|urban greenery",
    "manufacturing": r"manufactur|production (line|planning|operation)|\bcnc\b|machining|machinist|welding|welder|mechatronic"
                     r"|\bplc\b|industrial (automation|engineering|control)|semiconductor|wafer|precision engineer"
                     r"|pharmaceutical|biologic|biopharm|\bgmp\b|chemical (process|plant|engineer)|petrochem|process (plant|operation)"
                     r"|additive manufactur|3d print|injection mou?ld|metrology|food (safety|science|technology|manufactur)"
                     r"|food processing|quality (control|assurance) (in|for) manufactur|lean manufactur|factory|plant (operation|maint)"
                     r"|robotics?\b(?! process)|instrumentation|tool and die|non-destructive|\bndt\b|electronics (assembly|manufactur)|boiler"
                     r"|power plant|power and gas|gas (engineer|technician)|electrical engineer|mechanical engineer",
    "ict": r"software|programming|\bcoding\b|python|\bjava\b|javascript|\bsql\b|cloud|\baws\b|azure|google cloud"
           r"|cyber ?security|cyber|network(ing)? (engineer|security|administrat|infrastructure)|\bccna|it support"
           r"|it service|it infrastructure|web (develop|design)|app develop|mobile app|full[- ]stack|front[- ]end|back[- ]end"
           r"|devops|kubernetes|docker|linux|database admin|data cent(re|er)|\bui\b|\bux\b|user experience|game (develop|design)"
           r"|animation|motion graphic|video (production|editing|graphy)|videograph|film|broadcast|media production|podcast"
           r"|graphic design|adobe|photoshop|illustrator|premiere|after effects|3d model|\bunity\b|unreal|telecommunicat"
           r"|5g|internet of things|\biot\b|penetration test|iso/?iec 27001|\bitil\b|it architect|digital forensic|infrastructure support|\bvideo|moving image|photograph|ethical hack|information security|infocomm|computing|\bict\b",
}

PRIORITY = ["security", "health", "food", "admin", "construction", "transport", "finance", "realestate", "retail",
            "arts", "publicedu", "ict", "manufacturing", "professional"]

PATTERNS = {k: re.compile(KEYWORDS[k], re.I) for k in PRIORITY}


def _hits(text):
    """sector -> number of distinct keyword hits in text."""
    out = {}
    for k, p in PATTERNS.items():
        found = {m.group(0).lower() for m in p.finditer(text)}
        if found:
            out[k] = len(found)
    return out


def _pick(hits):
    return max(hits, key=lambda k: (hits[k], -PRIORITY.index(k)))


MODE_NOTE = re.compile(r"\([^)]*(synchronous|asynchronous|e-?learning|classroom|blended|online|face-to-face|\bf2f\b)[^)]*\)", re.I)

NON_SPECIALIST = re.compile(r"\bnon-?(financ|technical|specialist|engineer)", re.I)


def classify(title, body=""):
    """Return (sector, basis) where basis is 'title', 'text' or 'none'."""
    title = MODE_NOTE.sub(" ", title)  # delivery-mode notes such as "(Synchronous e-learning)"
    if NON_SPECIALIST.search(title):  # "Finance for Non-Financial Managers" is a general course
        return "general", "none"
    t = _hits(title)
    if t:
        return _pick(t), "title"
    b = _hits(body)
    if b:
        best = _pick(b)
        others = sum(n for k, n in b.items() if k != best)
        if b[best] >= 3 or (b[best] >= 2 and others == 0):
            return best, "text"
    return "general", "none"
