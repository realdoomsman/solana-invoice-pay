'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { InlineError } from './ErrorMessage'
import { InlineSuccess } from './SuccessAnimation'

interface FormFieldProps {
  label: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FormField({ label, error, success, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <InlineError message={error} />
          </motion.div>
        )}
        {success && !error && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <InlineSuccess message={success} />
          </motion.div>
        )}
      </AnimatePresence>
      {hint && !error && !success && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  icon?: ReactNode
}

export function Input({ error, success, icon, className = '', ...props }: InputProps) {
  const borderColor = error 
    ? 'border-red-500 focus:ring-red-500' 
    : success 
    ? 'border-green-500 focus:ring-green-500'
    : 'border-slate-600 focus:ring-blue-500'

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={`
          w-full px-4 py-3 ${icon ? 'pl-10' : ''}
          bg-slate-800 border ${borderColor}
          rounded-lg text-white
          focus:ring-2 focus:outline-none
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          placeholder:text-slate-500
          ${className}
        `}
        {...props}
      />
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

export function Textarea({ error, success, className = '', ...props }: TextareaProps) {
  const borderColor = error 
    ? 'border-red-500 focus:ring-red-500' 
    : success 
    ? 'border-green-500 focus:ring-green-500'
    : 'border-slate-600 focus:ring-blue-500'

  return (
    <textarea
      className={`
        w-full px-4 py-3
        bg-slate-800 border ${borderColor}
        rounded-lg text-white
        focus:ring-2 focus:outline-none
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        placeholder:text-slate-500
        resize-none
        ${className}
      `}
      {...props}
    />
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  success?: boolean
  options: { value: string; label: string }[]
}

export function Select({ error, success, options, className = '', ...props }: SelectProps) {
  const borderColor = error 
    ? 'border-red-500 focus:ring-red-500' 
    : success 
    ? 'border-green-500 focus:ring-green-500'
    : 'border-slate-600 focus:ring-blue-500'

  return (
    <select
      className={`
        w-full px-4 py-3
        bg-slate-800 border ${borderColor}
        rounded-lg text-white
        focus:ring-2 focus:outline-none
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 pt-4">
      {children}
    </div>
  )
}
