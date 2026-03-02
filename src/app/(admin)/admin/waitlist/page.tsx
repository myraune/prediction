import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminWaitlistPage() {
  let entries: { id: string; email: string; name: string | null; source: string; createdAt: Date }[] = [];
  let totalCount = 0;

  try {
    [entries, totalCount] = await Promise.all([
      prisma.waitlistEntry.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.waitlistEntry.count(),
    ]);
  } catch {
    // Database not available
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Waitlist</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? "person" : "people"} signed up
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1 tabular-nums">
          {totalCount}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signups yet. Share your waitlist link: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/waitlist</code>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Signed Up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {totalCount - i}
                    </TableCell>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
