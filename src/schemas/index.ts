import { z } from 'zod';

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const twoFASchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'Solo se permiten números'),
});
export type TwoFASchema = z.infer<typeof twoFASchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
    new_password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm_password: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  });
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// ─── Projects ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  unit_id: z.number().optional(),
});
export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

// ─── Tasks ────────────────────────────────────────────────────────────────────

const taskStatusValues = ['todo', 'in_progress', 'review', 'done'] as const;
const taskPriorityValues = ['low', 'medium', 'high', 'urgent'] as const;

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  status: z.enum(taskStatusValues).default('todo'),
  priority: z.enum(taskPriorityValues).default('medium'),
  responsible: z.string().max(150, 'Máximo 150 caracteres').optional(),
  due_date: z.string().optional(),
});
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  responsible: z.string().max(150).optional(),
  due_date: z.string().optional(),
});
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;

// ─── Users ────────────────────────────────────────────────────────────────────

const roleValues = ['super_admin', 'admin', 'user'] as const;

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres'),
  role: z.enum(roleValues),
  unit_id: z.number().optional(),
});
export type CreateUserSchema = z.infer<typeof createUserSchema>;

// ─── Units ────────────────────────────────────────────────────────────────────

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(150, 'Máximo 150 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido')
    .default('#6366f1'),
  emoji: z
    .string()
    .min(1, 'El emoji es requerido')
    .max(8, 'Emoji inválido')
    .default('🏛️'),
});
export type CreateUnitSchema = z.infer<typeof createUnitSchema>;
