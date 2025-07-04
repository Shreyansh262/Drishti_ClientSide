import { NextResponse } from "next/server"
import { getFileContent, appendToFile } from "@/lib/sshClient"

const filePath = "/home/fast-and-furious/main/drishti/tickets/tickets.csv"

// CSV parser to handle commas in quoted fields
function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"' // handle escaped quote
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map(val => val.trim())
}

export async function GET(req) {
  try {
    const vehicleNumber = req.headers.get("x-vehicle-number")
    if (!vehicleNumber) {
      return NextResponse.json({ error: "Missing vehicleNumber" }, { status: 400 })
    }

    const csvContent = await getFileContent(filePath)
    if (!csvContent || csvContent.trim() === "") {
      return NextResponse.json({ tickets: [] })
    }

    const lines = csvContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && line.includes(","))

    const tickets = lines.map((line) => {
      const [
        id, vehicle, issueType, title, description,
        incidentDate, incidentTime, status, priority,
        createdAt, adminResponse
      ] = parseCSVLine(line)

      return {
        id,
        vehicleNumber: vehicle,
        issueType,
        title,
        description,
        incidentDate,
        incidentTime,
        status,
        priority,
        createdAt,
        adminResponse: adminResponse || null,
      }
    })

    const filtered = tickets.filter(t => t.vehicleNumber === vehicleNumber)

    return NextResponse.json({ tickets: filtered })
  } catch (err) {
    console.error("GET /ticket error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      vehicleNumber,
      issueType,
      title,
      description,
      date,
      time,
    } = body

    if (!vehicleNumber || !issueType || !title || !description || !date || !time) {
      console.warn("⚠️ Missing fields in request")
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const ticketId = `TKT${Date.now().toString().slice(-8)}`
    const newTicket = {
      id: ticketId,
      vehicleNumber,
      issueType,
      title,
      description,
      incidentDate: date,
      incidentTime: time,
      status: "pending",
      priority: "low",
      createdAt: new Date().toISOString(),
      adminResponse: "",
    }

    const row = Object.values(newTicket)
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(",")


    const filePath = "/home/fast-and-furious/main/drishti/tickets/tickets.csv"

    await appendToFile(filePath, row + "\n")


    return NextResponse.json({ success: true, ticket: newTicket })
  } catch (err) {
    console.error("❌ POST /api/ticket error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
//