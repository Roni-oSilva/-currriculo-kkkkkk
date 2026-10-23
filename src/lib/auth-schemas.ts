import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254);
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letras e números na senha.");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: emailSchema,
  password: passwordSchema,
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Informe a senha.").max(72) });
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ password: passwordSchema });
