#!/bin/bash
echo "Starting Go server with PostgreSQL..."
cd go-backend
export DATABASE_URL=$DATABASE_URL
go run main.go