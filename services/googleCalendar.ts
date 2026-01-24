
import { Lead } from '../types';

// --- CONFIGURAÇÃO GLOBAL ---
// Client ID configurado no Google Cloud Console.
// Permite que qualquer usuário faça login com sua própria conta Google.
const GOOGLE_CLIENT_ID = "291624685306-g7e8ahe2qdmis4r2nglf15p1n788ejq3.apps.googleusercontent.com";

const SCOPES = 'https://www.googleapis.com/auth/calendar';

export interface GoogleEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    description?: string;
    location?: string;
    htmlLink?: string;
    attendees?: { email: string }[];
}

class GoogleCalendarService {
    tokenClient: any;
    accessToken: string | null;

    constructor() {
        this.tokenClient = null;
        this.accessToken = localStorage.getItem('g_cal_access_token');
    }

    async initTokenClient(callback: (token: string) => void) {
        if (typeof window === 'undefined') return;
        
        // @ts-ignore
        if (window.google?.accounts?.oauth2) {
            // @ts-ignore
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    // Tratamento de erros vindo do popup do Google
                    if (response.error) {
                        console.error("Erro na Autenticação Google:", response);
                        
                        if (response.error === 'popup_closed_by_user') {
                            console.warn("Login cancelado pelo usuário.");
                        } else if (response.error === 'access_denied') {
                            alert("ACESSO NEGADO PELO GOOGLE!\n\nMotivo provável: Seu e-mail não foi adicionado como 'Usuário de Teste' no Google Cloud Console.\n\nAcesse o painel do Google Cloud -> Tela de Permissão OAuth -> Usuários de Teste e adicione seu e-mail.");
                        } else {
                            alert(`Erro ao conectar Google: ${response.error}`);
                        }
                        return;
                    }

                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        localStorage.setItem('g_cal_access_token', response.access_token);
                        callback(response.access_token);
                    }
                },
                error_callback: (err: any) => {
                    console.error("Erro fatal no cliente OAuth:", err);
                }
            });
        }
    }

    async requestToken() {
        if (!GOOGLE_CLIENT_ID) {
            console.error('ERRO: Client ID não configurado.');
            alert('Erro de Configuração: ID do Google não definido no código.');
            return;
        }

        return new Promise<string>((resolve) => {
            this.initTokenClient((token) => resolve(token));
            
            // Pequeno delay para garantir que a lib do Google carregou
            setTimeout(() => {
                if (this.tokenClient) {
                    // Usa 'consent' para forçar a tela de permissão se o token estiver inválido ou expirado
                    this.tokenClient.requestAccessToken({ prompt: 'consent' });
                } else {
                    console.warn("Google GIS não carregado. Verifique sua conexão.");
                    alert("A biblioteca de login do Google ainda não carregou. Tente novamente em alguns segundos.");
                }
            }, 500);
        });
    }

    // Atualizado para aceitar datas opcionais. Se não passar, pega o mês atual expandido.
    async fetchEvents(startDate?: Date, endDate?: Date): Promise<GoogleEvent[]> {
        const token = this.accessToken || localStorage.getItem('g_cal_access_token');
        if (!token) return [];

        // Define intervalo padrão se não fornecido (Mês atual -1 semana a +1 mês)
        const start = startDate ? startDate.toISOString() : new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
        const end = endDate ? endDate.toISOString() : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();

        try {
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 401) {
                console.warn("Token Google expirado. Realizando logout.");
                this.logout();
                return [];
            }

            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Erro ao buscar eventos do Google:', error);
            return [];
        }
    }

    async createEvent(eventData: { 
        summary: string; 
        description: string; 
        start: string; 
        end: string; 
        attendees?: string[]; 
        location?: string;
    }): Promise<boolean> {
        const token = this.accessToken || localStorage.getItem('g_cal_access_token');
        
        if (!token) {
            console.warn("Google Calendar não conectado. Ignorando criação de evento.");
            return false;
        }

        const payload = {
            summary: eventData.summary,
            description: eventData.description,
            location: eventData.location,
            start: { dateTime: eventData.start },
            end: { dateTime: eventData.end },
            attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        try {
            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                if (response.status === 401) this.logout();
                const errData = await response.json();
                console.error("Erro API Google Calendar:", errData);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Falha na requisição ao Google Calendar:', error);
            return false;
        }
    }

    logout() {
        localStorage.removeItem('g_cal_access_token');
        this.accessToken = null;
        
        // Tenta revogar o token se a biblioteca estiver carregada
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.accounts) {
            try {
                (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('Token Google revogado.');
                });
            } catch (e) {
                // Token já inválido ou lib não carregada
            }
        }
    }

    isConnected() {
        return !!(this.accessToken || localStorage.getItem('g_cal_access_token'));
    }
}

export const googleCalendar = new GoogleCalendarService();
