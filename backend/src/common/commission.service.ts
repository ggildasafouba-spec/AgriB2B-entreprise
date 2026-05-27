import { Injectable } from '@nestjs/common';

/**
 * Commission Service
 * Calculates platform commission based on account type and role
 */
@Injectable()
export class CommissionService {
  /**
   * Get commission rate based on account type
   * - INDIVIDUAL (particuliers): 5%
   * - COMPANY (entreprises): 10%
   * - TRANSPORTER: 3%
   */
  getCommissionRate(accountType: 'INDIVIDUAL' | 'COMPANY', role?: string): number {
    if (role === 'TRANSPORTER') {
      return 0.03; // 3% for transporters
    }

    if (accountType === 'COMPANY') {
      return 0.10; // 10% for companies
    }

    return 0.05; // 5% for individuals
  }

  /**
   * Calculate commission amount
   */
  calculateCommission(amount: number, rate: number): number {
    return amount * rate;
  }

  /**
   * Calculate seller amount after commission
   */
  calculateSellerAmount(amount: number, rate: number): number {
    return amount * (1 - rate);
  }

  /**
   * Get commission details for an order
   */
  getCommissionDetails(
    totalAmount: number,
    accountType: 'INDIVIDUAL' | 'COMPANY',
    role?: string,
  ) {
    const rate = this.getCommissionRate(accountType, role);
    const commission = this.calculateCommission(totalAmount, rate);
    const sellerAmount = this.calculateSellerAmount(totalAmount, rate);

    return {
      totalAmount,
      rate: `${(rate * 100).toFixed(1)}%`,
      rateDecimal: rate,
      commission,
      sellerAmount,
    };
  }
}
