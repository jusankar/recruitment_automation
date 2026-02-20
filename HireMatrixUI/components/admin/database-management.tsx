"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DatabaseManagement() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/db/status");
      if (response.ok) {
        const data = await response.json();
        setStatus({
          connected: data.connected,
          message: data.message || "Database connection successful",
        });
      } else {
        setStatus({
          connected: false,
          message: "Failed to check database status",
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        message: "Error checking database connection",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Manage and monitor your PostgreSQL database connection.
          </p>
          <Button onClick={checkConnection} disabled={loading}>
            {loading ? "Checking..." : "Check Database Connection"}
          </Button>
        </div>

        {status && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={status.connected ? "default" : "destructive"}>
                {status.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{status.message}</p>
          </div>
        )}

        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold text-sm">Database Information</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Provider:</span> PostgreSQL
            </p>
            <p>
              <span className="font-medium">ORM:</span> Prisma
            </p>
            <p>
              <span className="font-medium">Models:</span> User, Tenant, Job,
              Application, Interview
            </p>
          </div>
        </div>

        <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Database migrations should be run via Prisma CLI:
            <code className="block mt-2 p-2 bg-white dark:bg-gray-900 rounded">
              npm run db:migrate
            </code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
