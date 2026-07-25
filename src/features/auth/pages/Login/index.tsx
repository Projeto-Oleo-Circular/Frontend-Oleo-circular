import { useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderPublic from '../../../../components/layout/HeaderPublic'
import Input from '../../../../components/ui/Input'
import ToastContainer from '../../../../components/ui/ToastContainer'
import useToast from '../../../../hooks/useToast'
import { useAuth } from '../../../../hooks/useAuth'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ email: '', senha: '' })
  const [formData, setFormData] = useState({ email: '', senha: '' })

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    let hasError = false
    const errors = { email: '', senha: '' }

    if (!formData.email) {
      errors.email = 'E-mail é obrigatório'
      hasError = true
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = 'E-mail inválido'
      hasError = true
    }

    if (!formData.senha) {
      errors.senha = 'Senha é obrigatória'
      hasError = true
    } else if (formData.senha.length < 6) {
      errors.senha = 'Senha deve ter no mínimo 6 caracteres'
      hasError = true
    }

    setFieldErrors(errors)
    return !hasError
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      await login(formData.email, formData.senha)
      navigate('/home')
    } catch (err: any) {
      if (err.response?.status === 401) {
        addToast('E-mail ou senha incorretos. Tente novamente', 'error')
      } else if (err.response?.data?.message) {
        addToast(err.response.data.message, 'error')
      } else {
        addToast('Erro ao fazer login. Verifique suas credenciais', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <HeaderPublic />

      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex md:w-1/2">
          <img src="src/assets/Imagem 4.jpg" alt="Projeto Óleo Circular" className="w-full h-full object-cover" />
        </aside>

        <main className="flex flex-col items-center w-full md:w-1/2 px-8 bg-background overflow-y-auto relative">
          <div className="flex flex-col items-center w-full max-w-sm mt-8 mb-8">
            <img src="src/assets/logo-horizontal.svg" alt="Logo Óleo Circular" className="h-32 md:h-36 w-auto" />
            <p className="text-sm text-black-100 font-medium mt-2 text-center">Plataforma de Coleta Solidária</p>
          </div>

          <form onSubmit={handleLogin} className="w-full max-w-sm">
            <p className="text-xs font-extrabold text-black-100 tracking-widest mb-3">DADOS DE ACESSO</p>

           <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
            <Input
                type="email"
                name="email"
                icon="email"
                placeholder="Seu e-mail"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                error={fieldErrors.email}
                noBorder
            />
            <hr className="border-white-100" />
            <Input
                type="password"
                name="senha"
                icon="cadeado"
                placeholder="Sua senha"
                value={formData.senha}
                onChange={handleInputChange}
                disabled={loading}
                error={fieldErrors.senha}
                noBorder
            />
            </div>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                className="text-green-primary text-sm font-medium hover:text-green-hover transition-colors"
                onClick={() => navigate('/forgot-password')}
                disabled={loading}
              >
                Esqueci minha senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-primary text-white-primary font-bold py-3 rounded-xl mb-4 hover:bg-green-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center text-sm text-black-100">
              Não tem uma conta?{' '}
              <button
                type="button"
                className="text-green-primary font-bold hover:text-green-hover transition-colors"
                onClick={() => navigate('/register')}
                disabled={loading}
              >
                Criar conta
              </button>
            </p>
          </form>

          <p className="absolute bottom-6 text-xs text-black-100">
            © 2026 HS Tecnologia. Todos os direitos reservados.
          </p>
        </main>
      </div>
    </div>
  )
}

export default Login