import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  // Redireciona de volta para a página inicial
  const url = new URL(req.url);
  return NextResponse.redirect(new URL('/', url.origin), {
    status: 303 // Redirecionamento temporário apropriado após POST
  });
}
