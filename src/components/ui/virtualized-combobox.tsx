import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";

export type VirtualizedOption = {
  value: string;
  label: string;
  meta?: Record<string, any>; // arbitrary metadata for tooltip rendering
};

interface VirtualizedCommandProps {
  height: string;
  options: VirtualizedOption[];
  placeholder: string;
  selectedOption: string;
  onSelectOption?: (option: string) => void;
  getOptionTooltip?: (option: VirtualizedOption) => React.ReactNode;
}

const VirtualizedCommand = ({
  height,
  options,
  placeholder,
  selectedOption,
  onSelectOption,
  getOptionTooltip,
}: VirtualizedCommandProps) => {
  const [filteredOptions, setFilteredOptions] =
    React.useState<VirtualizedOption[]>(options);

  // Keep internal filtered list in sync when external options change
  React.useEffect(() => {
    setFilteredOptions(options);
  }, [options]);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [isKeyboardNavActive, setIsKeyboardNavActive] = React.useState(false);

  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  const virtualOptions = virtualizer.getVirtualItems();

  const scrollToIndex = (index: number) => {
    virtualizer.scrollToIndex(index, {
      align: "center",
    });
  };

  const handleSearch = (search: string) => {
    setIsKeyboardNavActive(false);
    setFilteredOptions(
      options.filter((option) =>
        option.value.toLowerCase().includes(search.toLowerCase() ?? [])
      )
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setIsKeyboardNavActive(true);
        setFocusedIndex((prev) => {
          const newIndex =
            prev === -1 ? 0 : Math.min(prev + 1, filteredOptions.length - 1);
          scrollToIndex(newIndex);
          return newIndex;
        });
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setIsKeyboardNavActive(true);
        setFocusedIndex((prev) => {
          const newIndex =
            prev === -1 ? filteredOptions.length - 1 : Math.max(prev - 1, 0);
          scrollToIndex(newIndex);
          return newIndex;
        });
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (filteredOptions[focusedIndex]) {
          onSelectOption?.(filteredOptions[focusedIndex].value);
        }
        break;
      }
      default:
        break;
    }
  };

  React.useEffect(() => {
    if (selectedOption) {
      const option = filteredOptions.find(
        (option) => option.value === selectedOption
      );
      if (option) {
        const index = filteredOptions.indexOf(option);
        setFocusedIndex(index);
        virtualizer.scrollToIndex(index, {
          align: "center",
        });
      }
    }
  }, [selectedOption, filteredOptions, virtualizer]);

  return (
    <TooltipProvider delayDuration={150}>
      <Command shouldFilter={false} onKeyDown={handleKeyDown}>
        <CommandInput onValueChange={handleSearch} placeholder={placeholder} />
        <CommandList
          ref={parentRef}
          style={{
            height: height,
            width: "100%",
            overflow: "auto",
          }}
          onMouseDown={() => setIsKeyboardNavActive(false)}
          onMouseMove={() => setIsKeyboardNavActive(false)}
        >
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualOptions.map((virtualOption) => {
                const opt = filteredOptions[virtualOption.index];
                const item = (
                  <CommandItem
                    key={opt.value}
                    disabled={isKeyboardNavActive}
                    className={cn(
                      "absolute left-0 top-0 w-full bg-transparent",
                      focusedIndex === virtualOption.index &&
                        "bg-accent text-accent-foreground",
                      isKeyboardNavActive &&
                        focusedIndex !== virtualOption.index &&
                        "aria-selected:bg-transparent aria-selected:text-primary"
                    )}
                    style={{
                      height: `${virtualOption.size}px`,
                      transform: `translateY(${virtualOption.start}px)`,
                    }}
                    value={opt.value}
                    onMouseEnter={() =>
                      !isKeyboardNavActive &&
                      setFocusedIndex(virtualOption.index)
                    }
                    onMouseLeave={() =>
                      !isKeyboardNavActive && setFocusedIndex(-1)
                    }
                    onSelect={onSelectOption}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedOption === opt.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                );
                if (!getOptionTooltip) return item;
                return (
                  <Tooltip key={opt.value}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      {getOptionTooltip(opt)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CommandGroup>
        </CommandList>
      </Command>
    </TooltipProvider>
  );
};

interface VirtualizedComboboxProps {
  options: (string | VirtualizedOption)[];
  searchPlaceholder?: string;
  width?: string;
  height?: string;
  onSelectOption?: (option: string) => void;
  className?: string;
  initialSelectedOption?: string;
  getOptionTooltip?: (option: VirtualizedOption) => React.ReactNode;
}

export function VirtualizedCombobox({
  options,
  searchPlaceholder = "Search items...",
  onSelectOption,
  width = "400px",
  height = "400px",
  className,
  initialSelectedOption = "",
  getOptionTooltip,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState(
    initialSelectedOption
  );

  const optionObjects: VirtualizedOption[] = React.useMemo(
    () =>
      options.map((o) =>
        typeof o === "string"
          ? { value: o, label: o }
          : { value: o.value, label: o.label }
      ),
    [options]
  );

  // Sync internal selection if initialSelectedOption changes (controlled-like)
  React.useEffect(() => {
    setSelectedOption((prev) =>
      prev === initialSelectedOption ? prev : initialSelectedOption
    );
  }, [initialSelectedOption]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          size={"sm"}
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <span className="max-w-[150px] truncate">
            {selectedOption
              ? optionObjects.find((o) => o.value === selectedOption)?.label
              : searchPlaceholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: width }}>
        <VirtualizedCommand
          height={height}
          options={optionObjects}
          placeholder={searchPlaceholder}
          selectedOption={selectedOption}
          onSelectOption={(currentValue) => {
            setSelectedOption(
              currentValue === selectedOption ? "" : currentValue
            );
            onSelectOption?.(currentValue);
            setOpen(false);
          }}
          getOptionTooltip={getOptionTooltip}
        />
      </PopoverContent>
    </Popover>
  );
}
