import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Header() {
  const profilePhoto = PlaceHolderImages.find(p => p.id === 'profile-photo');

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6 md:px-8">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                A list of links to navigate the application.
              </SheetDescription>
            </SheetHeader>
            <nav className="grid gap-4 py-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo className="h-6 w-6 text-primary" />
                <span className="">School Navigator</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Students
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Teachers
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Classes
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="#" className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
          <h1 className="hidden text-xl font-bold text-foreground sm:inline-block font-headline">
            School Navigator
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-9 w-9">
          {profilePhoto && (
            <AvatarImage
              src={profilePhoto.imageUrl}
              alt="School Representative"
              data-ai-hint={profilePhoto.imageHint}
            />
          )}
          <AvatarFallback>SR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
