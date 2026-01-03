// src/utils/validators.js

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email format';
    return null;
  },

  password: (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  },

  phone: (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Invalid phone number (10 digits required)';
    return null;
  },

  enrollmentNumber: (enrollment) => {
    if (!enrollment) return 'Enrollment number is required';
    if (enrollment.length < 5) return 'Invalid enrollment number';
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (!value || value.toString().trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  fileSize: (file, maxSize = 10 * 1024 * 1024) => {
    if (!file) return 'File is required';
    if (file.size > maxSize) {
      return `File size must not exceed ${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
    }
    return null;
  },

  fileType: (file, allowedTypes = []) => {
    if (!file) return 'File is required';
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }
    return null;
  },

  validateForm: (formData, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = formData[field];
      
      for (let rule of fieldRules) {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};