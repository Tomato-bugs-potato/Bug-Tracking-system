import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  })

  // Create regular users
  const userPassword = await hash("user123", 10)
  const users = await Promise.all(
    [
      { name: "Alice Smith", email: "alice@example.com" },
      { name: "Bob Johnson", email: "bob@example.com" },
      { name: "Charlie Davis", email: "charlie@example.com" },
      { name: "Diana Wilson", email: "diana@example.com" },
      { name: "Evan Brown", email: "evan@example.com" },
    ].map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          password: userPassword,
        },
      }),
    ),
  )

  // Create projects
  const projects = await Promise.all(
    [
      {
        name: "Frontend App",
        description: "Customer-facing web application",
      },
      {
        name: "Backend API",
        description: "RESTful API services",
      },
      {
        name: "Mobile App",
        description: "iOS and Android applications",
      },
      {
        name: "Admin Dashboard",
        description: "Internal administration portal",
      },
    ].map((project) =>
      prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          members: {
            create: {
              role: "OWNER",
              userId: admin.id,
            },
          },
        },
      }),
    ),
  )

  // Add users to projects
  for (const project of projects) {
    await Promise.all(
      users.slice(0, 3).map((user, index) =>
        prisma.projectMember.create({
          data: {
            role: index === 0 ? "MANAGER" : "MEMBER",
            userId: user.id,
            projectId: project.id,
          },
        }),
      ),
    )
  }

  // Create bugs
  const bugData = [
    {
      title: "Login fails on Safari browser",
      description:
        "Users are unable to log in when using Safari browser on macOS. The login button becomes unresponsive after clicking it.",
      stepsToReproduce:
        "1. Navigate to the login page\n2. Enter valid credentials\n3. Click the login button\n4. Observe that nothing happens",
      status: "OPEN",
      priority: "HIGH",
      severity: "CRITICAL",
      projectId: projects[0].id,
      reporterId: users[0].id,
      assigneeId: users[1].id,
    },
    {
      title: "Dashboard chart not rendering correctly",
      description:
        "The bar chart on the dashboard page is not displaying data correctly. The bars are misaligned and some data points are missing.",
      stepsToReproduce: "1. Log in to the application\n2. Navigate to the dashboard\n3. Observe the bar chart",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      severity: "MAJOR",
      projectId: projects[3].id,
      reporterId: users[1].id,
      assigneeId: users[2].id,
    },
    {
      title: "API timeout on large requests",
      description:
        "The API is timing out when handling requests with large payloads. This is affecting data synchronization.",
      stepsToReproduce:
        "1. Send a POST request to /api/data with a payload larger than 1MB\n2. Observe the timeout error",
      status: "OPEN",
      priority: "HIGH",
      severity: "CRITICAL",
      projectId: projects[1].id,
      reporterId: users[2].id,
      assigneeId: users[0].id,
    },
  ]

  for (const bug of bugData) {
    const createdBug = await prisma.bug.create({
      data: bug,
    })

    // Add comments
    await prisma.comment.createMany({
      data: [
        {
          content: "I can reproduce this issue on my machine as well.",
          bugId: createdBug.id,
          userId: users[0].id,
        },
        {
          content: "I'm looking into this now. Will update soon.",
          bugId: createdBug.id,
          userId: bug.assigneeId,
        },
      ],
    })

    // Add activities
    await prisma.activity.createMany({
      data: [
        {
          action: "created this bug",
          bugId: createdBug.id,
          userId: bug.reporterId,
        },
        {
          action: `assigned this bug to ${users.find((u) => u.id === bug.assigneeId)?.name}`,
          bugId: createdBug.id,
          userId: admin.id,
        },
      ],
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
