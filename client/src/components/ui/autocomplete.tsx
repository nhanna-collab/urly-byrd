import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  required?: boolean;
  "data-testid"?: string;
  className?: string;
}

export function Autocomplete({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  required,
  "data-testid": testId,
  className,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onValueChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    if (!open && newValue) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (inputValue || options.length > 0) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            required={required}
            data-testid={testId}
            autoComplete="off"
            className={className}
          />
        </div>
      </PopoverTrigger>
      {(filteredOptions.length > 0 || inputValue) && (
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              {filteredOptions.length === 0 && inputValue ? (
                <CommandEmpty>
                  Press Enter to add "{inputValue}"
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
