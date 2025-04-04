// components/Navbar.tsx
import Link from "next/link"; // Import Link for potential future navigation
import { cn } from "@/lib/utils";

export default function Navbar() {
  return (
    <header className={cn("fixed top-0 z-50 w-full bg-primary border-none")}>
      <div className="container flex h-14 max-w-screen-2xl items-center ml-5">
        <div className="flex text-xl text-primary-foreground">
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <svg
              fill="none"
              stroke="#ffffff"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              <path
                d="M7 8L3 11.6923L7 16M17 8L21 11.6923L17 16M14 4L10 20"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />{" "}
            </svg>

            <span className="font-bold inline-block">Live Code Editor</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
