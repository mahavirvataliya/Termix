import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Users, Server, X } from "lucide-react";
import { getUsersList, getSSHHosts, shareCredential } from "@/ui/main-axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Credential } from "../../../../types/index.js";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  credential: Credential;
  onSuccess?: () => void;
}

interface UserOption {
  id: string;
  username: string;
}

interface HostOption {
  id: number;
  name: string;
  ip: string;
  port: number;
}

export function ShareDialog({
  open,
  onClose,
  credential,
  onSuccess,
}: ShareDialogProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedHostIds, setSelectedHostIds] = useState<number[]>([]);
  const [restrictToHosts, setRestrictToHosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchHosts();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const response = await getUsersList();
      setUsers(response);
    } catch (error) {
      toast.error("Failed to fetch users list");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await getSSHHosts();
      setHosts(response);
    } catch (error) {
      toast.error("Failed to fetch hosts");
    }
  };

  const handleShare = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to share with");
      return;
    }

    if (restrictToHosts && selectedHostIds.length === 0) {
      toast.error("Please select at least one host or disable host restriction");
      return;
    }

    setLoading(true);
    try {
      await shareCredential(
        credential.id,
        selectedUserId,
        restrictToHosts ? selectedHostIds : undefined,
      );
      toast.success("Credential shared successfully");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to share credential");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    setSelectedHostIds([]);
    setRestrictToHosts(false);
    onClose();
  };

  const toggleHostSelection = (hostId: number) => {
    setSelectedHostIds((prev) =>
      prev.includes(hostId)
        ? prev.filter((id) => id !== hostId)
        : [...prev, hostId],
    );
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share Credential
          </DialogTitle>
          <DialogDescription>
            Share "{credential.name}" with another user. They will be able to
            use this credential but not modify it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select User
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {loadingData ? (
                  <SelectItem value="loading" disabled>
                    Loading users...
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No other users available
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.username}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedUser && (
              <Badge variant="secondary" className="mt-2">
                Selected: {selectedUser.username}
              </Badge>
            )}
          </div>

          {/* Host Restriction Option */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="restrict-hosts"
                checked={restrictToHosts}
                onCheckedChange={(checked) => {
                  setRestrictToHosts(checked as boolean);
                  if (!checked) {
                    setSelectedHostIds([]);
                  }
                }}
              />
              <Label
                htmlFor="restrict-hosts"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Restrict to specific hosts
              </Label>
            </div>
            {restrictToHosts && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Server className="h-4 w-4" />
                  Select hosts that can use this credential
                </Label>
                <ScrollArea className="h-[200px] border rounded-md p-3">
                  {hosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hosts available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {hosts.map((host) => (
                        <div
                          key={host.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => toggleHostSelection(host.id)}
                        >
                          <Checkbox
                            checked={selectedHostIds.includes(host.id)}
                            onCheckedChange={() => toggleHostSelection(host.id)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {host.name || `${host.ip}:${host.port}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {host.ip}:{host.port}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedHostIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedHostIds.map((hostId) => {
                      const host = hosts.find((h) => h.id === hostId);
                      return host ? (
                        <Badge
                          key={hostId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {host.name || `${host.ip}:${host.port}`}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHostSelection(hostId);
                            }}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading || !selectedUserId}>
            {loading ? "Sharing..." : "Share Credential"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
