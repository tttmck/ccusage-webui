#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$DIR/.ccusage-dashboard.pid"
LOG_DIR="$DIR/logs"
PORT=${PORT:-3001}

check_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    rm -f "$PID_FILE"
  fi
  return 1
}

do_start() {
  if check_running; then
    echo "Already running (PID: $(cat "$PID_FILE"))"
    echo "Visit http://localhost:$PORT"
    return 0
  fi

  # Build if dist is missing or stale
  if [ ! -d "$DIR/dist/index.html" ] 2>/dev/null; then
    echo "Building frontend..."
    (cd "$DIR" && npm run build)
  fi

  mkdir -p "$LOG_DIR"

  echo "Starting ccusage-dashboard..."
  node "$DIR/server/index.js" > "$LOG_DIR/server.log" 2>&1 &
  local pid=$!

  # Wait for server to be ready
  local retries=0
  while ! curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; do
    retries=$((retries + 1))
    if [ "$retries" -gt 20 ]; then
      echo "ERROR: Server failed to start. Check $LOG_DIR/server.log"
      kill "$pid" 2>/dev/null
      return 1
    fi
    sleep 0.5
  done

  echo "$pid" > "$PID_FILE"

  echo "Started successfully!"
  echo "  URL:  http://localhost:$PORT"
  echo "  PID:  $pid"
  echo "  Logs: $LOG_DIR/"
}

do_stop() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE" 2>/dev/null)
    echo "Stopping ccusage-dashboard..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi

  # Kill orphans
  local orphans
  orphans=$(pgrep -f "ccusage-dashboard/(node_modules|server)" 2>/dev/null || true)
  if [ -n "$orphans" ]; then
    echo "Killing orphan processes..."
    echo "$orphans" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi

  # Kill anything still on our port
  local port_pids
  port_pids=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$port_pids" ]; then
    echo "Clearing port $PORT..."
    echo "$port_pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi

  echo "Stopped"
}

do_restart() {
  do_stop
  sleep 1
  do_start
}

do_status() {
  if check_running; then
    echo "Running (PID: $(cat "$PID_FILE"))"
    echo "  URL: http://localhost:$PORT"
  else
    echo "Not running"
  fi
}

do_logs() {
  local target="${1:-server}"
  case "$target" in
    server) tail -f "$LOG_DIR/server.log" ;;
    *)      echo "Usage: $0 logs [server]"; exit 1 ;;
  esac
}

case "${1:-help}" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_restart ;;
  status)  do_status ;;
  logs)    do_logs "${2:-server}" ;;
  help|*)
    echo "ccusage-dashboard 管理脚本"
    echo ""
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "  start    构建 + 启动生产服务器"
    echo "  stop     停止服务器"
    echo "  restart  重启"
    echo "  status   查看运行状态"
    echo "  logs     查看日志"
esac
