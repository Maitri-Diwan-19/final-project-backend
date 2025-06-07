import Joi from 'joi';

export const registrationSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Username is required',
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/@gmail\.com$/, 'gmail domain')
    .required()
    .messages({
      'string.email': 'Invalid email',
      'string.pattern.name': 'Only Gmail emails are allowed',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(6)
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/\d/, 'number')
    .pattern(/[\W_]/, 'special')
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.pattern.name': 'Password must include {#name} character',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Confirm password is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Invalid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const activationSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Activation token is required',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Invalid email',
      'any.required': 'Email is required',
    }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/\d/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.name': 'Must include a {#name} character',
      'any.required': 'Password is required',
    }),
});
