
import { Lead } from '../types';
import { db } from './mockDb';

class GoogleSyncService {
    async syncLead(lead: Lead, customScriptUrl?: string) {
        let url = customScriptUrl;
        
        if (!url) {
            const tenant = await db.getTenant(lead.tenantId);
            url = tenant?.googleScriptUrl;
        }

        if (!url || !lead.nextFollowUp) {
            console.error('Sincronização abortada: URL do Google Script não configurada.');
            return false;
        }

        const startTime = new Date(lead.nextFollowUp);
        const endTime = new Date(startTime.getTime() + 30 * 60000);
        const cleanPhone = lead.phone.replace(/\D/g, '');
        // Adicionado código do país 55
        const waLink = `https://wa.me/55${cleanPhone}`;

        const payload = {
            titulo: `⚡ UP! Follow-up: ${lead.name} (${lead.source})`,
            inicio: startTime.toISOString(),
            fim: endTime.toISOString(),
            descricao: `🚀 DETALHES DO ATENDIMENTO\n👤 Lead: ${lead.name}\n📧 Email: ${lead.email}\n📱 WhatsApp: ${waLink}\n🔗 CRM: https://crm.up.com.br/leads/${lead.id}\n\n💡 Gerado automaticamente pelo UP! CRM.`,
            local: "Google Meet / WhatsApp",
            // Adiciona o e-mail do lead como participante para receber o convite do Google
            participantes: lead.email,
            action: "create"
        };

        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return true;
        } catch (error) {
            console.error('Erro na conexão com o Script do Google:', error);
            return false;
        }
    }

    async testConnection(url: string): Promise<boolean> {
        if (!url) return false;
        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    titulo: "✅ Teste de Conexão UP!",
                    inicio: new Date().toISOString(),
                    fim: new Date(Date.now() + 15 * 60000).toISOString(),
                    descricao: "Se você está vendo este evento, sua integração com o UP! CRM está funcionando perfeitamente!",
                    local: "Agenda Google",
                    action: "test"
                }),
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}

export const googleSync = new GoogleSyncService();
