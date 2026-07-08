import re

path = r"c:\Users\Naman sharma\Downloads\Phishing and upi fraud\frontend\src\styles\landing.css"
with open(path, "r", encoding="utf-8") as f:
    css = f.read()

# Base colors
css = css.replace("background-color: #FCFCFE;", "background-color: #0a0c12;")
css = css.replace("color: #1e293b;", "color: #f1f5f9;")
css = css.replace("color: #0f172a;", "color: #f8fafc;")
css = css.replace("color: #475569;", "color: #94a3b8;")
css = css.replace("color: #334155;", "color: #cbd5e1;")

# Glass panels
css = css.replace("background: rgba(255, 255, 255, 0.7);", "background: rgba(30, 41, 59, 0.4);")
css = css.replace("border: 1px solid rgba(255, 255, 255, 0.8);", "border: 1px solid rgba(255, 255, 255, 0.1);")
css = css.replace("box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 1);", "box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);")

# Secondary buttons
css = css.replace("background: rgba(255, 255, 255, 0.8);", "background: rgba(30, 41, 59, 0.8);")
css = css.replace("border: 1px solid rgba(0, 0, 0, 0.08);", "border: 1px solid rgba(255, 255, 255, 0.1);")
css = css.replace("background: rgba(255, 255, 255, 1);", "background: rgba(30, 41, 59, 1);")

# Search box
css = css.replace("background: #0f172a;", "background: #3b82f6;")
css = css.replace("border: 1px solid rgba(0, 0, 0, 0.06);", "border: 1px solid rgba(255, 255, 255, 0.1);")

# Map SVG
css = css.replace("fill: #e2e8f0;", "fill: #1e293b;")

# Borders and lines
css = css.replace("border-bottom: 1px solid rgba(0,0,0,0.06);", "border-bottom: 1px solid rgba(255,255,255,0.1);")
css = css.replace("background: rgba(0,0,0,0.05);", "background: rgba(255,255,255,0.1);")
css = css.replace("stroke: rgba(0,0,0,0.05);", "stroke: rgba(255,255,255,0.1);")

# Feed items
css = css.replace("background: rgba(255,255,255,0.5);", "background: rgba(30, 41, 59, 0.5);")
css = css.replace("border: 1px solid rgba(0,0,0,0.03);", "border: 1px solid rgba(255,255,255,0.05);")

# Circular chart text
css = css.replace("fill: #0f172a;", "fill: #f8fafc;")

# Stack badges
css = css.replace("background: rgba(255,255,255,0.6);", "background: rgba(30,41,59,0.6);")
css = css.replace("border: 1px solid rgba(0,0,0,0.05);", "border: 1px solid rgba(255,255,255,0.1);")

# Compare cols
css = css.replace("background: rgba(241, 245, 249, 0.7);", "background: rgba(30,41,59,0.5);")
css = css.replace("background: rgba(238, 242, 255, 0.8);", "background: rgba(30,41,59,0.8);")
css = css.replace("color: #1e293b;", "color: #f8fafc;")

with open(path, "w", encoding="utf-8") as f:
    f.write(css)
