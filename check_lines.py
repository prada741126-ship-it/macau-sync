import sys

filepath = r"C:\Users\monkey888\WorkBuddy\Claw\render-deploy\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Check lines around 5153 (1-indexed) = index 5152 (0-indexed)
start_idx = 5152  # line 5153
end_idx = 5185    # line 5186 (inclusive)

print(f"Line 5153 (idx {start_idx}): {lines[start_idx]}")
print(f"Line 5186 (idx {end_idx}): {lines[end_idx]}")
print(f"Line 5187 (idx {end_idx+1}): {lines[end_idx+1]}")
