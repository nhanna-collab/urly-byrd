import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Upload,
  BookOpen,
  Rocket,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: {
    label: string;
    onClick: () => void;
    linkStyle?: boolean;
    titleIsLink?: boolean;
  };
}

interface OnboardingPhase {
  id: string;
  title: string;
  icon: React.ElementType;
  steps: OnboardingStep[];
}

interface OnboardingChecklistProps {
  onboardingProgress: Record<string, boolean>;
  onNavigateToCustomers: () => void;
  onNavigateToCreateOffer: () => void;
}

export default function OnboardingChecklist({ 
  onboardingProgress,
  onNavigateToCustomers,
  onNavigateToCreateOffer
}: OnboardingChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      localStorage.removeItem('onboarding-checklist-open');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  const handleToggle = (newState: boolean) => {
    setIsOpen(newState);
  };

  const updateProgressMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const res = await apiRequest('PATCH', '/api/auth/onboarding', { stepId, completed: true });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const phases: OnboardingPhase[] = [
    {
      id: "setup",
      title: "Phase 1: Setup Your Account",
      icon: Upload,
      steps: [
        {
          id: "email_verified",
          title: "Complete Email Verification",
          description: "Verify your business email to activate your account",
          completed: onboardingProgress.email_verified || false,
        },
        {
          id: "customers_uploaded",
          title: "Upload Your Customer List",
          description: "If you have it. Import your existing customers via CSV to start building targeted campaigns",
          completed: onboardingProgress.customers_uploaded || false,
          action: {
            label: "Upload Your Customer List",
            onClick: () => window.location.href = '/merchant-collateral',
            linkStyle: true,
            titleIsLink: true,
          },
        },
        {
          id: "dashboard_reviewed",
          title: "Set up QR Code - Print and Display",
          description: "Access your merchant collateral including QR codes and marketing materials",
          completed: onboardingProgress.dashboard_reviewed || false,
          action: {
            label: "Set up QR Code - Print and Display",
            onClick: () => window.location.href = '/merchant-collateral',
            linkStyle: true,
            titleIsLink: true,
          },
        },
      ],
    },
    {
      id: "tutorial",
      title: "Phase 2: Learn the Basics",
      icon: BookOpen,
      steps: [
        {
          id: "campaign_types_learned",
          title: "Understand Campaign Types",
          description: "Learn about Percentage, Dollar Off, BOGO, and Spend Threshold offers",
          completed: onboardingProgress.campaign_types_learned || false,
          action: {
            label: "View Tutorial",
            onClick: () => updateProgressMutation.mutate('campaign_types_learned'),
          },
        },
        {
          id: "timing_tactics_learned",
          title: "Master Timing & Urgency Tactics",
          description: "Discover how to create urgency with flash sales and time-limited offers",
          completed: onboardingProgress.timing_tactics_learned || false,
          action: {
            label: "View Tutorial",
            onClick: () => updateProgressMutation.mutate('timing_tactics_learned'),
          },
        },
        {
          id: "sms_optimization_learned",
          title: "Understand SMS Cost Optimization",
          description: "Learn how our 1-SMS model doubles your text capacity",
          completed: onboardingProgress.sms_optimization_learned || false,
          action: {
            label: "View Tutorial",
            onClick: () => updateProgressMutation.mutate('sms_optimization_learned'),
          },
        },
      ],
    },
    {
      id: "launch",
      title: "Phase 3: Launch Your First Campaign",
      icon: Rocket,
      steps: [
        {
          id: "first_offer_created",
          title: "Create Your First Offer",
          description: "Design a compelling flash sale offer to attract customers",
          completed: onboardingProgress.first_offer_created || false,
          action: {
            label: "Create Offer",
            onClick: onNavigateToCreateOffer,
          },
        },
        {
          id: "goals_set",
          title: "Set Target Goals & Auto-Extension",
          description: "Configure sales targets and automatic campaign extensions",
          completed: onboardingProgress.goals_set || false,
        },
        {
          id: "qr_code_printed",
          title: "Print Your QR Code",
          description: "Display your QR code in-store for customers to scan and browse offers",
          completed: onboardingProgress.qr_code_printed || false,
          action: {
            label: "Mark as Printed",
            onClick: () => updateProgressMutation.mutate('qr_code_printed'),
          },
        },
      ],
    },
  ];

  const totalSteps = phases.reduce((sum, phase) => sum + phase.steps.length, 0);
  const completedSteps = phases.reduce(
    (sum, phase) => sum + phase.steps.filter(step => step.completed).length,
    0
  );
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (isDismissed || completedSteps === totalSteps) {
    return null;
  }

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-onboarding">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>Welcome to Urly Byrd! 🎯</CardTitle>
              <Badge variant="secondary" data-testid="badge-progress">
                {completedSteps}/{totalSteps} Complete
              </Badge>
            </div>
            <CardDescription>
              Get started with your merchant account in 3 easy phases. Complete the checklist below to maximize your flash sale success.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            data-testid="button-dismiss-onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" data-testid="progress-onboarding" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {phases.map((phase) => {
              const phaseCompleted = phase.steps.every(step => step.completed);
              const phaseStepsCompleted = phase.steps.filter(step => step.completed).length;
              
              return (
                <div key={phase.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <phase.icon className={`h-5 w-5 ${phaseCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className="font-semibold text-lg">{phase.title}</h3>
                    <Badge variant={phaseCompleted ? "default" : "outline"} className="ml-auto">
                      {phaseStepsCompleted}/{phase.steps.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 ml-7">
                    {phase.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-3 rounded-md border ${
                          step.completed ? 'bg-muted/50 border-muted' : 'bg-background'
                        }`}
                        data-testid={`step-${step.id}`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                          {!step.completed && step.action?.titleIsLink ? (
                            <button
                              onClick={step.action.onClick}
                              className="text-primary underline decoration-2 underline-offset-2 hover:text-primary/80 transition-colors text-left"
                              data-testid={`link-${step.id}`}
                            >
                              {step.title}
                            </button>
                          ) : (
                            step.title
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                        </div>
                        {!step.completed && step.action && !step.action.linkStyle && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={step.action.onClick}
                            data-testid={`button-${step.id}`}
                          >
                            {step.action.label}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {completedSteps === totalSteps && (
          <div className="mt-6 p-4 rounded-md bg-primary/10 border border-primary/20 text-center">
            <h4 className="font-semibold text-lg mb-2">🎉 Congratulations!</h4>
            <p className="text-sm text-muted-foreground">
              You've completed the onboarding checklist. You're ready to drive sales with flash campaigns!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
