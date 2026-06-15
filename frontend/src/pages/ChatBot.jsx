import { useState, useRef, useEffect } from 'react';
import { chatbotService } from '../services/allServices';
import { MdSend, MdSmartToy, MdPerson, MdAutoAwesome } from 'react-icons/md';

const SUGGESTIONS = [
  'Show low stock products',
  "What are today's sales?",
  'Show top selling products',
  'Show pending payments',
  'What is total revenue?',
  'Show recent invoices',
];

const BotMessage = ({ msg }) => {
  const renderData = (data) => {
    if (!data) return null;
    if (data.type === 'low_stock_table' || data.type === 'top_products' || data.type === 'pending_invoices' || data.type === 'recent_invoices') {
      return (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-primary-50">
                {Object.keys(data.items[0] || {}).map(k => (
                  <th key={k} className="px-3 py-2 text-left font-semibold text-primary-700 capitalize border border-primary-100">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 border border-gray-100 text-gray-700">
                      {val instanceof Date || (typeof val === 'string' && val.includes('T')) ? new Date(val).toLocaleDateString('en-IN') : String(val ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <MdSmartToy className="text-white text-sm" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{msg.text}</p>
          {msg.data && renderData(msg.data)}
        </div>
        <div className="flex items-center gap-2 mt-1 ml-1">
          <p className="text-xs text-gray-400">{msg.time}</p>
          {msg.usedAI && (
            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <MdAutoAwesome className="text-xs" /> Claude AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({ msg }) => (
  <div className="flex gap-3 items-start justify-end">
    <div className="max-w-[75%]">
      <div className="bg-primary-600 rounded-2xl rounded-tr-sm px-4 py-3">
        <p className="text-sm text-white">{msg.text}</p>
      </div>
      <p className="text-xs text-gray-400 mt-1 mr-1 text-right">{msg.time}</p>
    </div>
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
      <MdPerson className="text-gray-600 text-sm" />
    </div>
  </div>
);

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'bot', time: 'Now',
      text: "👋 Hi! I'm your AI Billing Assistant. I can help you check stock, view sales, find pending payments, and much more!\n\nTry asking me something or use the quick suggestions below.",
      data: null,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text: msg, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history in Claude API format (last 6 exchanges)
      const history = messages
        .filter(m => m.role !== 'bot' || m.id !== 1) // skip welcome msg
        .slice(-6)
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

      const { data } = await chatbotService.chat(msg, history);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: data.reply, data: data.data,
        usedAI: data.usedAI,
        time: getTime(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: '❌ Sorry, I ran into an error. Please try again.',
        data: null, time: getTime(),
      }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] fade-in">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
          <MdSmartToy className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">AI Billing Bot <MdAutoAwesome className="text-yellow-500" /></h2>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><p className="text-sm text-gray-500">Online · Ready to help</p></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map(msg => (
          msg.role === 'bot'
            ? <BotMessage key={msg.id} msg={msg} />
            : <UserMessage key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <MdSmartToy className="text-white text-sm" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-full transition-all">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="card py-3 flex items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me anything about your business..."
          className="flex-1 border-0 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <MdSend className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
