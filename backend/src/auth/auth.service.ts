import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, VerifyCodeDto } from './dto/auth.dto';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  // ─── Génère un code OTP à 6 chiffres ───────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── Envoi du code OTP via SMS (ou console en dev) ──────────────────────────
  private async sendVerificationCode(phone: string, email: string, code: string, name: string) {
    // Envoie le SMS via le provider configuré (console en dev, Africa's Talking/Twilio en prod)
    await this.smsService.sendOtp(phone || email, code, name);
  }

  // ─── Indique si on est en mode développement ────────────────────────────────
  // Retourne true si on doit exposer le code OTP dans la réponse
  // (quand aucun vrai service SMS n'est configuré)
  private get shouldExposeOtp(): boolean {
    const smsProvider = process.env.SMS_PROVIDER || 'console';
    return smsProvider === 'console';
  }

  // ─── Inscription ────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);
    const code = this.generateOtp();
    const exp = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Quantité minimale : 10 pour les particuliers vendeurs, 1 sinon
    const minOrderQty =
      dto.role === 'SELLER' && dto.accountType === 'INDIVIDUAL'
        ? dto.minOrderQty ?? 10
        : dto.minOrderQty ?? 1;

    // Documents entreprise — optionnels pour l'instant
    // if (dto.accountType === 'COMPANY' && (!dto.documentType || !dto.documentUrl)) {
    //   throw new BadRequestException('Les documents de l\'entreprise sont requis pour l\'inscription.');
    // }

    await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        role: dto.role as any,
        accountType: dto.accountType as any,
        phone: dto.phone,
        country: dto.country,
        region: dto.region,
        minOrderQty,
        isVerified: this.shouldExposeOtp ? true : false,
        verifyCode: this.shouldExposeOtp ? null : code,
        verifyCodeExp: this.shouldExposeOtp ? null : exp,
        kyc: dto.accountType === 'COMPANY' ? {
          create: {
            documentType: dto.documentType,
            documentUrl: dto.documentUrl,
            companyDocs: dto.documentUrl ? [dto.documentUrl] : [],
            status: 'PENDING',
          },
        } : undefined,
      },
    });

    // Si pas de vrai SMS configuré, on vérifie automatiquement et on retourne un token
    if (this.shouldExposeOtp) {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
      return {
        message: 'Inscription réussie. Votre compte est actif.',
        email: dto.email,
        verified: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, accountType: user.accountType },
      };
    }

    await this.sendVerificationCode(dto.phone, dto.email, code, dto.name);

    return {
      message: 'Inscription réussie. Un code de vérification a été envoyé.',
      email: dto.email,
      ...(this.shouldExposeOtp && { devOtpCode: code }),
    };
  }

  // ─── Vérification OTP ───────────────────────────────────────────────────────
  async verifyCode(dto: VerifyCodeDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');
    if (user.isVerified) throw new BadRequestException('Compte déjà vérifié');
    if (!user.verifyCode || user.verifyCode !== dto.code) {
      throw new BadRequestException('Code incorrect');
    }
    if (user.verifyCodeExp && user.verifyCodeExp < new Date()) {
      throw new BadRequestException('Code expiré. Veuillez demander un nouveau code.');
    }

    const updated = await this.prisma.user.update({
      where: { email: dto.email },
      data: { isVerified: true, verifyCode: null, verifyCodeExp: null },
    });

    const token = this.jwtService.sign({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    });

    return {
      token,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        accountType: updated.accountType,
      },
    };
  }

  // ─── Renvoi du code OTP ─────────────────────────────────────────────────────
  async resendCode(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');
    if (user.isVerified) throw new BadRequestException('Compte déjà vérifié');

    const code = this.generateOtp();
    const exp = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { verifyCode: code, verifyCodeExp: exp },
    });

    await this.sendVerificationCode(user.phone || '', email, code, user.name);
    return {
      message: 'Nouveau code envoyé',
      ...(this.shouldExposeOtp && { devOtpCode: code }),
    };
  }

  // ─── Mot de passe oublié — envoi du code de réinitialisation ──────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Aucun compte avec cet email');

    const code = this.generateOtp();
    const exp = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.user.update({
      where: { email },
      data: { verifyCode: code, verifyCodeExp: exp },
    });

    await this.sendVerificationCode(user.phone || '', email, code, user.name);

    return {
      message: 'Un code de réinitialisation a été envoyé.',
      email,
      ...(this.shouldExposeOtp && { devOtpCode: code }),
    };
  }

  // ─── Réinitialisation du mot de passe ───────────────────────────────────────
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');
    if (!user.verifyCode || user.verifyCode !== code) {
      throw new BadRequestException('Code incorrect');
    }
    if (user.verifyCodeExp && user.verifyCodeExp < new Date()) {
      throw new BadRequestException('Code expiré. Veuillez demander un nouveau code.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashed, verifyCode: null, verifyCodeExp: null },
    });

    return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' };
  }

  // ─── Connexion ──────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Compte non vérifié. Veuillez confirmer votre email avec le code reçu.',
      );
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountType: user.accountType,
        country: user.country,
        region: user.region,
      },
    };
  }

  // ─── Profil ─────────────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountType: true,
        phone: true,
        country: true,
        region: true,
        minOrderQty: true,
        kycStatus: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  // ─── Supprimer son propre compte ────────────────────────────────────────────
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    // Supprimer toutes les données liées
    await this.prisma.notification.deleteMany({ where: { userId } });
    await this.prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
    await this.prisma.kyc.deleteMany({ where: { userId } });
    await this.prisma.transportRate.deleteMany({ where: { transporterId: userId } });

    // Supprimer l'utilisateur
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Votre compte a été supprimé avec succès.' };
  }
}
