'use client';

import { useState } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function OtpInput({ value, onChange, disabled, placeholder = "Enter 6-digit code" }: OtpInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        const newValue = e.target.value.replace(/\D/g, '').slice(0, 6);
        onChange(newValue);
      }}
      placeholder={placeholder}
      maxLength={6}
      disabled={disabled}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
