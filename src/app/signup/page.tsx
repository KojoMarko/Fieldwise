import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center items-center">
             <Link href="/" className="flex items-center gap-2 font-semibold mb-4">
                 <div
                    className="group flex h-16 w-16 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-14 md:w-14"
                >
                    <Image src="/Field Wise Logo.png" width={40} height={40} alt="FieldWise Logo" className="h-10 w-10 transition-all group-hover:scale-110" />
                    <span className="sr-only">FieldWise</span>
                </div>
            </Link>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
            Enter your information to create a new company account.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" placeholder="Alos Paraklet Healthcare" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" placeholder="Harriet" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="admin@alosparaklet.com"
                required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
            </div>
            <Button type="submit" className="w-full">
                Create Account
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
                Log in
            </Link>
            </div>
        </CardContent>
        </Card>
    </div>
  )
}
