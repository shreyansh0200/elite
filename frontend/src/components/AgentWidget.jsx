import { useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, X, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';

const HINDI_RE = /[\u0900-\u097F]/;

function isHindi(text) {
  return HINDI_RE.test(text);
}

function pickVoice(lang) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const requested = lang.toLowerCase();
  const prefix = requested.split('-')[0];
  const indianNames = prefix === 'hi'
    ? ['hindi', 'heera', 'kalpana', 'ravi', 'hemant', 'google हिन्दी']
    : ['india', 'ravi', 'heera', 'en-in', 'google भारतीय english'];
  const matchesIndianName = (voice) => indianNames.some((name) => voice.name?.toLowerCase().includes(name));

  return voices.find((voice) => voice.lang?.toLowerCase() === requested && matchesIndianName(voice))
    || voices.find((voice) => voice.lang?.toLowerCase() === requested)
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(`${prefix}-in`))
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix) && matchesIndianName(voice))
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix))
    || null;
}

export default function AgentWidget({ embedded = false }) {
  const [open, setOpen] = useState(embedded);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'नमस्ते! मंडी भाव, pickup slot, ticket/PNR या फसल बेचने के बारे में पूछें। / Ask me about mandi rates, slots, tickets, selling or buying.' },
  ]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [inputLanguage, setInputLanguage] = useState('hi-IN');
  const [error, setError] = useState('');
  const rec = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.lang = inputLanguage;
    r.onstart = () => { setListening(true); setError(''); };
    r.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) setText(transcript);
    };
    r.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission was blocked. Please allow microphone access.' : 'Voice input failed. You can type your question instead.');
      setListening(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;

    return () => {
      try { r.stop(); } catch {}
      rec.current = null;
    };
  }, [inputLanguage]);

  useEffect(() => {
    const handler = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', handler);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', handler);
  }, []);

  const speak = (content) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const hindi = isHindi(content);
    const lang = hindi ? 'hi-IN' : 'en-IN';
    const voice = pickVoice(lang);
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    utterance.rate = hindi ? 0.82 : 0.88;
    utterance.pitch = 0.98;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const send = async (forcedText = null) => {
    const q = String(forcedText ?? text).trim();
    if (!q) return;

    setText('');
    setError('');
    const userMessage = { role: 'user', content: q };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);

    try {
      const r = await api.post('/ai/chat', {
        message: q,
        history: nextHistory.slice(-10),
      });
      const answer = r.data?.reply || 'Sorry, I could not find an answer.';
      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
      speak(answer);
    } catch (e) {
      const message = e.response?.data?.message || 'Agent is temporarily unavailable. Please try again.';
      setMessages((current) => [...current, { role: 'assistant', content: message }]);
      setError(message);
    }
  };

  const toggleVoice = () => {
    if (!rec.current) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge, or type your question.');
      return;
    }

    if (listening) {
      try { rec.current.stop(); } catch {}
      return;
    }

    rec.current.lang = inputLanguage;
    try { rec.current.start(); } catch { setError('Microphone is already starting. Please try again.'); }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (!open && !embedded) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Open AgriSync Agent" className="fixed right-5 bottom-5 z-50 rounded-full btn-primary w-14 h-14 shadow-xl grid place-items-center">
        <Bot />
      </button>
    );
  }

  return (
    <div className={embedded ? 'card h-full' : 'fixed right-5 bottom-5 z-50 w-[min(440px,calc(100vw-2rem))] card shadow-2xl p-0 overflow-hidden'}>
      <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
        <span className="font-bold flex gap-2 items-center"><Bot /> Ask AgriSync</span>
        <div className="flex gap-1 items-center">
          <button type="button" onClick={() => { setVoiceEnabled((v) => !v); if (voiceEnabled) stopSpeech(); }} title={voiceEnabled ? 'Turn voice answers off' : 'Turn voice answers on'} className="p-1">
            {voiceEnabled ? <Volume2 className="w-4" /> : <VolumeX className="w-4" />}
          </button>
          {!embedded && <button type="button" onClick={() => { stopSpeech(); setOpen(false); }}><X /></button>}
        </div>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[88%] rounded-xl p-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto bg-primary text-white' : 'bg-white border'}`}>
            {m.content}
            {m.role === 'assistant' && (
              <button type="button" onClick={() => speak(m.content)} className="ml-2 inline-flex align-middle" title="Speak answer">
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {speaking && <div className="text-xs text-gray-500">Speaking… <button onClick={stopSpeech} className="underline">Stop</button></div>}
      </div>

      {error && <div className="px-3 pt-3 text-xs text-red-700">{error}</div>}

      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={toggleVoice} className={`px-3 rounded-lg ${listening ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`} title="Speak your question">
            {listening ? <MicOff /> : <Mic />}
          </button>
          <input
            className="input-field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Type: Kanpur गेहूं का भाव? / Ask a mandi rate…"
            aria-label="Ask AgriSync"
          />
          <button type="button" className="btn-primary" onClick={() => send()} disabled={!text.trim()}><Send /></button>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
          <span>Mic → speech text → answer text → voice.</span>
          <span className="flex gap-1">
            <button type="button" onClick={() => setInputLanguage('hi-IN')} className={`px-2 py-1 rounded ${inputLanguage === 'hi-IN' ? 'bg-primary text-white' : 'bg-gray-100'}`}>हिंदी</button>
            <button type="button" onClick={() => setInputLanguage('en-IN')} className={`px-2 py-1 rounded ${inputLanguage === 'en-IN' ? 'bg-primary text-white' : 'bg-gray-100'}`}>English</button>
          </span>
        </div>
      </div>
    </div>
  );
}
