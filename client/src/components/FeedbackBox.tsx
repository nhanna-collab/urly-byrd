import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { MessageSquarePlus } from "lucide-react";

export default function FeedbackBox() {
  const [location] = useLocation();
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const submitFeedback = useMutation({
    mutationFn: async (feedbackData: { page: string; message: string }) => {
      return await apiRequest("POST", "/api/feedback", feedbackData);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve!",
      });
      setMessage("");
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate({
      page: location,
      message: message.trim(),
    });
  };

  if (!isExpanded) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-expand-feedback"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="text-sm">Tell us how we can improve this page</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border-b">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tell us how we can improve this page
              </p>
              <Textarea
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
                data-testid="textarea-feedback"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setMessage("");
                  }}
                  data-testid="button-cancel-feedback"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitFeedback.isPending}
                  data-testid="button-submit-feedback"
                >
                  {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
