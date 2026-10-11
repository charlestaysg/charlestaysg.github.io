"""AI-related course test: title only, case-insensitive. Checked 11 Oct 2026 on a sample:
13 of 14 title matches were AI courses. 'Data science' and 'automation' are deliberately left out."""
import re

AI = re.compile(r"\b(AI|artificial intelligence|generative|genai|gen ai|chatgpt|copilot|machine learning|deep learning"
                r"|llms?|large language|prompt engineering|agentic)\b|\bA\.I\.", re.I)


def is_ai(title):
    return bool(AI.search(title))
