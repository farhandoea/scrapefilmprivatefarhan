import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const pat = process.env.GITHUB_PAT;
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;

    if (!pat || !owner || !repo) {
      return NextResponse.json({ error: 'Missing GitHub configuration in environment variables.' }, { status: 400 });
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${pat}`,
      },
      body: JSON.stringify({
        ref: 'main'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("GitHub API Error:", text);
      return NextResponse.json({ error: `Failed to trigger workflow: ${response.statusText}`, details: text }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: 'Workflow triggered successfully.' });
  } catch (error: any) {
    console.error("Error triggering workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
