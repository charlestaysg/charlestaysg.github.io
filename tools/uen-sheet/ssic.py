"""Parse the SSIC 2025 classification XLSX (SingStat) with stdlib only -> data/ssic2025.json.

Run:  python3 -I ssic.py      (reads data/raw/ssic/ssic2025.xlsx; download URL is in README.md)
Keeps 5-digit codes (what ACRA records) plus the 2-digit divisions, as {code: title}.
"""
import json, pathlib, re, zipfile
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).parent
SRC = HERE / "data" / "raw" / "ssic" / "ssic2025.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_rows(path):
    z = zipfile.ZipFile(path)
    strings = ["".join(t.text or "" for t in si.iter("{%s}t" % NS["m"]))
               for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    out = []
    for row in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter("{%s}row" % NS["m"]):
        cells = {}
        for c in row.findall("m:c", NS):
            v = c.find("m:v", NS)
            if v is None:
                continue
            col = re.match(r"[A-Z]+", c.get("r")).group()
            cells[col] = strings[int(v.text)] if c.get("t") == "s" else v.text
        out.append((cells.get("A", "").strip(), cells.get("B", "").strip()))
    return out


def tidy(t):
    t = re.sub(r"\s+", " ", t).strip()
    return t[:1] + t[1:].lower() if t.isupper() else t


def main():
    codes, divisions = {}, {}
    for code, title in read_rows(SRC):
        if re.fullmatch(r"\d{5}", code):
            codes[code] = tidy(title)
        elif re.fullmatch(r"\d{2}", code):
            divisions[code] = tidy(title)
    out = {"source": "SingStat, Singapore Standard Industrial Classification 2025, Classification Structure",
           "url": "https://www.singstat.gov.sg/files/d72a3cb8-16c9-49c6-aec6-8b7360831072.xlsx",
           "divisions": divisions, "codes": codes}
    (HERE / "data" / "ssic2025.json").write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"{len(codes)} five-digit codes, {len(divisions)} divisions")


if __name__ == "__main__":
    main()
