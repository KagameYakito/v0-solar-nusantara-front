'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
}

export function SearchInput({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Cari produk..." 
}: SearchInputProps) {
  return (
    <div className="flex gap-4">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
      />
      {value && (
        <Button 
          variant="outline" 
          onClick={onClear}
          className="border-slate-700"
        >
          Clear
        </Button>
      )}
    </div>
  )
}