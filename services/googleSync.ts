
import { Lead } from '../types';
import { googleCalendar } from './googleCalendar';

class GoogleSyncService {
    // Agora aceita apenas o Lead, pois não precisamos mais de URL de script
    async syncLead(lead: Lead) {
        
        // Verifica se o usuário conectou a agenda na tela de "Agenda"
        if (!googleCalendar.isConnected()) {
            // Opcional: Poderia retornar false silenciosamente
            console.log('Sincronização ignorada: Google Calendar não conectado.');
            return false;
        }

        if (!lead.nextFollowUp) {
            return false;
        }

        const startTime = new Date(lead.nextFollowUp);
        // Evento de 30 min padrão
        const endTime = new Date(startTime.getTime() + 30 * 60000);
        
        const cleanPhone = lead.phone.replace(/\D/g, '');
        const waLink = `https://wa.me/55${cleanPhone}`;

        // Monta os dados para a API do Google
        const eventData = {
            summary: `⚡ UP! Follow-up: ${lead.name} (${lead.source})`,
            description: `🚀 DETALHES DO ATENDIMENTO\n\n👤 Lead: ${lead.name}\n📧 Email: ${lead.email}\n📱 WhatsApp: ${waLink}\n🔗 CRM: https://crm.up.com.br/leads/${lead.id}\n\n💡 Gerado automaticamente pelo UP! CRM.`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            attendees: lead.email ? [lead.email] : []
        };

        // Chama o serviço que fala direto com a API (sem script intermediário)
        return await googleCalendar.createEvent(eventData);
    }

    // Método mantido apenas para compatibilidade, mas agora verifica a conexão API
    async testConnection(ignoredUrl?: string): Promise<boolean> {
        if (!googleCalendar.isConnected()) return false;
        
        const now = new Date();
        const end = new Date(now.getTime() + 15 * 60000);

        return await googleCalendar.createEvent({
            summary: "✅ Teste de Conexão UP! CRM",
            description: "Se você está vendo este evento, sua integração via API Direta está funcionando perfeitamente! Não é necessário Script.",
            start: now.toISOString(),
            end: end.toISOString()
        });
    }
}

export const googleSync = new GoogleSyncService();
