# PostgreSQL Local Setup Guide for BugTracker

This guide will help you set up PostgreSQL locally for the BugTracker application.

## Prerequisites

- PostgreSQL installed on your machine
- Basic knowledge of command line operations

## Step 1: Install PostgreSQL

### Windows
1. Download the installer from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the installation wizard
3. Remember the password you set for the 'postgres' user
4. Add PostgreSQL bin directory to your PATH environment variable

### macOS
\`\`\`bash
# Using Homebrew
brew install postgresql
brew services start postgresql
\`\`\`

### Linux (Ubuntu/Debian)
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

## Step 2: Create the Database

1. Open a terminal or command prompt
2. Log in to PostgreSQL as the postgres user:

\`\`\`bash
# Windows
psql -U postgres

# macOS/Linux
sudo -u postgres psql
\`\`\`

3. Create the database:

\`\`\`sql
CREATE DATABASE bug_tracker;
\`\`\`

4. Create a user (optional, you can use the default postgres user):

\`\`\`sql
CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE bug_tracker TO myuser;
\`\`\`

5. Exit PostgreSQL:

\`\`\`sql
\q
\`\`\`

## Step 3: Configure Environment Variables

1. Update your `.env.local` file with your PostgreSQL connection string:

\`\`\`
DATABASE_URL="postgresql://postgres:19948miko@localhost:5432/bug_tracker"
NEXTAUTH_SECRET="1234567890"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-change-this-in-production"
\`\`\`

Make sure to replace the username and password in the connection string with your actual PostgreSQL credentials.

## Step 4: Run Prisma Migrations

1. Run the following commands to set up your database schema:

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with initial data
npx prisma db seed
\`\`\`

## Step 5: Verify the Setup

1. Connect to the database to verify it's set up correctly:

\`\`\`bash
# Windows
psql -U postgres -d bug_tracker

# macOS/Linux
sudo -u postgres psql -d bug_tracker
\`\`\`

2. List the tables:

\`\`\`sql
\dt
\`\`\`

You should see the tables defined in your Prisma schema.

3. Exit PostgreSQL:

\`\`\`sql
\q
\`\`\`

## Troubleshooting

### Connection Issues

If you encounter connection issues, check:

1. PostgreSQL service is running
2. Your connection string is correct
3. The user has proper permissions
4. PostgreSQL is configured to accept connections

### Common Error: "role does not exist"

\`\`\`bash
# Create the role
sudo -u postgres createuser --interactive
\`\`\`

### Common Error: "database does not exist"

\`\`\`bash
# Create the database
sudo -u postgres createdb bug_tracker
\`\`\`

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
