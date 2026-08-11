import * as React from 'react'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'

import { Alert } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

describe('primitive semantic surface contracts', () => {
  it('contains no raw palette colors outside approved translucent scrims', async () => {
    const primitiveDirectory = join(process.cwd(), 'src/components/ui')
    const files = (await readdir(primitiveDirectory)).filter(file => file.endsWith('.tsx'))

    for (const file of files) {
      const source = await readFile(join(primitiveDirectory, file), 'utf8')
      const sourceWithoutScrims = source.replaceAll('bg-black/50', '').replaceAll('bg-black/80', '')
      expect(sourceWithoutScrims).not.toMatch(
        /\b(?:bg|border|fill|ring|stroke|text)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?(?:\/\d+)?\b|#[\da-f]{3,8}\b|(?:rgb|hsl)a?\(/i
      )
    }
  })

  it('preserves the global reduced-motion contract across animated primitives', async () => {
    const animatedPrimitives = [
      'alert-dialog.tsx',
      'dialog.tsx',
      'dropdown-menu.tsx',
      'popover.tsx',
      'select.tsx',
      'sheet.tsx',
      'slider.tsx',
      'tooltip.tsx',
    ]

    for (const file of animatedPrimitives) {
      const source = await readFile(join(process.cwd(), 'src/components/ui', file), 'utf8')
      expect(source).toContain('motion-reduce:')
    }

    const globalStyles = await readFile(join(process.cwd(), 'src/styles/globals.css'), 'utf8')
    expect(globalStyles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(globalStyles).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(globalStyles).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
  })

  it('uses theme-aware Dialog and AlertDialog content surfaces', () => {
    render(
      <>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Alert title</AlertDialogTitle>
            <AlertDialogDescription>Alert description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )

    const dialogs = [
      screen.getByText('Dialog title').closest('[role="dialog"]'),
      screen.getByText('Alert title').closest('[role="alertdialog"]'),
    ]
    for (const dialog of dialogs) {
      expect(dialog).toHaveClass('border-border', 'bg-background', 'text-foreground')
      expect(dialog).not.toHaveClass('bg-white')
    }
  })

  it('uses a theme-aware Sheet surface', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByRole('dialog')).toHaveClass(
      'border-border',
      'bg-background',
      'text-foreground'
    )
  })

  it('uses theme-aware Popover, DropdownMenu, and Select surfaces', () => {
    render(
      <>
        <Popover open>
          <PopoverTrigger>Popover trigger</PopoverTrigger>
          <PopoverContent>Popover body</PopoverContent>
        </Popover>
        <DropdownMenu open>
          <DropdownMenuTrigger>Menu trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Menu item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Select open>
          <SelectTrigger aria-label="Status" />
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </>
    )

    expect(screen.getByText('Popover body')).toHaveClass(
      'border-border',
      'bg-popover',
      'text-popover-foreground'
    )
    expect(screen.getByText('Menu item').closest('[role="menu"]')).toHaveClass(
      'border-border',
      'bg-popover',
      'text-popover-foreground'
    )
    expect(screen.getByText('Active').closest('[role="listbox"]')).toHaveClass(
      'border-border',
      'bg-popover',
      'text-popover-foreground'
    )
  })

  it('uses theme-aware Tooltip colors while preserving its compact size', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Tooltip body</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    const tooltip = screen.getAllByText('Tooltip body').find(element => element.tagName === 'DIV')
    if (!tooltip) {
      throw new Error('Tooltip content surface was not rendered')
    }
    expect(tooltip).toHaveClass('bg-popover', 'text-popover-foreground')
    expect(tooltip).toHaveStyle({ maxWidth: '180px' })
    expect(tooltip.style.backgroundColor).toBe('')
    expect(tooltip.style.color).toBe('')
  })

  it('uses semantic warning colors for Alert', () => {
    render(<Alert variant="warning">Warning</Alert>)

    expect(screen.getByRole('alert')).toHaveClass(
      'border-status-warning',
      'bg-status-warning',
      'text-status-warning-foreground'
    )
  })

  it('uses semantic surfaces for Slider track and thumb', () => {
    render(<Slider defaultValue={[25]} />)

    const thumb = screen.getByRole('slider')
    expect(thumb.parentElement?.previousElementSibling).toHaveClass('bg-muted')
    expect(thumb).toHaveClass('bg-background')
  })
})
