'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Bike, Store, ShoppingCart, Menu, X, LogIn } from 'lucide-react'
import { useState } from 'react'
import { APP_NAME } from '@/lib/constants'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registerPopoverOpen, setRegisterPopoverOpen] = useState(false)
  const [loginPopoverOpen, setLoginPopoverOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-sm bg-background/95 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">{APP_NAME}</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/customer" className="text-foreground hover:text-primary transition-colors">
                Track
              </Link>
              
              {/* Login Button with Popover */}
              <Popover open={loginPopoverOpen} onOpenChange={setLoginPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">Login</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-1">
                    <Link
                      href="/rider/login"
                      onClick={() => setLoginPopoverOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Bike className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Bike Courier</span>
                        <span className="text-xs text-muted-foreground">Access your dashboard</span>
                      </div>
                    </Link>
                    <Link
                      href="/seller/login"
                      onClick={() => setLoginPopoverOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Store className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Seller</span>
                        <span className="text-xs text-muted-foreground">Access your store</span>
                      </div>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Register Button with Popover */}
              <Popover open={registerPopoverOpen} onOpenChange={setRegisterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="default">Register</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-1">
                    <Link
                      href="/rider"
                      onClick={() => setRegisterPopoverOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Bike className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Bike Courier</span>
                        <span className="text-xs text-muted-foreground">Deliver packages</span>
                      </div>
                    </Link>
                    <Link
                      href="/seller/register"
                      onClick={() => setRegisterPopoverOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Store className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Seller</span>
                        <span className="text-xs text-muted-foreground">Sell your products</span>
                      </div>
                    </Link>
                    <Link
                      href="/customer"
                      onClick={() => setRegisterPopoverOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Customer</span>
                        <span className="text-xs text-muted-foreground">Shop and order</span>
                      </div>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background overflow-visible">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Features
              </Link>
              <Link
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                About
              </Link>
              <Link
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/customer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Track
              </Link>
              
              {/* Mobile Login Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="login" className="border-none">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <span className="text-base font-medium">Login</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2">
                    <div className="space-y-1">
                      <Link
                        href="/rider/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <Bike className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Bike Courier</span>
                          <span className="text-xs text-muted-foreground">Access your dashboard</span>
                        </div>
                      </Link>
                      <Link
                        href="/seller/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <Store className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Seller</span>
                          <span className="text-xs text-muted-foreground">Access your store</span>
                        </div>
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Mobile Register Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="register" className="border-none">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <span className="text-base font-medium">Register</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2">
                    <div className="space-y-1">
                      <Link
                        href="/rider"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <Bike className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Bike Courier</span>
                          <span className="text-xs text-muted-foreground">Deliver packages</span>
                        </div>
                      </Link>
                      <Link
                        href="/seller/book"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <Store className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Seller</span>
                          <span className="text-xs text-muted-foreground">Sell your products</span>
                        </div>
                      </Link>
                      <Link
                        href="/customer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Customer</span>
                          <span className="text-xs text-muted-foreground">Shop and order</span>
                        </div>
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Fast, Reliable Delivery
                <span className="block text-primary mt-2">At Your Doorstep</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Connect with local couriers, sellers, and customers. Experience seamless delivery services
                powered by our innovative platform.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/customer">Track Your Order</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose {APP_NAME}?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <Bike className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bike Couriers</h3>
                <p className="text-muted-foreground">
                  Fast and eco-friendly delivery by our network of bike couriers. Earn money while helping
                  your community.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <Store className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sellers</h3>
                <p className="text-muted-foreground">
                  Reach more customers with our delivery platform. Manage orders and track deliveries
                  effortlessly.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <ShoppingCart className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Customers</h3>
                <p className="text-muted-foreground">
                  Shop from local sellers and get your orders delivered quickly. Track your packages in
                  real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">About {APP_NAME}</h2>
            <p className="text-lg text-muted-foreground">
              {APP_NAME} is a comprehensive delivery platform that connects bike couriers, sellers, and customers
              in a seamless ecosystem. We're committed to providing fast, reliable, and sustainable delivery
              solutions for your community.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-muted/50 border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">{APP_NAME}</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted delivery platform connecting communities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/rider" className="text-muted-foreground hover:text-primary transition-colors">
                    Become a Rider
                  </Link>
                </li>
                <li>
                  <Link href="/seller/register" className="text-muted-foreground hover:text-primary transition-colors">
                    Start Selling
                  </Link>
                </li>
                <li>
                  <Link href="/customer" className="text-muted-foreground hover:text-primary transition-colors">
                    Shop Now
                  </Link>
                </li>
                <li>
                  <Link href="/platform-admin/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Platform Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved. </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
