import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  userId: string;
  page: string;
  message: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
  };
}

export default function ViewFeedback() {
  const { data: feedbackList, isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/feedback"],
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading feedback...
              </div>
            ) : !feedbackList || feedbackList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No feedback submitted yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackList.map((feedback) => (
                      <TableRow key={feedback.id} data-testid={`row-feedback-${feedback.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(feedback.createdAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {feedback.page}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {feedback.user.firstName} {feedback.user.lastName}
                          <div className="text-xs text-muted-foreground">
                            {feedback.user.email}
                          </div>
                        </TableCell>
                        <TableCell>{feedback.user.businessName}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="whitespace-pre-wrap break-words">
                            {feedback.message}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
