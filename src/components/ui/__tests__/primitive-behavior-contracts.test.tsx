import * as React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { vi } from 'vitest'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

describe('primitive behavior contracts', () => {
  it.each([0, 45])('forwards Progress value %i to the Radix root', value => {
    render(<Progress value={value} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(value))
  })

  it('uses a native button for the built-in Sheet close control', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Change settings</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    const closeButton = screen.getByRole('button', { name: 'Закрыть' })
    expect(closeButton.tagName).toBe('BUTTON')
    expect(closeButton).toHaveClass('size-11')
  })

  it('preserves the native Dialog close button with the localized name', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Change settings</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const closeButton = screen.getByRole('button', { name: 'Закрыть' })
    expect(closeButton.tagName).toBe('BUTTON')
    expect(closeButton).toHaveClass('size-11')
  })

  it('reserves non-overlapping title width for 44px overlay close controls', () => {
    render(
      <>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Подтверждение массового назначения</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
        <Sheet open>
          <SheetContent>
            <SheetTitle>Правило с таким именем уже существует</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetContent>
        </Sheet>
      </>
    )

    expect(screen.getByText('Подтверждение массового назначения')).toHaveClass(
      'mt-10',
      'max-w-none',
      'break-words',
      'min-[20rem]:mt-0',
      'min-[20rem]:max-w-[calc(100%-3.5rem)]'
    )
    expect(screen.getByText('Правило с таким именем уже существует')).toHaveClass(
      'mt-10',
      'max-w-none',
      'break-words',
      'min-[20rem]:mt-0',
      'min-[20rem]:max-w-[calc(100%-3.5rem)]'
    )
  })

  it.each([true, false])(
    'returns focus to the Select trigger after choosing an item (usePortal=%s)',
    async usePortal => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger aria-label="Status">
            <SelectValue placeholder="Choose status" />
          </SelectTrigger>
          <SelectContent usePortal={usePortal}>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox', { name: 'Status' })
      await user.click(trigger)
      await user.click(await screen.findByRole('option', { name: 'Active' }))

      expect(trigger).toHaveFocus()
    }
  )

  it.each([true, false])(
    'returns focus to the Select trigger after Escape (usePortal=%s)',
    async usePortal => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger aria-label="Status">
            <SelectValue placeholder="Choose status" />
          </SelectTrigger>
          <SelectContent usePortal={usePortal}>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox', { name: 'Status' })
      await user.click(trigger)
      await user.keyboard('{Escape}')

      expect(trigger).toHaveFocus()
    }
  )

  it('preserves a caller-provided Select close autofocus handler', async () => {
    const user = userEvent.setup()
    const onCloseAutoFocus = vi.fn()
    render(
      <Select>
        <SelectTrigger aria-label="Status">
          <SelectValue placeholder="Choose status" />
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={onCloseAutoFocus}>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByRole('combobox', { name: 'Status' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1)
  })

  it('gives the Slider thumb a visible semantic focus treatment', () => {
    render(<Slider defaultValue={[40]} aria-label="Target margin" aria-valuetext="40 percent" />)

    const thumb = screen.getByRole('slider', { name: 'Target margin' })
    expect(thumb).toHaveAttribute('aria-valuetext', '40 percent')
    expect(thumb).toHaveAttribute('aria-valuenow', '40')
    expect(thumb).toHaveAttribute('aria-valuemin', '0')
    expect(thumb).toHaveAttribute('aria-valuemax', '100')
    expect(thumb).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2'
    )
    expect(screen.getByRole('slider').parentElement).not.toHaveAttribute('aria-label')
  })

  it('preserves disabled semantics for native Button', () => {
    render(<Button disabled>Disabled action</Button>)

    expect(screen.getByRole('button', { name: 'Disabled action' })).toBeDisabled()
  })

  it('preserves disabled semantics for DropdownMenu items', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Unavailable action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    expect(screen.getByRole('menuitem', { name: 'Unavailable action' })).toHaveAttribute(
      'data-disabled'
    )
  })

  it('preserves disabled semantics for Select items', () => {
    render(
      <Select open>
        <SelectTrigger aria-label="Disabled option select" />
        <SelectContent>
          <SelectItem value="unavailable" disabled>
            Unavailable option
          </SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('option', { name: 'Unavailable option' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('exposes selected Checkbox state without a second state model', () => {
    render(<Checkbox checked aria-label="Selected row" />)

    expect(screen.getByRole('checkbox', { name: 'Selected row' })).toHaveAttribute(
      'data-state',
      'checked'
    )
  })

  it('exposes open and selected Select state without a second state model', () => {
    render(
      <Select open defaultValue="active">
        <SelectTrigger aria-label="Open status" />
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = document.querySelector('[role="combobox"][aria-label="Open status"]')

    expect(trigger).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute('data-state', 'checked')
  })

  it('preserves destructive and caller-owned loading semantics for Button', () => {
    render(
      <Button variant="destructive" disabled aria-busy="true">
        Deleting…
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Deleting…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground',
      'hover:bg-destructive/90'
    )
  })

  it('uses semantic hover and selected-state classes for Select items', () => {
    render(
      <Select open defaultValue="active">
        <SelectTrigger aria-label="Semantic status" />
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('option', { name: 'Active' })).toHaveClass(
      'hover:bg-accent',
      'hover:text-accent-foreground',
      'focus:bg-accent',
      'focus:text-accent-foreground'
    )
  })

  it('preserves SelectContent usePortal=false for embedded consumers', () => {
    render(
      <div data-testid="select-host">
        <Select open>
          <SelectTrigger aria-label="Embedded status">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent usePortal={false}>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )

    expect(within(screen.getByTestId('select-host')).getByRole('listbox')).toBeInTheDocument()
  })

  it('preserves default portal placement for Dialog, Sheet, and Select', () => {
    const dialogRender = render(
      <div data-testid="dialog-host">
        <Dialog open>
          <DialogContent>
            <DialogTitle>Portaled dialog</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    )
    expect(screen.getByTestId('dialog-host')).not.toContainElement(
      screen.getByRole('dialog', { name: 'Portaled dialog' })
    )
    dialogRender.unmount()

    const sheetRender = render(
      <div data-testid="sheet-host">
        <Sheet open>
          <SheetContent>
            <SheetTitle>Portaled sheet</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetContent>
        </Sheet>
      </div>
    )
    expect(screen.getByTestId('sheet-host')).not.toContainElement(
      screen.getByRole('dialog', { name: 'Portaled sheet' })
    )
    sheetRender.unmount()

    render(
      <div data-testid="select-portal-host">
        <Select open>
          <SelectTrigger aria-label="Portaled status" />
          <SelectContent>
            <SelectItem value="active">Portaled option</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
    expect(screen.getByTestId('select-portal-host')).not.toContainElement(
      screen.getByRole('listbox')
    )
  })

  it.each([
    ['top', 'top-0'],
    ['right', 'right-0'],
    ['bottom', 'bottom-0'],
    ['left', 'left-0'],
  ] as const)('preserves Sheet side=%s and wide size', (side, sideClass) => {
    render(
      <Sheet open>
        <SheetContent side={side} size="wide">
          <SheetTitle>Wide settings</SheetTitle>
          <SheetDescription>Wide sheet</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    const sheet = screen.getByRole('dialog', { name: 'Wide settings' })
    expect(sheet).toHaveAttribute('data-side', side)
    expect(sheet).toHaveClass(sideClass, 'sm:max-w-md', 'lg:max-w-lg')
  })

  it('preserves the default Sheet side and size', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Default settings</SheetTitle>
          <SheetDescription>Default sheet</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByRole('dialog', { name: 'Default settings' })).toHaveClass(
      'right-0',
      'sm:max-w-sm'
    )
  })

  it.each([
    ['sm', '180px'],
    ['md', '280px'],
    ['lg', '350px'],
  ] as const)('preserves Tooltip size=%s', (size, maxWidth) => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Details</TooltipTrigger>
          <TooltipContent size={size}>Long explanation</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    const content = screen
      .getAllByText('Long explanation')
      .find(element => element.tagName === 'DIV')
    expect(content).toHaveStyle({ maxWidth })
  })

  it('preserves Button asChild without adding nested button semantics', () => {
    render(
      <Button asChild>
        <a href="/settings">Settings</a>
      </Button>
    )

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('preserves semantic table markup', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Notebook</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByRole('table')).toBeInstanceOf(HTMLTableElement)
    expect(screen.getByRole('columnheader', { name: 'Product' })).toHaveAttribute('scope', 'col')
  })

  it('exposes a named focusable table scroller as a region only when named', () => {
    const { rerender } = render(
      <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Orders table">
        <TableBody />
      </Table>
    )

    expect(screen.getByRole('region', { name: 'Orders table' })).toHaveAttribute('tabindex', '0')

    rerender(
      <Table>
        <TableBody />
      </Table>
    )
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('shows a semantic invalid state for form controls', () => {
    render(
      <>
        <Input aria-invalid="true" aria-label="Email" />
        <Textarea aria-invalid="true" aria-label="Notes" />
        <Checkbox aria-invalid="true" aria-label="Accept" />
        <RadioGroup>
          <RadioGroupItem aria-invalid="true" aria-label="Choice" value="choice" />
        </RadioGroup>
        <Select>
          <SelectTrigger aria-invalid="true" aria-label="Status" />
        </Select>
      </>
    )

    for (const control of [
      screen.getByRole('textbox', { name: 'Email' }),
      screen.getByRole('textbox', { name: 'Notes' }),
      screen.getByRole('checkbox', { name: 'Accept' }),
      screen.getByRole('radio', { name: 'Choice' }),
      screen.getByRole('combobox', { name: 'Status' }),
    ]) {
      expect(control).toHaveClass(
        'aria-invalid:border-destructive',
        'aria-invalid:ring-destructive/20'
      )
    }
  })

  it('preserves Form label and description links', () => {
    function FormFixture() {
      const form = useForm({ defaultValues: { email: '' } })
      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Work address</FormDescription>
              </FormItem>
            )}
          />
        </Form>
      )
    }

    render(<FormFixture />)

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('id')
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id)
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Work address').id)
  })

  it('preserves Skeleton pulse animation', () => {
    render(<Skeleton data-testid="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse')
  })
})
