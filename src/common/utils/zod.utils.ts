import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li'],
  allowedAttributes: { 'a': ['href'] }
};

export const zSafeString = (schema: z.ZodString = z.string()) => {

  return schema.transform((val) => (val ? sanitizeHtml(val, sanitizeOptions) : val));
};