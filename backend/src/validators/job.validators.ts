import { z } from 'zod';
import { JobStatus } from '@livin/common';

const jobStatuses: [JobStatus, ...JobStatus[]] = ["pending", "accepted", "in_progress", "completed", "cancelled"];

const legacyPaymentMethods = ['Cash', 'Bank Transfer', 'PayPal', 'Bit', 'PayBox'] as const;
const paymentMethodEnums = ['cash', 'bank_transfer', 'bit', 'paybox', 'check', 'paypal'] as const;
const paymentRateTypes = ['hourly', 'daily', 'weekly'] as const;
const currencies = ['ILS', 'USD', 'EUR'] as const;
const serviceTypes = ['feeding', 'walking', 'watering_plants', 'cleaning', 'stray_care', 'other'] as const;
const friendlinessValues = ['friendly', 'cautious', 'unknown'] as const;

const uniqueStringArray = z.array(z.string()).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: 'Array must contain unique values' },
);

export const createJobSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    // Location
    locationLat: z.number().optional(),
    locationLng: z.number().optional(),
    locationAddress: z.string().optional(),
    locationCity: z.string().optional(),
    locationCountry: z.string().optional(),
    // Job Post Mode payment
    paymentMethod: z.enum(legacyPaymentMethods).optional(),
    paymentRateType: z.enum(paymentRateTypes).optional(),
    paymentAmount: z.number().min(0).optional(),
    paymentCurrency: z.string().min(1).optional(),
    // Swipe Mode payment
    paymentMethodList: z.array(z.enum(paymentMethodEnums)).optional(),
    currency: z.enum(currencies).optional(),
    minPayment: z.number().min(0).optional(),
    maxPayment: z.number().min(0).optional(),
    // Swipe-job-specific
    isSwipeJob: z.boolean().optional().default(false),
    services: z.array(z.enum(serviceTypes)).optional(),
    estimatedHours: z.number().min(0).optional(),
    behaviorNotes: z.string().optional(),
    friendliness: z.enum(friendlinessValues).optional(),
    // Care items
    petIds: uniqueStringArray.optional(),
    plantIds: uniqueStringArray.optional(),
    strayAnimalIds: uniqueStringArray.optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    locationLat: z.number().optional(),
    locationLng: z.number().optional(),
    locationAddress: z.string().optional(),
    locationCity: z.string().optional(),
    locationCountry: z.string().optional(),
    paymentMethod: z.enum(legacyPaymentMethods).optional(),
    paymentRateType: z.enum(paymentRateTypes).optional(),
    paymentAmount: z.number().min(0).optional(),
    paymentCurrency: z.string().min(1).optional(),
    paymentMethodList: z.array(z.enum(paymentMethodEnums)).optional(),
    currency: z.enum(currencies).optional(),
    minPayment: z.number().min(0).optional(),
    maxPayment: z.number().min(0).optional(),
    services: z.array(z.enum(serviceTypes)).optional(),
    estimatedHours: z.number().min(0).optional(),
    behaviorNotes: z.string().optional(),
    friendliness: z.enum(friendlinessValues).optional(),
    status: z.enum(jobStatuses).optional(),
    petIds: uniqueStringArray.optional(),
    plantIds: uniqueStringArray.optional(),
    strayAnimalIds: uniqueStringArray.optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const jobFilterSchema = z.object({
    status: z.enum(jobStatuses).optional(),
    search: z.string().min(1).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    petTypes: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "petTypes must contain unique values",
    }).optional(),
    plantTypes: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "plantTypes must contain unique values",
    }).optional(),
    strayAnimalTypes: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "strayAnimalTypes must contain unique values",
    }).optional(),
    startDateFrom: z.iso.datetime().optional(),
    startDateTo: z.iso.datetime().optional(),
    endDateFrom: z.iso.datetime().optional(),
    endDateTo: z.iso.datetime().optional(),
    locationLat: z.number().optional(),
    locationLng: z.number().optional(),
    locationRadius: z.number().min(0).optional(),
});
