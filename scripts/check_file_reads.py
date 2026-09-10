#!/usr/bin/env python3
import sys
import json
import os

STATE_FILE = "/tmp/antigravity_view_file_tracker.json"
MAX_READS = 3

try:
    payload = json.load(sys.stdin)
except Exception:
    payload = {}

# Intercept tool call arguments
tool_call = payload.get("toolCall", {}) or payload.get("tool_call", {})
args = tool_call.get("args", {})
target_path = args.get("AbsolutePath", "") or args.get("path", "")

if not target_path:
    # If no file path, allow
    out = {
        "decision": "allow",
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow"
        }
    }
    print(json.dumps(out))
    sys.exit(0)

# Track count
data = {}
if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
    except Exception:
        data = {}

counts = data.setdefault("counts", {})
count = counts.get(target_path, 0) + 1
counts[target_path] = count

try:
    with open(STATE_FILE, "w") as f:
        json.dump(data, f)
except Exception:
    pass

if count > MAX_READS:
    reason_msg = f"HARD BLOCK: '{target_path}' has already been read {MAX_READS} times in this turn. Further reads are strictly forbidden."
    out = {
        "decision": "deny",
        "reason": reason_msg,
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason_msg
        }
    }
    print(json.dumps(out))
    # Exit with code 2 for agentic CLI hard rejection
    sys.exit(2)

out = {
    "decision": "allow",
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow"
    }
}
print(json.dumps(out))
sys.exit(0)
