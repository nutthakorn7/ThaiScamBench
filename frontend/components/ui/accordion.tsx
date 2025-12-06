"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    collapsible?: boolean
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, type = "single", collapsible = false, defaultValue, value: controlledValue, onValueChange, ...props }, ref) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "")
  const value = controlledValue ?? uncontrolledValue

  const handleValueChange = (newValue: string) => {
    const nextValue = value === newValue && collapsible ? "" : newValue
    setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div ref={ref} className={className} {...props} />
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  // Use data-state for styling hooks
  const { value: selectedValue } = React.useContext(AccordionContext)
  const state = selectedValue === value ? "open" : "closed"

  return (
    <div
      ref={ref}
      data-state={state}
      data-value={value}
      className={cn("border-b", className)}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value, onValueChange } = React.useContext(AccordionContext)
  // Need to find parent Item value. In a real Radix implementation this is done via context.
  // Here we'll rely on the parent Item injecting its value or we simply look it up from data-value of closest parent if we can't context it simple.
  // Actually, to keep it simple and robust without too much context nesting:
  // We can't easily get the 'value' from AccordionItem without another Context.
  // Let's create an ItemContext.
  
  return (
    <AccordionTriggerInner className={className} {...props} ref={ref}>
      {children}
    </AccordionTriggerInner>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

// Inner component to access Item context safely
const AccordionItemContext = React.createContext<{ value: string }>({ value: "" })

const AccordionItemWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(AccordionContext)
  const state = selectedValue === value ? "open" : "closed"

  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        ref={ref}
        data-state={state}
        className={cn("border-b", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
})
AccordionItemWrapper.displayName = "AccordionItem"

const AccordionTriggerInner = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value: itemValue } = React.useContext(AccordionItemContext)
  const { value: selectedValue, onValueChange } = React.useContext(AccordionContext)
  const isOpen = selectedValue === itemValue
  
  return (
    <h3 className="flex">
      <button
        ref={ref}
        type="button"
        onClick={() => onValueChange?.(itemValue)}
        aria-expanded={isOpen}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    </h3>
  )
})
AccordionTriggerInner.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { value: itemValue } = React.useContext(AccordionItemContext)
  const { value: selectedValue } = React.useContext(AccordionContext)
  const isOpen = selectedValue === itemValue

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "overflow-hidden text-sm transition-all animate-accordion-down data-[state=closed]:animate-accordion-up",
        className
      )}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItemWrapper as AccordionItem, AccordionTrigger, AccordionContent }
