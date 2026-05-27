import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // ─── Crée ou récupère une conversation basée sur l interlocuteur ───────────
  async createConversation(userId: string, participantId: string, orderId?: string) {
    if (userId === participantId) throw new ForbiddenException('Vous ne pouvez pas démarrer une conversation avec vous-même');

    const participant = await this.prisma.user.findUnique({ where: { id: participantId } });
    if (!participant) throw new NotFoundException('Utilisateur introuvable');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    return {
      id: participant.id,
      participants: [user, { id: participant.id, name: participant.name, role: participant.role }],
      messages: [],
      orderId: orderId || null,
    };
  }

  // ─── Envoyer un message ────────────────────────────────────────────────────
  async send(senderId: string, receiverId: string, content: string, orderId?: string) {
    if (!receiverId) throw new NotFoundException('Destinataire introuvable');
    if (senderId === receiverId) throw new ForbiddenException('Vous ne pouvez pas vous envoyer un message');

    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('Destinataire introuvable');

    const message = await this.prisma.message.create({
      data: { senderId, receiverId, content, orderId: orderId || null },
      include: {
        sender:   { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });

    // Notification au destinataire
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        title: `💬 Message de ${message.sender.name}`,
        message: content.length > 80 ? content.slice(0, 80) + '…' : content,
      },
    });

    return message;
  }

  // ─── Conversations de l'utilisateur ───────────────────────────────────────
  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender:   { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Set<string>();
    const conversations: any[] = [];

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const other = msg.senderId === userId ? msg.receiver : msg.sender;
        const unread = await this.prisma.message.count({
          where: { senderId: otherId, receiverId: userId, read: false },
        });
        const lastMessage = {
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt,
          fromMe: msg.senderId === userId,
        };

        conversations.push({
          id: other.id,
          participants: [
            { id: userId, name: msg.senderId === userId ? msg.sender.name : msg.receiver.name, role: msg.senderId === userId ? msg.sender.role : msg.receiver.role },
            { id: other.id, name: other.name, role: other.role },
          ],
          messages: [lastMessage],
          contact: other,
          lastMessage,
          unread,
        });
      }
    }

    return conversations;
  }

  // ─── Messages d'une conversation ──────────────────────────────────────────
  async getThread(userId: string, otherId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId,  receiverId: otherId },
          { senderId: otherId, receiverId: userId  },
        ],
      },
      include: {
        sender:   { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { senderId: otherId, receiverId: userId, read: false },
      data: { read: true },
    });

    return messages;
  }

  // ─── Messages liés à une commande ─────────────────────────────────────────
  async getOrderMessages(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.message.findMany({
      where: { orderId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Nombre de messages non lus ───────────────────────────────────────────
  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, read: false },
    });
    return { count };
  }
}
