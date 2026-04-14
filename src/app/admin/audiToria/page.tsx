import { redirect } from 'next/navigation';

export default function AuditoriaRootPage() {
  // Redireciona automaticamente para a busca por tombo
  redirect('/admin/auditoria/tombo');
}
