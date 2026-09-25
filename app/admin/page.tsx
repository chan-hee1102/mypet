import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminAuth';
import { AdminClient } from './AdminClient';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: '관리자 — mypet', robots: { index: false, follow: false } };

/** /admin — 세션 쿠키가 있으면 대시보드, 없으면 로그인으로. 데이터는 전부 /api/admin/*에서 읽는다 */
export default function AdminPage() {
  if (!isAdmin()) redirect('/admin/login');
  return <AdminClient />;
}
