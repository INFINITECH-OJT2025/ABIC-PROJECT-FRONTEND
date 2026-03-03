import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || null
  } catch (error) {
    console.error('Error getting cookies:', error)
    return null
  }
}

// GET - Get single employee by ID (full profile)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/employees/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (err) {
    console.error('Employees [id] GET Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update employee by ID (super admin)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (err) {
    console.error('Employees [id] PUT Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}