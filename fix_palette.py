with open(".Jules/palette.md", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "**Action:** Wrap purely decorative characters" in line:
        # Split it and insert newline
        parts = line.split("## 2024-05-18 - Prevent Missing Input")
        if len(parts) == 2:
            lines[i] = parts[0] + "\n\n## 2024-05-18 - Prevent Missing Input" + parts[1]
            break

with open(".Jules/palette.md", "w") as f:
    f.writelines(lines)
