"use client"

interface ToggleSwitchProps {
  isOn: boolean
  onChange: (isOn: boolean) => void
  disabled?: boolean
}

export function ToggleSwitch({ isOn, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!isOn)}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        isOn 
          ? "bg-primary" 
          : "bg-gray-300 dark:bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
          isOn ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  )
}
