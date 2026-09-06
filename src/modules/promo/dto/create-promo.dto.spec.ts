import { CreatePromoDto, createPromoSchema } from './create-promo.dto';

describe('CreatePromoDto', () => {
  it('should successfully parse valid ISO datetime strings into Date objects', () => {
    const rawData = {
      promoCode: 'SUMMER2026',
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      usageLimit: 100,
      startsAt: '2026-06-01T00:00:00.000Z',
      expiresAt: '2026-06-30T23:59:59+03:00',
    };

    const parsed = createPromoSchema.parse(rawData);

    expect(parsed.promoCode).toBe('SUMMER2026');
    expect(parsed.discountType).toBe('PERCENTAGE');
    expect(parsed.startsAt).toBeInstanceOf(Date);
    expect(parsed.expiresAt).toBeInstanceOf(Date);
  });

  it('should generate valid OpenAPI metadata without throwing', () => {
    expect(() => {
      const metadata = (CreatePromoDto as any)._OPENAPI_METADATA_FACTORY();
      expect(metadata).toHaveProperty('startsAt');
      expect(metadata).toHaveProperty('expiresAt');
      expect(metadata.startsAt.type).toBe('string');
      expect(metadata.startsAt.format).toBe('date-time');
    }).not.toThrow();
  });
});
