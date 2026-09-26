"""Minimal environment check - write to file for clean reading."""
import sys
import os

lines = []
lines.append(f"Python: {sys.version}")
lines.append("")

for pkg in ['fastapi','uvicorn','pydantic','pydantic_settings','numpy','PIL','pydicom','httpx','nibabel','torch','monai','scipy']:
    try:
        mod = __import__(pkg)
        ver = getattr(mod, '__version__', '?')
        lines.append(f"{pkg}: {ver}")
    except ImportError:
        lines.append(f"{pkg}: NOT INSTALLED")

lines.append("")
try:
    import torch
    lines.append(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        lines.append(f"GPU: {torch.cuda.get_device_name(0)}")
        lines.append(f"CUDA version: {torch.version.cuda}")
except ImportError:
    lines.append("torch not installed - cannot check CUDA")

lines.append("")
ckpt = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'monai_brats_segresnet.pt')
if os.path.exists(ckpt):
    size = os.path.getsize(ckpt)
    lines.append(f"Checkpoint: EXISTS ({size/1024/1024:.2f} MB)")
else:
    lines.append("Checkpoint: NOT FOUND")

with open('env_report.txt', 'w') as f:
    f.write('\n'.join(lines))
print("Report written to env_report.txt")
