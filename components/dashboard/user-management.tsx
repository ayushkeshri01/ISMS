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
import { Trash2, Plus, User } from "lucide-react"

interface UserData {
  id: string
  name: string
  role: string
  department: string
  companyKey?: string
  isCustom: boolean
}

interface Props {
  companyKey: string
}

const ROLES = ['IT_EXECUTIVE', 'HR_EXECUTIVE', 'ADMIN_FACILITIES', 'LEGAL']
const DEPARTMENTS = ['IT', 'HR', 'ADMIN', 'LEGAL', 'FINANCE', 'OPERATIONS', 'QUALITY']

export function UserManagement({ companyKey }: Props) {
  const [users, setUsers] = useState<UserData[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/auth/register")
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }
    loadUsers()
  }, [])
  
  const [formData, setFormData] = useState({
    pin: "",
    name: "",
    role: "",
    department: ""
  })

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyKey })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setShowAddForm(false)
        setFormData({ pin: "", name: "", role: "", department: "" })
        // Reload users after adding
        const res2 = await fetch("/api/auth/register")
        const data2 = await res2.json()
        setUsers(data2.users || [])
      } else {
        alert("Error: " + (data.error || "Failed to add user"))
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("Error submitting form")
    }
  }
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    
    try {
      await fetch(`/api/auth/register?id=${userId}`, { method: "DELETE" })
      // Reload users after deletion
      const res = await fetch("/api/auth/register")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Add User
        </Button>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Add Custom User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>PIN (4 digits) *</Label>
                  <Input 
                    type="text" 
                    maxLength={4} 
                    pattern="\d{4}" 
                    value={formData.pin} 
                    onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))} 
                    placeholder="1234" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    required 
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
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
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
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {user.name}
                  </div>
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
                  {user.isCustom && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
