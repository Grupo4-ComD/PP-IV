"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "ai/react";
import {
  Bot,
  Sparkles,
  Send,
  Ticket,
  ArrowRight,
  X,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";

export default function ChatbotReglamento() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, error } = useChat({
    api: "/api/chat-reglamento",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "¡Hola! Soy el **Asistente Virtual de Convivencia** del Consorcio Calle 425. ¿En qué puedo ayudarte hoy sobre el reglamento, ruidos molestos, tenencia de mascotas o espacios comunes?",
      }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const suggestedQuestions = [
    "¿Puedo pasear a mi mascota sin correa?",
    "¿Cuáles son los horarios de descanso y ruidos?",
    "¿Cómo funciona la multa por no limpiar?",
    "¿A qué hora se saca la basura?",
  ];

  const handleSuggestedQuestion = (q: string) => {
    append({ role: "user", content: q });
  };

  return (
    <aside aria-label="Asistente Virtual" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* VENTANA EXPANDIDA DEL CHAT */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 h-[30rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          {/* Header del Chat */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Asistente IA de Convivencia</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-indigo-200 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-200" />
                  <span>Reglamento Consorcio Calle 425</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition cursor-pointer"
                aria-label="Minimizar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const suggestsHelpdesk =
                msg.content.includes("Mesa de Ayuda") ||
                msg.content.includes("ticket");

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs"
                    }`}
                  >
                    {msg.content}

                    {/* Botón directo a Mesa de Ayuda si el bot lo sugiere */}
                    {!isUser && suggestsHelpdesk && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href="/vecino/mesa-ayuda"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition group"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Abrir Mesa de Ayuda ITIL</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                  {/* Para mantener la estética sin guardar la fecha exacta de forma ruidosa */}
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "Ahora"}
                  </span>
                </div>
              );
            })}

            {/* Error de Red */}
            {error && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs bg-red-50 text-red-600 border border-red-200 rounded-bl-xs">
                  Hubo un error al intentar conectarse al servidor. Por favor, intenta de nuevo o crea un ticket si el problema persiste.
                </div>
              </div>
            )}

            {/* Indicador de Tipeo */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-xs w-24 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition cursor-pointer flex items-center gap-1"
                >
                  <MessageSquareQuote className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* Formulario Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Pregunta sobre ruidos, mascotas, basura..."
              className="flex-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition disabled:opacity-40 cursor-pointer flex items-center justify-center"
              aria-label="Enviar pregunta"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* BOTÓN FLOTANTE TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-all cursor-pointer relative group"
        aria-label="Abrir Asistente Virtual"
      >
        <span className="transition-transform group-hover:scale-110">
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.2]" />
          ) : (
            <Bot className="w-6 h-6 stroke-[2.2]" />
          )}
        </span>

        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
        )}
      </button>
    </aside>
  );
}
