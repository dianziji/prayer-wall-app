import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('prayers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch prayers' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createClient(); 

  try {
    const body = await req.json();
    console.log('Incoming request body:', body);

    const { content, author_name } = body;

    if (!content || content.length > 500) {
      return new Response('Invalid content', { status: 400 });
    }

    const { error } = await supabase
      .from('prayers')
      .insert([{ content, author_name }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response('Database error', { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Unhandled POST error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
