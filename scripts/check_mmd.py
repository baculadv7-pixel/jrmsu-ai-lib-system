from pathlib import Path
p=Path(r'c:\Users\provu\Desktop\jrmsu-ai-lib-system-main\flowchart.mmd')
s=p.read_text(encoding='utf-8')
print('Total lines:', len(s.splitlines()))
issues=[]
for i,l in enumerate(s.splitlines(),start=1):
    dq=l.count('"')
    sq=l.count("'")
    if dq%2!=0:
        issues.append((i,'double_quotes',dq,l.strip()))
    if sq%2!=0:
        issues.append((i,'single_quotes',sq,l.strip()))
    if l.count('(')!=l.count(')'):
        issues.append((i,'parens',l.count('('),l.count(')'),l.strip()))

if not issues:
    print('No odd quote or paren counts detected.')
else:
    print('Potential issues:')
    for it in issues:
        print(it)

# Extra check for class declaration missing commas
import re
for i,l in enumerate(s.splitlines(), start=1):
    if re.match(r"\s*class\s+.*\s+[a-zA-Z_]+\s*$", l):
        # if there's a space between last node and class name (missing comma)
        print('Potential class syntax spot:', i, l)

print('\nDone check')