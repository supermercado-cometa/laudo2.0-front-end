'use client'
 
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#F3F6F9] text-center">
      <h2 className="text-4xl font-black text-red-600 mb-4">Erro Crítico</h2>
      <p className="text-gray-600 mb-8">Ocorreu um erro inesperado ao carregar esta página.</p>
      <button
        onClick={() => reset()}
        className="px-8 py-4 bg-[#003B99] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#0A2D66] transition-all"
      >
        Tentar Novamente
      </button>
    </div>
  )
}
