import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, documentType: string, documentUrl: string) {
    const existing = await this.prisma.kyc.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('KYC déjà soumis');

    const kyc = await this.prisma.kyc.create({
      data: { userId, documentType, documentUrl },
    });

    await this.prisma.user.update({ where: { id: userId }, data: { kycStatus: 'PENDING' } });
    return kyc;
  }

  async getMyKyc(userId: string) {
    const kyc = await this.prisma.kyc.findUnique({ where: { userId } });
    if (!kyc) throw new NotFoundException('Aucun KYC soumis');
    return kyc;
  }

  async findAll() {
    return this.prisma.kyc.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(id: string, status: 'VERIFIED' | 'REJECTED') {
    const kyc = await this.prisma.kyc.findUnique({ where: { id } });
    if (!kyc) throw new NotFoundException('KYC introuvable');

    await this.prisma.kyc.update({ where: { id }, data: { status } });
    await this.prisma.user.update({ where: { id: kyc.userId }, data: { kycStatus: status } });

    await this.prisma.notification.create({
      data: {
        userId: kyc.userId,
        title: 'Résultat KYC',
        message: status === 'VERIFIED'
          ? 'Votre vérification d\'identité a été approuvée.'
          : 'Votre vérification d\'identité a été rejetée. Veuillez soumettre à nouveau.',
      },
    });

    return { message: `KYC ${status}` };
  }
}
