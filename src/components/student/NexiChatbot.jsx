import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, User, Loader, Code2, RotateCcw } from 'lucide-react';
import { studentService } from '../../services/studentService';

// Nexi — cute AI support assistant for Coding Nexus 💜
const NexiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [pendingCode, setPendingCode] = useState(null);
  const [pendingEscalate, setPendingEscalate] = useState(false);
  const [pendingTicket, setPendingTicket] = useState(null);
  const messagesEndRef = useRef(null);

  const WELCOME = {
    role: 'nexi',
    text: "Hi, I'm **Nexi**! 💜 Your 24/7 Coding Nexus assistant.\n\nI can help you with:\n• Support ticket questions\n• Competition results & scores\n• Code reviews & test case help\n• Anything Coding Nexus!\n\nWhat's on your mind? ✨"
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([WELCOME]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Parse markdown-lite: **bold** → <strong>, `code` → <code>
  const renderMarkdown = (text) => {
    const escaped = String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-pink-300 px-1.5 py-0.5 rounded text-xs">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || typing) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'student', text: text.trim() }]);
    setTyping(true);

    // Reserve a streaming message bubble — deltas append into it as they arrive.
    const streamMsgId = Date.now() + Math.random();
    setStreamingId(streamMsgId);
    setMessages(prev => [...prev, { role: 'nexi', text: '', streaming: true, id: streamMsgId }]);

    try {
      // Build short-term memory from the conversation so far (exclude the
      // message we just added, which becomes the current "message" param)
      const history = messages
        .filter(m => m.role === 'student' || m.role === 'nexi')
        .slice(-12)
        .map(m => ({ role: m.role, text: m.text }));

      const applyDelta = (delta) => {
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, text: (m.text || '') + delta } : m
        ));
      };

      // If we have pending code, send it as a code review
      if (pendingCode) {
        const response = await studentService.nexiChat(`Here is my code:\n${pendingCode}`, pendingCode, history);
        setPendingCode(null);
        if (response.success) {
          const r = response.data;
          setMessages(prev => prev.map(m => m.id === streamMsgId
            ? { ...m, text: r.reply, streaming: false }
            : m));
          if (r.askCode) {
            setMessages(prev => [...prev, { role: 'nexi', text: "Great! Paste your code here and I'll review it against the test cases 🚀" }]);
          }
        } else {
          setMessages(prev => prev.filter(m => m.id !== streamMsgId));
          handleError(response);
        }
        setTyping(false);
        setStreamingId(null);
        return;
      }

      // Streaming path: deltas render progressively; the final data object is
      // the same { reply, escalate, askCode, createTicket, ... } shape as before.
      const r = await studentService.nexiChatStream(
        text.trim(),
        null,
        history,
        applyDelta
      );

      // The streamed text is the raw JSON the model produced; replace it with
      // the server-parsed final reply so the bubble is always exact.
      setMessages(prev => prev.map(m => m.id === streamMsgId
        ? { ...m, text: r.reply, streaming: false }
        : m));

      // If the AI wants a code snippet, ask the student
      if (r.askCode) {
        setMessages(prev => [...prev, {
          role: 'nexi',
          text: r.reply + "\n\n📝 **Paste your code below** and I'll check it against the test cases!"
        }]);
        setPendingCode(true);
        setTyping(false);
        setStreamingId(null);
        return;
      }

      // If the AI suggests creating a ticket, show confirmation
      if (r.createTicket && r.ticketSubject && r.ticketMessage) {
        const ticket = { subject: r.ticketSubject, message: r.ticketMessage };
        setPendingTicket(ticket);
        setMessages(prev => [...prev, {
          role: 'nexi',
          text: r.reply + "\n\n🎫 **Your ticket:**\n\n**Subject:** " + r.ticketSubject + "\n\n" + r.ticketMessage + "\n\nShall I send it?",
          ticketOption: ticket
        }]);
        setTyping(false);
        setStreamingId(null);
        return;
      }

      // Show escalate confirmation button if AI suggests it
      if (r.escalate) {
        setMessages(prev => [...prev, {
          role: 'nexi',
          text: r.reply + "\n\n💜 **Want me to notify a human admin?**",
          escalateOption: true
        }]);
        setPendingEscalate(text.trim());
        setTyping(false);
        setStreamingId(null);
        return;
      }
    } catch (error) {
      // Rate-limit / busy errors arrive as thrown errors with a code; clean up
      // the partially-streamed bubble and show the friendly message.
      const r = { error: error.message, code: error.code, retryAfterMs: error.retryAfterMs };
      setMessages(prev => prev.filter(m => m.id !== streamMsgId));
      handleError(r);
    } finally {
      setTyping(false);
      setStreamingId(null);
    }
  };

  const handleError = (response) => {
    const code = response.code;
    const msg = response.error || 'Something went wrong. Please try again.';

    // Rate limit — friendly, non-technical, tells them to retry shortly
    if (code === 'AI_RATE_LIMIT' || code === 'AI_ACTIVE_LIMIT' || code === 'AI_BUSY' || (msg && msg.toLowerCase().includes('quota'))) {
      setMessages(prev => [...prev, {
        role: 'nexi',
        text: "Oops — Nexi got a bit overwhelmed with all the chats! 😅 Give me a minute or two and try again. I'll be right here! 💜"
      }]);
      return;
    }

    if (code === 'AI_NOT_CONFIGURED' || msg.includes('GEMINI_API_KEY')) {
      setMessages(prev => [...prev, {
        role: 'nexi',
        text: "Oops! The AI assistant isn't configured yet. Please contact an admin to set up the Gemini API key. 🙏"
      }]);
      return;
    }

    // Any other AI/network hiccup — friendly, no technical details
    setMessages(prev => [...prev, {
      role: 'nexi',
      text: "Hmm, I hit a small hiccup 😅 — but don't worry! You can still raise a ticket and a human from the Coding Nexus Team will help you. Just tell me what's wrong, or try again in a moment. 💜"
    }]);
  };

  const handleEscalate = async () => {
    setTyping(true);
    try {
      const response = await studentService.nexiEscalate(pendingEscalate, pendingCode);
      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'nexi',
          text: response.data.message
        }]);
      } else {
        handleError(response);
      }
    } catch (error) {
      handleError({ error: error.message });
    } finally {
      setPendingEscalate(false);
      setPendingCode(null);
      setTyping(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!pendingTicket) return;
    setTyping(true);
    try {
      const response = await studentService.nexiCreateTicket(
        pendingTicket.subject,
        pendingTicket.message
      );
      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'nexi',
          text: "🎉 **Your ticket has been sent to the Coding Nexus Team!**\n\nSomeone will reply soon — keep an eye on your email. 💜"
        }]);
      } else {
        handleError(response);
      }
    } catch (error) {
      handleError({ error: error.message });
    } finally {
      setPendingTicket(null);
      setTyping(false);
    }
  };

  const handleCancelTicket = () => {
    setPendingTicket(null);
    setMessages(prev => [...prev, {
      role: 'nexi',
      text: "No problem! Let me know if there's anything else I can help with 💜"
    }]);
  };

  // Start a fresh conversation (clears short-term memory / topic)
  const handleNewTopic = () => {
    setMessages([WELCOME]);
    setPendingCode(null);
    setPendingEscalate(false);
    setPendingTicket(null);
    setStreamingId(null);
    setTyping(false);
  };

  const quickReplies = [
    "How do marks work in competitions?",
    "What's my competition score?",
    "Help me with my code",
    "Raise a support ticket",
    "Talk to a human"
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
        title="Chat with Nexi"
      >
        {isOpen ? <X className="w-7 h-7" /> : <Bot className="w-8 h-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[540px] max-h-[70vh] bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm flex items-center gap-1">
                Nexi <Sparkles className="w-3.5 h-3.5" />
              </p>
              <p className="text-pink-100 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"></span>
                Online 24/7 · AI Assistant
              </p>
            </div>
            <button
              onClick={handleNewTopic}
              title="Start a new topic"
              className="text-white/80 hover:text-white transition p-1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/40">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'student'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-700 text-slate-100 rounded-bl-sm border border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === 'nexi' ? (
                      <span className="text-pink-300 text-xs font-semibold flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Nexi
                      </span>
                    ) : (
                      <span className="text-indigo-200 text-xs font-semibold flex items-center gap-1">
                        <User className="w-3 h-3" /> You
                      </span>
                    )}
                  </div>
                  <div
                    className="text-slate-100"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                  />
                  {msg.escalateOption && (
                    <button
                      onClick={handleEscalate}
                      disabled={typing}
                      className="mt-2 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      💜 Yes, notify a human admin
                    </button>
                  )}
                  {msg.ticketOption && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCreateTicket}
                        disabled={typing}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        ✅ Yes, create it
                      </button>
                      <button
                        onClick={handleCancelTicket}
                        disabled={typing}
                        className="flex-1 bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg hover:bg-slate-500 transition disabled:opacity-50"
                      >
                        ✖ Not now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && !streamingId && (
              <div className="flex justify-start">
                <div className="bg-slate-700 border border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <Loader className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                  <span className="text-slate-300 text-xs">Nexi is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={typing}
                  className="text-xs bg-slate-700 text-pink-200 border border-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-600 transition disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-700 bg-slate-800">
            {pendingCode && !typing && (
              <div className="mb-2 text-xs text-pink-300 bg-pink-900/30 border border-pink-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 flex-shrink-0" />
                Paste your code — I'll review it against the test cases!
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={pendingCode ? "Paste your code here..." : "Ask Nexi anything..."}
                className="flex-1 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              />
              <button
                onClick={() => sendMessage()}
                disabled={typing || !input.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NexiChatbot;
