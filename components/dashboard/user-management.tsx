"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, User, Pencil, X, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  department: string
  companyKey?: string
  isCustom: boolean
}

interface Props {
  companyKey: string
}

const ROLES = ['IT_EXECUTIVE', 'HR_EXECUTIVE']
const DEPARTMENTS = ['IT', 'HR', 'FINANCE', 'OPERATIONS', 'QUALITY']

export function UserManagement({ companyKey }: Props) {
  const [users, setUsers] = useState<UserData[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ email: "", name: "" })

  const fetchUsers = () => {
    fetch("/api/auth/register")
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(err => console.error('Failed to fetch users:', err))
  }

  useEffect(() => { fetchUsers() }, [])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: ""
  })

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyKey }),
      })

      const data = await res.json()

      if (res.ok) {
        setShowAddForm(false)
        setFormData({ name: "", email: "", password: "", role: "", department: "" })
        fetchUsers()
      } else {
        toast.error("Error: " + (data.error || "Failed to add user"))
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Error submitting form")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return

    try {
      await fetch(`/api/auth/register?id=${userId}`, { method: "DELETE" })
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const startEdit = (user: UserData) => {
    setEditingId(user.id)
    setEditForm({ email: user.email, name: user.name })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ email: "", name: "" })
  }

  const saveEdit = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, email: editForm.email, name: editForm.name }),
      })

      const data = await res.json()

      if (res.ok) {
        setEditingId(null)
        fetchUsers()
      } else {
        alert("Error: " + (data.error || "Failed to update user"))
      }
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Add User
        </Button>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom User</DialogTitle>
              <DialogDescription>Create a new user account for this subsidiary</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit">Add User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.filter(u => u.companyKey === companyKey || !u.companyKey).map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {editingId === user.id ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      {user.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === user.id ? (
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-8 text-sm font-mono"
                      type="email"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  )}
                </TableCell>
                <TableCell>{user.role.replace(/_/g, ' ')}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.companyKey?.toUpperCase() || 'Group'}</TableCell>
                <TableCell>
                  <Badge variant={user.isCustom ? "secondary" : "outline"}>
                    {user.isCustom ? 'Custom' : 'Built-in'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === user.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => saveEdit(user.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.isCustom && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
