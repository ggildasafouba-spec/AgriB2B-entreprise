import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un article (admin)
   */
  async createArticle(data: {
    title: string;
    summary: string;
    content?: string;
    category: string;
    source?: string;
    sourceUrl?: string;
    imageUrl?: string;
  }, authorId: string) {
    return this.prisma.notification.create({
      data: {
        userId: authorId, // On réutilise le modèle notification comme stockage temporaire
        title: `[ARTICLE] ${data.title}`,
        message: JSON.stringify(data),
      },
    });
    // Note: Idéalement on ajouterait un modèle Article dédié en BDD.
    // Pour l'instant on stocke dans un fichier JSON côté serveur.
  }

  /**
   * Récupérer tous les articles
   */
  async getArticles() {
    // Récupérer les articles stockés
    const articles = await this.prisma.notification.findMany({
      where: { title: { startsWith: '[ARTICLE]' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return articles.map(a => {
      try {
        const data = JSON.parse(a.message);
        return {
          id: a.id,
          title: data.title,
          summary: data.summary,
          content: data.content || '',
          category: data.category,
          source: data.source || '',
          sourceUrl: data.sourceUrl || '',
          imageUrl: data.imageUrl || '',
          createdAt: a.createdAt,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Supprimer un article (admin)
   */
  async deleteArticle(id: string) {
    const article = await this.prisma.notification.findUnique({ where: { id } });
    if (!article || !article.title.startsWith('[ARTICLE]')) {
      throw new NotFoundException('Article introuvable');
    }
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Article supprimé' };
  }
}
