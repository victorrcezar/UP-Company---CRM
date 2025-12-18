
import { Lead } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export interface GoogleEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    description?: string;
    location?: string;
    htmlLink?: string;
}

class GoogleCalendarService {
    private tokenClient: any = null;
    private accessToken: string | null = null;

    constructor() {
        this.accessToken = localStorage.getItem('g_cal_access_token');
    }

    async initTokenClient(clientId: string, callback: (token: string) => void) {
        if (typeof window === 'undefined' || !clientId) return;
        
        // @ts-ignore
        if (window.google?.accounts?.oauth2) {
            // @ts-ignore
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
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

    async requestToken(clientId: string) {
        if (!clientId) {
            console.error('Tentativa de conexão sem Client ID configurado.');
            return;
        }

        return new Promise<string>((resolve) => {
            // Sempre reinicializa para garantir que usa o Client ID mais recente
            this.initTokenClient(clientId, (token) => resolve(token));
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    async fetchEvents(): Promise<GoogleEvent[]> {
        const token = this.accessToken || localStorage.getItem('g_cal_access_token');
        if (!token) return [];

        const now = new Date().toISOString();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 15); // Busca apenas próximos 15 dias para performance

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
                localStorage.removeItem('g_cal_access_token');
                this.accessToken = null;
                return [];
            }

            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Erro ao buscar eventos do Google:', error);
            return [];
        }
    }

    logout() {
        localStorage.removeItem('g_cal_access_token');
        this.accessToken = null;
    }

    isConnected() {
        return !!(this.accessToken || localStorage.getItem('g_cal_access_token'));
    }
}

export const googleCalendar = new GoogleCalendarService();
