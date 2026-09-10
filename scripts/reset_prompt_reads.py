#!/usr/bin/env python3
import json
import os
import sys

STATE_FILE = "/tmp/antigravity_view_file_tracker.json"

try:
    with open(STATE_FILE, "w") as f:
        json.dump({"counts": {}}, f)
except Exception:
    pass

# Contract: PreInvocation returns JSON
print(json.dumps({}))
sys.exit(0)
