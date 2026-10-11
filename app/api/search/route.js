import { db } from '@/lib/db';
import { ok, handle } from '@/lib/api-utils';

export async function GET(req) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    if (!q) return ok({ results: [] });
    const like = `%${q}%`;
    const rows = db().prepare(`SELECT id,name,cat,price,old_price as old,icon,gradient as gr,rating,reviews,sales,description as 'desc',tag,tag_type as tagType FROM products WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(cat) LIKE ? ORDER BY sales DESC LIMIT 20`).all(like, like, like);
    return ok({ results: rows });
  });
}
