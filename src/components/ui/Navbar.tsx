import Link from "next/link"
import { Button } from "./button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  return (
    <nav className="fixed w-full flex items-center justify-between px-6 lg:px-8 py-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Hostellizer
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
          Features
        </Link>
        <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
          Pricing
        </Link>
        <Link href="#about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
          About
        </Link>
        <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
          Contact
        </Link>
      </div>

      {/* Desktop CTA Buttons */}
      <div className="hidden md:flex items-center space-x-4">
        {session ? (
          <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
            <Button size="lg" variant="outline">
              Dashboard
            </Button>
          </Link>
        ) : (
          <>
          <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
          <Button size="lg" variant="outline">
            Sign In
          </Button>
       

        </Link>
        </>
        )}
       
        <Button asChild size="lg" >
          <Link href="/login">Get Started</Link>
        </Button>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 md:hidden">
          <div className="px-6 py-4 space-y-4">
            <Link href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
              Features
            </Link>
            <Link href="#pricing" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
              Pricing
            </Link>
            <Link href="#about" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
              About
            </Link>
            <Link href="/contact" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium">
              Contact
            </Link>
            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
              <Link href="/login" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium mb-3">
                Sign In
              </Link>
              <Button asChild size="sm" >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
