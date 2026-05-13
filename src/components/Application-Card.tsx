import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ApplicationCardProps {
  studentName: string;
  monthlyRent: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  studentName,
  monthlyRent,
  status,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-[350px] mb-4">
      <CardHeader>
        <CardTitle>Application Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm text-muted-foreground">Student Name:</div>
          <div className="font-medium">{studentName}</div>

          <div className="text-sm text-muted-foreground">Monthly Rent:</div>
          <div className="font-medium">${monthlyRent}</div>

          <div className="text-sm text-muted-foreground">Status:</div>
          <Badge variant={getStatusVariant(status)}>{status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
