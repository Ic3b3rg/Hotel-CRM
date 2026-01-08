#!/bin/bash
set -e

# Change to project root (parent of ralph/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "Working directory: $(pwd)"

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# Create progress.txt if it doesn't exist
if [ ! -f "ralph/progress.txt" ]; then
  echo "# Progress Log" > ralph/progress.txt
fi

PROMPT="@ralph/prd.json @ralph/progress.txt 1. Find the highest-priority feature to work on and work only on that feature. This should be the one YOU decide has the highest priority - not necessarily the first in the list. 2. Check that the types check via npm run typecheck. 3. Update the PRD with the work that was done (set passes: true when complete). 4. Append your progress to the ralph/progress.txt file. Use this to leave a note for the next person working in the codebase. ONLY WORK ON A SINGLE FEATURE. If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>."

for ((i=1; i<=$1; i++)); do
  echo ""
  echo "========================================"
  echo "Iteration $i of $1"
  echo "========================================"
  echo ""

  result=$(claude --permission-mode acceptEdits -p "$PROMPT" 2>&1) || true

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "========================================"
    echo "PRD complete after $i iterations!"
    echo "========================================"
    exit 0
  fi
done

echo ""
echo "========================================"
echo "Completed $1 iterations. PRD not yet complete."
echo "========================================"