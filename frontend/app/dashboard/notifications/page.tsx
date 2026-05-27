'use client';
import { useEffect, useState } from 'react';
import { notificationsApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsApi.getAll()
      .then(res => setNotifications(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    toast.success('Toutes les notifications marquées comme lues');
    load();
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unread > 0 && <p className="text-sm text-gray-500">{unread} non lue{unread > 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl shadow p-4 flex items-start gap-4 ${!n.read ? 'border-l-4 border-green-500' : ''}`}
            >
              <Bell className={`w-5 h-5 mt-0.5 ${n.read ? 'text-gray-400' : 'text-green-600'}`} />
              <div className="flex-1">
                <p className={`font-medium ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-green-600 hover:underline"
                >
                  Marquer lu
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
