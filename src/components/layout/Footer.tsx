import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white-100 bg-white py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white-600">
        
        <div className="flex items-center">
          <img 
            src="/assets/logo-horizontal.svg" 
            alt="Logo do Óleo Circular" 
            className="h-7 w-auto object-contain" 
          />
        </div>

        <nav className="flex items-center gap-6">
          <a href="#sobre" className="hover:text-green-primary transition-colors">
            Sobre
          </a>
          <a href="#privacidade" className="hover:text-green-primary transition-colors">
            Privacidade
          </a>
          <a href="#termos" className="hover:text-green-primary transition-colors">
            Termos de Uso
          </a>
        </nav>

        <div className="text-white-600">
          © 2026 HS Tecnologia v1.0.0
        </div>
      </div>
    </footer>
  )
}

export default Footer