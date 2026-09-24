#!/usr/bin/env bash
# read-limiter.sh
set -euo pipefail

MAX_READS=3
STATE_DIR="${GEMINI_PROJECT_DIR:-/tmp}/.agy-read-limiter"
mkdir -p "$STATE_DIR"

mode="${1:-}"
input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.AbsolutePath // .tool_input.TargetFile // empty' 2>/dev/null || true)

state_file() {
  local p="$1"
  echo "$STATE_DIR/$(echo -n "$p" | md5sum | cut -d' ' -f1).count"
}

case "$mode" in
  before_model)
    # Inject high-priority directive so the model uses direct read/write tools instead of running shell scripts
    echo '{"decision":"allow","systemMessage":"MANDATORY DIRECTIVE: Use direct file tools (view_file, replace_file_content, write_to_file) to read and edit files. DO NOT write or execute throwaway bash/python scripts to inspect, search, or modify files."}'
    ;;

  reset_all)
    rm -f "$STATE_DIR"/*.count 2>/dev/null || true
    echo '{"decision":"allow"}'
    ;;

  check_read)
    if [ -z "$file_path" ]; then
      echo '{"decision":"allow"}'
      exit 0
    fi
    sf=$(state_file "$file_path")
    count=0
    [ -f "$sf" ] && count=$(cat "$sf")
    count=$((count + 1))

    if [ "$count" -gt "$MAX_READS" ]; then
      echo "{\"decision\":\"deny\",\"reason\":\"Read limit reached: '$file_path' has already been read $((count-1)) times this turn (max $MAX_READS). Edit the file directly with replace_file_content first to reset the limit, or work from what you already read.\",\"systemMessage\":\"Blocked repeated read of $file_path (limit $MAX_READS/prompt)\"}"
      exit 0
    fi

    echo "$count" > "$sf"
    echo '{"decision":"allow"}'
    ;;

  check_bash)
    cmd=$(echo "$input" | jq -r '.tool_input.CommandLine // empty' 2>/dev/null || true)
    # If the command is running inline python or bash search scripts to read/manipulate repo files, remind to use direct tools
    if echo "$cmd" | grep -qE "python3? -c|cat |sed |awk |grep "; then
      echo '{"decision":"allow","systemMessage":"NOTICE: Direct file tools (view_file, replace_file_content) are available. Avoid invoking inline scripts for reading and writing files."}'
    else
      echo '{"decision":"allow"}'
    fi
    ;;

  reset_file)
    if [ -n "$file_path" ]; then
      rm -f "$(state_file "$file_path")" 2>/dev/null || true
    fi
    echo '{"decision":"allow"}'
    ;;

  *)
    echo '{"decision":"allow"}'
    ;;
esac
