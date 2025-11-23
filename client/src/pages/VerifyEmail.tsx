import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. Please try again.");
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
        <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" data-testid="icon-loading" />
              <h2 className="text-2xl font-bold mb-2">Verifying Your Email...</h2>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" data-testid="icon-success" />
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setLocation("/")}
                  data-testid="button-login"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" data-testid="icon-error" />
              <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setLocation("/")}
                  data-testid="button-home"
                >
                  Go to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
