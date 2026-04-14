import { z } from 'zod';

// 1. Esquema base sin refinamientos para permitir .partial()
const userBaseObject = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  role: z.enum(['admin', 'manager', 'teacher', 'student', 'marketing']),
  level_ids: z.array(z.number()).optional(),
  module_ids: z.array(z.number()).optional(),
});


// 2. Esquema para CREACIÓN con refinamientos
export const createUserSchema = userBaseObject.refine((data) => {
  if (data.role === 'student' && (!data.level_ids || data.level_ids.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Los estudiantes deben tener al menos un nivel académico asignado',
  path: ['level_ids'],
}).refine((data) => {
  if (data.role === 'teacher' && (!data.module_ids || data.module_ids.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Los profesores deben tener al menos un módulo asignado',
  path: ['module_ids'],
});

// 3. Esquema para ACTUALIZACIÓN (parcial)
// Nota: partial() se aplica sobre el objeto base, no sobre el esquema refinado
export const updateUserSchema = userBaseObject.partial().extend({
  password: z.string().min(4).optional(),
});

