package com.tuproyecto.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * ARCHIVO: backend/src/main/java/com/tuproyecto/backend/controller/ChatController.java
 *
 * Endpoint proxy que recibe mensajes del chatbot (Interfaz/chatbot-modal.jsp)
 * y los reenvía a la API de Anthropic Claude.
 *
 * La API key nunca sale al navegador — se mantiene segura en application.properties.
 *
 * CONFIGURAR en application.properties:
 *   anthropic.api.key=sk-ant-XXXXXXXXXX
 */
@RestController
@RequestMapping("/api")
public class ChatController {

    @Value("${anthropic.api.key}")
    private String anthropicApiKey;

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String CLAUDE_MODEL   = "claude-sonnet-4-6";
    private static final String SYSTEM_PROMPT  =
        "Eres un asistente virtual útil y amigable. Responde siempre en español de forma clara y concisa.";

    private final RestTemplate restTemplate = new RestTemplate();

    // ── DTO de entrada ────────────────────────────────────────────────────────

    public static class ChatRequest {
        private List<Message> messages;
        public List<Message> getMessages() { return messages; }
        public void setMessages(List<Message> messages) { this.messages = messages; }
    }

    public static class Message {
        private String role;
        private String content;
        public String getRole()    { return role; }
        public String getContent() { return content; }
        public void setRole(String role)       { this.role = role; }
        public void setContent(String content) { this.content = content; }
    }

    // ── Endpoint principal ────────────────────────────────────────────────────

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        try {
            // Construir body para Anthropic
            Map<String, Object> body = new HashMap<>();
            body.put("model",      CLAUDE_MODEL);
            body.put("max_tokens", 1000);
            body.put("system",     SYSTEM_PROMPT);
            body.put("messages",   request.getMessages());

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key",           anthropicApiKey);
            headers.set("anthropic-version",   "2023-06-01");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Llamada a Claude
            ResponseEntity<Map> response = restTemplate.postForEntity(
                CLAUDE_API_URL, entity, Map.class
            );

            // Extraer texto de la respuesta
            Map<String, Object> responseBody = response.getBody();
            String reply = extractReply(responseBody);

            Map<String, Object> result = new HashMap<>();
            result.put("reply", reply);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error al procesar la solicitud: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> responseBody) {
        if (responseBody == null) return "(sin respuesta)";
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        if (content == null || content.isEmpty()) return "(sin respuesta)";
        Object text = content.get(0).get("text");
        return text != null ? text.toString() : "(sin respuesta)";
    }
}
