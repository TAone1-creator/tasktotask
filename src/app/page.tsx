import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            reestrutura
          </h1>
          <div className="flex gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Começar agora
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Organize sua vida em
            <br />
            <span className="text-gray-400">3 a 6 meses.</span>
          </h2>
          <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
            Não é um app para usar para sempre. É uma porta de entrada para uma vida mais organizada. Metas, finanças, hábitos e tarefas — tudo conectado.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-gray-900 text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Começar minha reestruturação
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Metas', desc: 'Eixo central' },
              { label: 'Finanças', desc: 'Consciência' },
              { label: 'Hábitos', desc: 'Consistência' },
              { label: 'Tarefas', desc: 'Suporte' },
            ].map((item) => (
              <div key={item.label} className="p-4">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6">
        <p className="text-center text-xs text-gray-400">
          O objetivo não é reter para sempre, mas transformar uma fase da vida.
        </p>
      </footer>
    </div>
  )
}
