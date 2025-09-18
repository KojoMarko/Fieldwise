import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Manage your application settings here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings options will be available in a future update.</p>
        </CardContent>
      </Card>
    </div>
  );
}
