import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <p className="mt-4 text-gray-500">Página não encontrada</p>
        <Link href="/" className="mt-4 inline-block text-sm text-gray-900 font-medium hover:underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
