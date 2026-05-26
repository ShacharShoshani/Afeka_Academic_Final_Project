import { z } from 'zod';
import { Job, JobStatus } from '@livin/common';

const jobStatuses: JobStatus[] = ["open", "in_progress", "completed", "cancelled"] as const;

export const createJobSchema = z.object({
    type: "object",
    properties: {
        title: { type: "string", minLength: 1 },
        description: { type: "string", minLength: 1 },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        locationLat: { type: "number" },
        locationLng: { type: "number" },
        paymentMethod: { type: "string", minLength: 1 },
        paymentAmount: { type: "number", minimum: 0 },
        paymentCurrency: { type: "string", minLength: 1 },
        petIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
        },
        plantIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
        },
        strayAnimalIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
        },
    },
    required: ["title", "description"],
    additionalProperties: false,
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z.object({
    type: "object",
    properties: {
        title: { type: "string", minLength: 1, optional: true },
        description: { type: "string", minLength: 1, optional: true },
        startDate: { type: "string", format: "date-time", optional: true },
        endDate: { type: "string", format: "date-time", optional: true },
        locationLat: { type: "number", optional: true },
        locationLng: { type: "number", optional: true },
        paymentMethod: { type: "string", minLength: 1, optional: true },
        paymentAmount: { type: "number", minimum: 0, optional: true },
        paymentCurrency: { type: "string", minLength: 1, optional: true },
        petIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
        plantIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
        strayAnimalIds: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
    },
    additionalProperties: false,
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const jobFilterSchema = z.object({
    type: "object",
    properties: {
        status: { type: "string", enum: jobStatuses, optional: true },
        search: { type: "string", minLength: 1, optional: true },
        page: { type: "number", minimum: 1, optional: true },
        limit: { type: "number", minimum: 1, maximum: 100, optional: true },
        petTypes: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
        plantTypes: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
        strayAnimalTypes: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            optional: true
        },
        startDateFrom: { type: "string", format: "date-time", optional: true },
        startDateTo: { type: "string", format: "date-time", optional: true },
        endDateFrom: { type: "string", format: "date-time", optional: true },
        endDateTo: { type: "string", format: "date-time", optional: true },
        locationLat: { type: "number", optional: true },
        locationLng: { type: "number", optional: true },
        locationRadius: { type: "number", minimum: 0, optional: true },
    },
    additionalProperties: false,
});