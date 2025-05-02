#!/bin/bash

# Create PostgreSQL database
echo "Creating PostgreSQL database..."
createdb bugtracker

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

# Seed the database with initial data
echo "Seeding the database..."
npx prisma db seed

echo "Database setup complete!"
