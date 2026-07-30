import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const shippingUpdateSchema = baseTemplateSchema
  .extend({
    orderNumber: z.string().min(1),
    status: z.enum(['dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'exception']),
    carrier: z.string().min(1),
    trackingNumber: z.string().min(1),
    trackingUrl: z.url(),
    /** Absent once delivered. Required while the parcel is still moving. */
    expectedOn: z.iso.date().optional(),
    deliveredAt: z.iso.datetime().optional(),
    itemCount: z.number().int().positive(),
    /** Only meaningful for delayed or exception states. */
    reason: z.string().optional(),
  })
  .refine((value) => value.status !== 'delivered' || Boolean(value.deliveredAt), {
    message: 'deliveredAt is required when status is "delivered"',
    path: ['deliveredAt'],
  })
  .refine((value) => value.status === 'delivered' || Boolean(value.expectedOn), {
    message: 'expectedOn is required until the parcel is delivered',
    path: ['expectedOn'],
  });

export type ShippingUpdateProps = z.infer<typeof shippingUpdateSchema>;
