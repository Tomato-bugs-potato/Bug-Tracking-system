// This script will generate and set an API key for a specific project

const { PrismaClient } = require('../prisma/generated/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const projectId = 'cm9zotjp50000tlhs767ilizz'; // Your project ID

async function generateAndSetApiKey() {
  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.error('Project not found');
      process.exit(1);
    }

    // Generate a new API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Update the project with the new API key
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { apiKey },
    });

    console.log('API Key generated successfully:');
    console.log('API Key:', apiKey);
    console.log('Project ID:', projectId);
    
    console.log('\nUse these values in your GitHub repository secrets:');
    console.log('BUG_TRACKER_API_KEY:', apiKey);
    console.log('BUG_TRACKER_PROJECT_ID:', projectId);
    console.log('BUG_TRACKER_URL: Your application URL (e.g., http://localhost:3000)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateAndSetApiKey(); 