import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#F3F6F9] text-center">
      <h2 className="text-4xl font-black text-[#003B99] mb-4">404</h2>
      <p className="text-gray-600 mb-8">Página não encontrada ou em construção.</p>
      <Link 
        href="/"
        className="px-8 py-4 bg-[#003B99] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#0A2D66] transition-all"
      >
        Voltar para o Início
      </Link>
    </div>
  )
}
