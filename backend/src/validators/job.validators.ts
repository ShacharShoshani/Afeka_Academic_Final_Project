import { z } from 'zod';
import { JobStatus } from '@livin/common';

const jobStatuses: [JobStatus, ...JobStatus[]] = ["pending", "accepted", "completed", "cancelled"];

export const createJobSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime(),
    locationLat: z.number(),
    locationLng: z.number(),
    paymentMethod: z.string().min(1),
    paymentAmount: z.number().min(0),
    paymentCurrency: z.string().min(1),
    petIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "petIds must contain unique values",
    }).optional(),
    plantIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "plantIds must contain unique values",
    }).optional(),
    strayAnimalIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "strayAnimalIds must contain unique values",
    }).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    locationLat: z.number().optional(),
    locationLng: z.number().optional(),
    paymentMethod: z.string().min(1).optional(),
    paymentAmount: z.number().min(0).optional(),
    paymentCurrency: z.string().min(1).optional(),
    petIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "petIds must contain unique values",
    }).optional(),
    plantIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "plantIds must contain unique values",
    }).optional(),
    strayAnimalIds: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, {
        message: "strayAnimalIds must contain unique values",
    }).optional(),
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
