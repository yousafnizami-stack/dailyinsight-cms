const CMS_API_URL = process.env.CMS_API_URL
const CMS_EMAIL = process.env.CMS_EMAIL
const CMS_PASSWORD = process.env.CMS_PASSWORD

if (!CMS_API_URL || !CMS_EMAIL || !CMS_PASSWORD) {
  throw new Error('Missing required env vars: CMS_API_URL, CMS_EMAIL, CMS_PASSWORD')
}

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${CMS_API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CMS login failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { token: string }
  return data.token
}

export async function saveArticle(article: Record<string, unknown>): Promise<unknown> {
  const token = await getAuthToken()

  const res = await fetch(`${CMS_API_URL}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...article, status: 'draft' }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to save article (${res.status}): ${text}`)
  }

  return res.json()
}
