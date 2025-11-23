import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import type { MembershipTier } from "@shared/schema";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  selectedTier?: MembershipTier;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", selectedTier = "NEST" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    onOpenChange(false);
    // Redirect to dashboard after successful login/registration
    setLocation("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col gap-0 p-0" data-testid="dialog-auth">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle data-testid="text-auth-title">
              {activeTab === "login" ? "Sign In" : "Create Merchant Account"}
            </DialogTitle>
            <DialogDescription data-testid="text-auth-description">
              {activeTab === "login"
                ? "Sign in to manage your offers and track sales"
                : "Join Urly Byrd to start promoting your flash deals"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={handleSuccess} selectedTier={selectedTier} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
