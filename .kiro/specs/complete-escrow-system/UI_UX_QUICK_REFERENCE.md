# UI/UX Components Quick Reference

## Quick Start

Import components from the UI library:
```tsx
import { 
  LoadingState, 
  ErrorMessage, 
  SuccessAnimation,
  EnhancedButton,
  FormField,
  Input
} from '@/components/ui'
```

Import hooks:
```tsx
import { useEnhancedToast } from '@/hooks/useToast'
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'
```

## Common Patterns

### 1. Form with Validation
```tsx
const [value, setValue] = useState('')
const [error, setError] = useState('')

<FormField label="Wallet Address" error={error} required>
  <Input
    value={value}
    onChange={(e) => {
      setValue(e.target.value)
      setError('') // Clear error on change
    }}
    error={!!error}
    placeholder="Enter wallet address"
  />
</FormField>
```

### 2. Button with Loading State
```tsx
const [loading, setLoading] = useState(false)

<EnhancedButton
  variant="primary"
  loading={loading}
  loadingText="Processing..."
  onClick={handleSubmit}
>
  Submit
</EnhancedButton>
```

### 3. Success Animation
```tsx
const [showSuccess, setShowSuccess] = useState(false)

// After successful operation
setShowSuccess(true)
setTimeout(() => {
  router.push('/next-page')
}, 2000)

// In JSX
<SuccessAnimation
  show={showSuccess}
  title="Success!"
  message="Operation completed"
  icon="check"
/>
```

### 4. Error Handling
```tsx
const toast = useEnhancedToast()

try {
  await operation()
  toast.success('Success!')
} catch (error) {
  toast.handleError(error, 'Operation failed')
}
```

### 5. Page Loading
```tsx
if (loading) {
  return <PageLoadingSkeleton />
}

if (error) {
  return (
    <ErrorMessage
      type="error"
      title="Error"
      message={error}
      action={{ label: 'Retry', onClick: retry }}
    />
  )
}
```

### 6. Optimistic Update
```tsx
const { data, update } = useOptimisticUpdate(initialData)

const handleUpdate = async () => {
  await update(
    { ...data, status: 'updated' }, // Optimistic value
    async () => await apiCall() // Actual operation
  )
}
```

## Component Cheat Sheet

### LoadingState
```tsx
<LoadingState variant="spinner" size="md" text="Loading..." />
<LoadingState variant="dots" size="lg" />
<LoadingState variant="pulse" fullScreen />
```

### ErrorMessage
```tsx
<ErrorMessage
  type="error" // or "warning" or "info"
  title="Error Title"
  message="Error description"
  details="Technical details"
  dismissible
  action={{ label: 'Retry', onClick: retry }}
/>
```

### EnhancedButton
```tsx
<EnhancedButton
  variant="primary" // primary, secondary, success, danger, warning, ghost
  size="md" // sm, md, lg
  loading={false}
  icon={<Icon />}
  iconPosition="left" // or "right"
  fullWidth
>
  Button Text
</EnhancedButton>
```

### FormField + Input
```tsx
<FormField
  label="Field Label"
  error="Error message"
  success="Success message"
  hint="Helper text"
  required
>
  <Input
    value={value}
    onChange={onChange}
    error={!!error}
    success={!!success}
    icon={<Icon />}
    placeholder="Placeholder"
  />
</FormField>
```

### ProgressIndicator
```tsx
<ProgressIndicator
  current={3}
  total={5}
  variant="bar" // bar, circle, steps
  size="md"
  label="Progress"
  showPercentage
/>
```

## Toast Patterns

```tsx
const toast = useEnhancedToast()

// Success
toast.success('Operation successful')

// Error with auto-formatting
toast.handleError(error, 'Fallback message')

// Loading
const id = toast.loading('Processing...')
// Later...
toast.dismiss(id)

// Promise-based
toast.promise(
  asyncOperation(),
  {
    loading: 'Processing...',
    success: 'Done!',
    error: 'Failed'
  }
)
```

## Animation Tips

1. **Keep animations short** (200-500ms for most)
2. **Use spring physics** for natural feel
3. **Provide reduced motion support**
4. **Don't block user interaction**

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Error messages announced to screen readers
- [ ] Color not sole indicator of state
- [ ] Sufficient color contrast
- [ ] Loading states announced

## Performance Tips

1. **Use skeleton screens** instead of spinners for initial loads
2. **Implement optimistic updates** for better perceived performance
3. **Debounce validation** to reduce re-renders
4. **Lazy load** heavy components
5. **Use CSS transforms** for animations (hardware accelerated)

## Common Mistakes to Avoid

❌ **Don't:**
- Block UI during loading without feedback
- Show generic error messages
- Redirect immediately after success
- Use toast for form validation errors
- Nest loading states

✅ **Do:**
- Show loading indicators for all async operations
- Provide specific, actionable error messages
- Celebrate successes with animations
- Use inline errors for form fields
- Use optimistic updates where appropriate
