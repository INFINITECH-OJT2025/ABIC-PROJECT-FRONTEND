import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface CreateEmployeeRequest {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  position: string
}

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || null
  } catch (error) {
    console.error('Error getting cookies:', error)
    return null
  }
}

// GET - List all employees
export async function GET(req: Request) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
    const { searchParams } = new URL(req.url)
    const queryString = searchParams.toString()
    const url = `${backendUrl}/api/employees${queryString ? `?${queryString}` : ''}`

    const backendRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const data = await backendRes.json().catch(() => ({}))

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Employees GET Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new employee
export async function POST(req: Request) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateEmployeeRequest = await req.json()

    if (!body.first_name?.trim() || !body.last_name?.trim() || !body.email?.trim() || !body.position?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'First name, last name, email, and position are required',
          errors: {
            first_name: !body.first_name?.trim() ? ['First name is required'] : [],
            last_name: !body.last_name?.trim() ? ['Last name is required'] : [],
            email: !body.email?.trim() ? ['Email is required'] : [],
            position: !body.position?.trim() ? ['Position is required'] : [],
          },
        },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
          errors: { email: ['Please provide a valid email address'] },
        },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/employees`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        middle_name: body.middle_name?.trim() || null,
        email: body.email.trim(),
        position: body.position.trim(),
      }),
    })

    const data = await backendRes.json().catch(() => ({}))

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Employees POST Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}