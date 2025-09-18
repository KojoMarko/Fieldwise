import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>This is your profile page. You can edit your details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Profile editing functionality will be implemented soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
