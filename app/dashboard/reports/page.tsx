"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ChartTooltip,
} from "@/components/ui/chart"

// Mock data for charts
const bugStatusData = [
  { name: "Open", value: 42, color: "#f43f5e" },
  { name: "In Progress", value: 28, color: "#3b82f6" },
  { name: "Resolved", value: 35, color: "#22c55e" },
  { name: "Closed", value: 22, color: "#94a3b8" },
]

const bugTrendData = [
  { name: "Jan", created: 18, resolved: 12 },
  { name: "Feb", created: 25, resolved: 22 },
  { name: "Mar", created: 20, resolved: 18 },
  { name: "Apr", created: 27, resolved: 23 },
  { name: "May", created: 32, resolved: 30 },
  { name: "Jun", created: 24, resolved: 22 },
  { name: "Jul", created: 30, resolved: 27 },
]

const bugPriorityData = [
  { name: "High", count: 35 },
  { name: "Medium", count: 45 },
  { name: "Low", count: 20 },
]

const resolutionTimeData = [
  { name: "Critical", time: 2.1 },
  { name: "Major", time: 3.8 },
  { name: "Minor", time: 5.2 },
  { name: "Trivial", time: 7.5 },
]

const COLORS = ["#f43f5e", "#3b82f6", "#22c55e", "#94a3b8"]

export default function ReportsPage() {
  const [reportType, setReportType] = useState("bugs")
  const [timeRange, setTimeRange] = useState("month")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="grid gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bugs">Bug Reports</SelectItem>
              <SelectItem value="projects">Project Status</SelectItem>
              <SelectItem value="users">User Activity</SelectItem>
              <SelectItem value="performance">Team Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bug Status Distribution</CardTitle>
                <CardDescription>Distribution of bugs by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bugStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {bugStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bug Trends</CardTitle>
                <CardDescription>Bug creation and resolution over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bugTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#f43f5e" activeDot={{ r: 8 }} name="Created" />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bug Priority</CardTitle>
                <CardDescription>Distribution of bugs by priority</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bugPriorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#3b82f6" name="Bugs">
                      {bugPriorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resolution Time</CardTitle>
                <CardDescription>Average time to resolve bugs by severity (days)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="time" fill="#8884d8" name="Days">
                      {resolutionTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Report Data</CardTitle>
              <CardDescription>Tabular data for the selected report type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 border-b px-4 py-3 font-medium">
                  <div>Name</div>
                  <div>Status</div>
                  <div>Priority</div>
                  <div>Created</div>
                  <div>Resolved</div>
                </div>
                <div className="divide-y">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="grid grid-cols-5 items-center px-4 py-3">
                      <div>Bug #{i + 1}</div>
                      <div>{i % 3 === 0 ? "Open" : i % 3 === 1 ? "In Progress" : "Resolved"}</div>
                      <div>{i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low"}</div>
                      <div>{`${i + 1} ${i === 0 ? "day" : "days"} ago`}</div>
                      <div>{i % 3 === 2 ? `${i} ${i === 1 ? "day" : "days"} ago` : "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Total Bugs</h3>
                    <p className="text-3xl font-bold">127</p>
                    <p className="text-sm text-muted-foreground">+5.4% from previous period</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Avg. Resolution Time</h3>
                    <p className="text-3xl font-bold">3.2 days</p>
                    <p className="text-sm text-muted-foreground">-12% from previous period</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Open Bugs</h3>
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-muted-foreground">-2.1% from previous period</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Bug Fix Rate</h3>
                    <p className="text-3xl font-bold">85%</p>
                    <p className="text-sm text-muted-foreground">+3.5% from previous period</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Key Insights</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Most bugs are reported in the Frontend App project</li>
                    <li>Critical bugs are being resolved 15% faster than last month</li>
                    <li>UI-related bugs account for 40% of all reported issues</li>
                    <li>Team performance has improved by 8% in bug resolution time</li>
                    <li>Mobile App project has the highest number of open bugs</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Allocate more resources to the Mobile App project</li>
                    <li>Implement additional UI testing to reduce frontend bugs</li>
                    <li>Review the bug triage process to improve prioritization</li>
                    <li>Consider additional training for the backend team</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
