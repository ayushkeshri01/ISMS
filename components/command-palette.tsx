"use client"

import { useState, useEffect } from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  Download,
  Settings,
  LogOut,
} from "lucide-react"

const commands = [
  {
    group: "Navigation",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", shortcut: "⌘D", href: "/dashboard/master" },
      { icon: Users, label: "Users", shortcut: "⌘U", href: "/dashboard/master/users" },
      { icon: FileText, label: "Reports", shortcut: "⌘R", href: "/dashboard/master/reports" },
    ],
  },
  {
    group: "Actions",
    items: [
      { icon: Download, label: "Export Data", shortcut: "⌘E", href: "#export" },
      { icon: Settings, label: "Settings", shortcut: "⌘S", href: "/dashboard/master/settings" },
      { icon: LogOut, label: "Sign Out", shortcut: "⌘Q", href: "/api/auth/signout" },
    ],
  },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() =>
                  runCommand(() => {
                    if (item.href.startsWith("#")) {
                      document.dispatchEvent(new CustomEvent("open-export-modal"))
                    } else if (item.href.startsWith("/api")) {
                      window.location.href = item.href
                    } else {
                      router.push(item.href)
                    }
                  })
                }
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
