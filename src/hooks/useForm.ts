/**
 * useForm Hook (2.4.9)
 * Form state management with validation
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

interface FieldState<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

type FormFields<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldState<T[K]>;
};

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  schema?: z.ZodType<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormResult<T extends Record<string, unknown>> {
  // Values
  values: T;
  fields: FormFields<T>;
  errors: Partial<Record<keyof T, string>>;

  // State
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;

  // Actions
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  reset: (values?: Partial<T>) => void;
  handleSubmit: () => Promise<void>;

  // Field helpers
  getFieldProps: (field: keyof T) => {
    value: T[typeof field];
    onChangeText: (text: string) => void;
    onBlur: () => void;
  };
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const {
    initialValues,
    schema,
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  // Initialize field states
  const initializeFields = useCallback((values: T): FormFields<T> => {
    const fields = {} as FormFields<T>;
    for (const key of Object.keys(values) as (keyof T)[]) {
      fields[key] = {
        value: values[key],
        error: undefined,
        touched: false,
        dirty: false,
      };
    }
    return fields;
  }, []);

  const [fields, setFields] = useState<FormFields<T>>(() => initializeFields(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived values
  const values = useMemo(() => {
    const vals = {} as T;
    for (const key of Object.keys(fields) as (keyof T)[]) {
      vals[key] = fields[key].value;
    }
    return vals;
  }, [fields]);

  const errors = useMemo(() => {
    const errs: Partial<Record<keyof T, string>> = {};
    for (const key of Object.keys(fields) as (keyof T)[]) {
      if (fields[key].error) {
        errs[key] = fields[key].error;
      }
    }
    return errs;
  }, [fields]);

  const isDirty = useMemo(() => {
    return Object.values(fields).some((f) => (f as FieldState<unknown>).dirty);
  }, [fields]);

  const hasErrors = useMemo(() => {
    return Object.values(fields).some((f) => (f as FieldState<unknown>).error);
  }, [fields]);

  // Get Zod error for a specific field
  const getZodFieldError = (zodError: z.ZodError, field: keyof T): string | undefined => {
    const issues = zodError.issues || [];
    const fieldIssue = issues.find((issue) => issue.path[0] === field);
    return fieldIssue?.message;
  };

  // Validation
  const validateField = useCallback(
    (field: keyof T): boolean => {
      if (!schema) return true;

      const result = schema.safeParse(values);
      if (result.success) {
        setFields((prev) => ({
          ...prev,
          [field]: { ...prev[field], error: undefined },
        }));
        return true;
      }

      const fieldError = getZodFieldError(result.error, field);
      if (fieldError) {
        setFields((prev) => ({
          ...prev,
          [field]: { ...prev[field], error: fieldError },
        }));
        return false;
      }

      return true;
    },
    [schema, values]
  );

  const validate = useCallback((): boolean => {
    if (!schema) return true;

    const result = schema.safeParse(values);
    if (result.success) {
      // Clear all errors
      setFields((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated) as (keyof T)[]) {
          updated[key] = { ...updated[key], error: undefined };
        }
        return updated;
      });
      return true;
    }

    // Set errors from Zod
    setFields((prev) => {
      const updated = { ...prev };
      // Clear existing errors first
      for (const key of Object.keys(updated) as (keyof T)[]) {
        updated[key] = { ...updated[key], error: undefined };
      }
      // Set new errors
      const issues = result.error.issues || [];
      for (const issue of issues) {
        const field = issue.path[0] as keyof T;
        if (field && updated[field]) {
          updated[field] = { ...updated[field], error: issue.message };
        }
      }
      return updated;
    });
    return false;
  }, [schema, values]);

  const isValid = useMemo(() => {
    if (!schema) return true;
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  // Actions
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFields((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          value,
          dirty: value !== initialValues[field],
        },
      }));

      if (validateOnChange) {
        // Delay validation slightly to ensure state is updated
        setTimeout(() => validateField(field), 0);
      }
    },
    [initialValues, validateOnChange, validateField]
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setFields((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(newValues) as (keyof T)[]) {
          if (key in updated) {
            updated[key] = {
              ...updated[key],
              value: newValues[key] as T[typeof key],
              dirty: newValues[key] !== initialValues[key],
            };
          }
        }
        return updated;
      });
    },
    [initialValues]
  );

  const setError = useCallback((field: keyof T, error: string) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], error },
    }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], error: undefined },
    }));
  }, []);

  const setTouched = useCallback((field: keyof T, touched = true) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], touched },
    }));
  }, []);

  const reset = useCallback(
    (newValues?: Partial<T>) => {
      const resetValues = { ...initialValues, ...newValues };
      setFields(initializeFields(resetValues as T));
      setIsSubmitting(false);
    },
    [initialValues, initializeFields]
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, values]);

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: fields[field].value,
      onChangeText: (text: string) => setValue(field, text as T[typeof field]),
      onBlur: () => {
        setTouched(field);
        if (validateOnBlur) {
          validateField(field);
        }
      },
    }),
    [fields, setValue, setTouched, validateOnBlur, validateField]
  );

  return {
    values,
    fields,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    hasErrors,
    setValue,
    setValues,
    setError,
    clearError,
    setTouched,
    validate,
    validateField,
    reset,
    handleSubmit,
    getFieldProps,
  };
}

export default useForm;
