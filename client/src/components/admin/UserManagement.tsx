import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  plan?: string;
  approvalStatus: "pending" | "approved" | "rejected" | "blocked";
  accessLevel: "total" | "partial";
  aiChatEnabled: boolean;
}

export function UserManagement() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"pending" | "approved" | "all">("pending");

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const approveMutation = useMutation({
    mutationFn: (data: { userId: string; accessLevel: "total" | "partial"; aiChatEnabled: boolean }) =>
      apiRequest("POST", `/api/admin/users/${data.userId}/approve`, {
        accessLevel: data.accessLevel,
        aiChatEnabled: data.aiChatEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("POST", `/api/admin/users/${userId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User rejected" });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("POST", `/api/admin/users/${userId}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User blocked" });
    },
  });

  const filteredUsers = allUsers.filter((user) => {
    if (selectedTab === "pending") return user.approvalStatus === "pending";
    if (selectedTab === "approved") return user.approvalStatus === "approved";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={selectedTab === "pending" ? "default" : "outline"}
          onClick={() => setSelectedTab("pending")}
          data-testid="button-filter-pending"
        >
          Pending ({allUsers.filter(u => u.approvalStatus === "pending").length})
        </Button>
        <Button
          variant={selectedTab === "approved" ? "default" : "outline"}
          onClick={() => setSelectedTab("approved")}
          data-testid="button-filter-approved"
        >
          Approved ({allUsers.filter(u => u.approvalStatus === "approved").length})
        </Button>
        <Button
          variant={selectedTab === "all" ? "default" : "outline"}
          onClick={() => setSelectedTab("all")}
          data-testid="button-filter-all"
        >
          All ({allUsers.length})
        </Button>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4" data-testid={`user-card-${user.id}`}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {user.email}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Plan: {user.plan || "N/A"} | Age: {user.age || "N/A"}
                  </p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded ${
                  user.approvalStatus === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                  user.approvalStatus === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}>
                  {user.approvalStatus.toUpperCase()}
                </span>
              </div>

              {user.approvalStatus === "pending" && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Access Level</label>
                      <Select
                        defaultValue="partial"
                        onValueChange={(val) => {
                          // Store for approval
                        }}
                      >
                        <SelectTrigger data-testid={`select-access-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Total Access</SelectItem>
                          <SelectItem value="partial">Partial Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Checkbox id={`ai-${user.id}`} />
                      <label htmlFor={`ai-${user.id}`} className="text-sm">
                        AI Chat
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate({
                        userId: user.id,
                        accessLevel: "total",
                        aiChatEnabled: true,
                      })}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${user.id}`}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(user.id)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-reject-${user.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {user.approvalStatus === "approved" && (
                <div className="space-y-2 pt-3 border-t text-sm">
                  <p>Access Level: <span className="font-semibold">{user.accessLevel}</span></p>
                  <p>AI Chat: {user.aiChatEnabled ? "Enabled" : "Disabled"}</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => blockMutation.mutate(user.id)}
                    disabled={blockMutation.isPending}
                    data-testid={`button-block-${user.id}`}
                  >
                    Block User
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
