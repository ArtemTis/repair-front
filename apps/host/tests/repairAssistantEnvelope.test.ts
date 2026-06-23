import { parseRepairAssistantStoredMessage } from '../src/shared/chat/repairAssistantEnvelope';

describe('parseRepairAssistantStoredMessage', () => {
    it('возвращает plainFallback для обычного текста', () => {
        const result = parseRepairAssistantStoredMessage('Привет');
        expect(result.envelope).toBeNull();
        expect(result.plainFallback).toBe('Привет');
    });
});