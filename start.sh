#!/bin/bash
echo "Starting Watch Party environment (Local Memory Mode)..."

echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

cd ..

echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Development servers running."
echo "Press Ctrl+C to stop."

trap "echo 'Stopping servers...'; kill $BACKEND_PID; kill $FRONTEND_PID; exit" SIGINT SIGTERM

wait
