
import { Lead } from '../types';

// --- CONFIGURAÇÃO GLOBAL ---
// Coloque seu Client ID aqui uma única vez.
// Todos os clientes usarão este ID para se conectar.
const GOOGLE_CLIENT_ID = "SEU_CLIENT_ID_DO_GOOGLE_CLOUD_AQUI.apps.googleusercontent.com";

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
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        localStorage.setItem('g_cal_access_token', response.access_token);
                        callback(response.access_token);
                    }
                },
            });
        }
    }

    async requestToken() {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('SEU_CLIENT_ID')) {
            console.error('ERRO: Client ID não configurado no código (services/googleCalendar.ts).');
            alert('Erro de Configuração do Sistema: O ID do Google não foi definido pelo administrador.');
            return;
        }

        return new Promise<string>((resolve) => {
            this.initTokenClient((token) => resolve(token));
            
            // Pequeno delay para garantir que a lib do Google carregou
            setTimeout(() => {
                if (this.tokenClient) {
                    // check if token is valid or skip logic removed for simplicity in "one click" feel
                    // Always request to ensure valid session
                    this.tokenClient.requestAccessToken({ prompt: '' }); // Prompt vazio tenta logar sem forçar consentimento se já autorizado
                } else {
                    // Fallback se a lib não carregou a tempo
                    console.warn("Google GIS não carregado, tentando novamente...");
                    setTimeout(() => {
                         if (this.tokenClient) this.tokenClient.requestAccessToken({ prompt: 'consent' });
                    }, 1000);
                }
            }, 500);
        });
    }

    async fetchEvents(): Promise<GoogleEvent[]> {
        const token = this.accessToken || localStorage.getItem('g_cal_access_token');
        if (!token) return [];

        const now = new Date().toISOString();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);

        try {
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${maxDate.toISOString()}&singleEvents=true&orderBy=startTime`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 401) {
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
    }): Promise<boolean> {
        const token = this.accessToken || localStorage.getItem('g_cal_access_token');
        
        if (!token) {
            console.warn("Google Calendar não conectado.");
            return false;
        }

        const payload = {
            summary: eventData.summary,
            description: eventData.description,
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
        // Opcional: revogar token via endpoint do Google
    }

    isConnected() {
        return !!(this.accessToken || localStorage.getItem('g_cal_access_token'));
    }
}

export const googleCalendar = new GoogleCalendarService();
