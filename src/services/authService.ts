import api from './api';

export interface User {
  id: string;
  email: string;
  tipo: 'parceiro' | 'admin';
  nome: string;
}

interface LoginCredentials {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    tipo: 'parceiro' | 'admin';
    nome: string;
  };
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordCredentials {
  token: string;
  senha: string;
  confirmarSenha?: string;
}

interface RegisterCredentials {
  tipoPessoa: string;
  nomeRazaoSocial: string;
  email: string;
  senha: string;
  documento: string;
  telefone?: string;
  porte: string;
  aceiteMarketing: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  capacidadeBombona: number;
  // Comunicação (etapa "comunicacao" - só institucional)
  redesSociais?: string;
  site?: string;
  aceiteDivulgacao?: boolean;
  // Vínculo com parceiro indicador (etapa "about")
  parceiroIndicadorId?: number | null;
  comoConheceu?: string;
  observacao?: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    nome: string;
    tipo: string;
  };
}

export interface ParceiroIndicador {
  id: number;
  nome: string;
  tipo: 'ASSOCIACAO' | 'COOPERATIVA' | 'ONG';
  cnpj: string;
  email: string | null;
  telefone: string | null;
  site: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface DisponibilidadeResponse {
  emailDisponivel: boolean | null;
  documentoDisponivel: boolean | null;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/parceiros/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Lista de parceiros ativos para vínculo/indicação (etapa "about" do cadastro)
  async listarParceirosIndicadores(): Promise<ParceiroIndicador[]> {
    const response = await api.get('/parceiros-indicadores');
    return response.data;
  },

async verificarDisponibilidade(params: {
    email?: string;
    documento?: string;
  }): Promise<DisponibilidadeResponse> {
    const query = new URLSearchParams();
    if (params.email) query.append('email', params.email);
    if (params.documento) query.append('documento', params.documento);

    const response = await api.get(`/parceiros/verificar-disponibilidade?${query.toString()}`);
    return response.data;
  },
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.put('/parceiros/logout').catch(() => {});
  },

  async ForgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post('/parceiros/forgot-password', { email })
    return response.data;
  },

  async resetPassword(data: ResetPasswordCredentials): Promise<ForgotPasswordResponse> {
    const response = await api.post('/parceiros/reset-password', data);
    return response.data;
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean}> {
    const response = await api.post(`/parceiros/verify-reset-token?token=${token}`);
    return response.data;
  },

  async register(data: RegisterCredentials): Promise<RegisterResponse> {
    const response = await api.post('/parceiros/register', data);
    return response.data;
  },

  async buscarCep(cep: string): Promise<{
    logradouro: string
    bairro: string
    cidade: string
  }> {
    const cleaned = cep.replace(/\D/g, '')
    const reponse = await api.get(`/parceiros/buscar-cep/${cleaned}`)
    return reponse.data
  },

   getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
};