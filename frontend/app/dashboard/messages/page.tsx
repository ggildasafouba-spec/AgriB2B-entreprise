'use client';
import React, { useEffect, useState, useRef } from 'react';
import { messagesApi, adminApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Send, MessageSquare, Search } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadContacts = async () => {
    const [convRes, usersRes] = await Promise.all([
      messagesApi.getConversations(),
      adminApi.getUsers().catch(() => ({ data: [] })),
    ]);

    const convs = convRes.data.map((conversation: any) => {
      const contact = conversation.participants.find((p: any) => p.id !== user?.id) || conversation.participants[0];
      const lastMessage = conversation.messages[0] || null;
      return {
        conversationId: conversation.id,
        contact,
        lastMessage,
      };
    });

    const others = usersRes.data.filter((u: any) => u.id !== user?.id && !convs.some((c: any) => c.contact.id === u.id));
    setConversations(convs);
    setContacts(others);
  };

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConversation) return;
    const loadMessages = async () => {
      const res = await messagesApi.getConversationMessages(activeConversation.conversationId);
      setThread(res.data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeConversation]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConversation) return;
    try {
      await messagesApi.sendMessage(activeConversation.conversationId, newMsg.trim());
      setNewMsg('');
      const res = await messagesApi.getConversationMessages(activeConversation.conversationId);
      setThread(res.data);
      loadContacts();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l envoi');
    }
  };

  const openConversation = async (contact: any) => {
    if (contact.conversationId) {
      setActiveConversation(contact);
      return;
    }

    try {
      const res = await messagesApi.createConversation(contact.id);
      const conversation = {
        conversationId: res.data.id,
        contact,
      };
      setActiveConversation(conversation);
      await loadContacts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impossible de démarrer la conversation');
    }
  };

  const filteredContacts = [
    ...conversations,
    ...contacts.map(contact => ({ conversationId: null, contact, lastMessage: null })),
  ].filter(item =>
    !search || item.contact.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Chargement...</p>
          ) : filteredContacts.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucun contact trouvé</p>
          ) : (
            filteredContacts.map(item => (
              <button
                key={item.contact.id}
                onClick={() => openConversation(item.contact)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 ${
                  activeConversation?.contact?.id === item.contact.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  item.contact.role === 'ADMIN' ? 'bg-red-500' :
                  item.contact.role === 'SELLER' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {item.contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.contact.name}</p>
                    {item.lastMessage && (
                      <span className="text-xs text-gray-400">{new Date(item.lastMessage.createdAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {item.contact.role} {item.contact.region ? `· ${item.contact.region}` : ''}
                  </p>
                  {item.lastMessage && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.lastMessage.senderId === user?.id ? 'Vous : ' : ''}{item.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            <div className="px-6 py-4 border-b flex items-center gap-3 bg-white">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                activeConversation.contact.role === 'ADMIN' ? 'bg-red-500' :
                activeConversation.contact.role === 'SELLER' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {activeConversation.contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{activeConversation.contact.name}</p>
                <p className="text-xs text-gray-500">{activeConversation.contact.role} {activeConversation.contact.region ? `· ${activeConversation.contact.region}` : ''}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
              {thread.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Envoyez votre premier message</p>
                </div>
              ) : (
                thread.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="px-4 py-3 border-t bg-white flex flex-col gap-2">
              <p className="text-xs text-gray-400 px-1">
                🔒 Pour votre sécurité, l'échange de numéros, emails ou liens externes est interdit.
              </p>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim()}
                  className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 disabled:opacity-40 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Sélectionnez un contact ou démarrez une conversation</p>
              <p className="text-sm mt-1">Toutes les discussions passent par la plateforme.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
