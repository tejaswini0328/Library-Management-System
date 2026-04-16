import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  
  if (normalized === 'pending') {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900">Pending</Badge>;
  }
  if (normalized === 'issued') {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">Issued</Badge>;
  }
  if (normalized === 'returned') {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">Returned</Badge>;
  }
  if (normalized === 'overdue') {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900">Overdue</Badge>;
  }
  
  if (normalized === 'active' || normalized === 'available') {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">{status}</Badge>;
  }
  if (normalized === 'expired' || normalized === 'suspended' || normalized === 'unavailable') {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900">{status}</Badge>;
  }
  
  return <Badge variant="outline">{status}</Badge>;
}
