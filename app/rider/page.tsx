'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Bike, Clock, DollarSign, MapPin, Smartphone, CheckCircle2, FileText, UserCheck, Phone, Mail, HelpCircle } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function RiderLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Bike className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Become a Rider
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join {APP_NAME} and earn flexible income while delivering packages across your community. 
            Set your own hours, get weekly payouts, and be part of Ghana's fastest-growing delivery network.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link href="/rider/register">Become a Rider</Link>
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Join {APP_NAME}?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Clock className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Flexible Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Work when it suits you. Choose your own schedule and accept deliveries that fit your availability.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Weekly Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get paid every week directly to your account. Transparent earnings with no hidden fees.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <MapPin className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access our advanced tracking system to optimize routes and manage deliveries efficiently.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Bike className="w-10 h-10 text-primary mb-4" />
                <CardTitle>High Volume Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tap into a growing network of customers and sellers. More deliveries mean more earnings.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Valid Ghana Card</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A valid Ghana Card is required for identity verification and account setup.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Smartphone className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Smartphone & Ghana Number</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A smartphone with an active Ghana phone number is essential for receiving delivery requests and using our app.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Valid Motorcycle License</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A current, valid motorcycle license is mandatory for all rider applicants.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Submit Application</h3>
                <p className="text-muted-foreground">
                  Complete our simple registration form with your personal details, Ghana Card information, and motorcycle license details.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Verification of ID and License</h3>
                <p className="text-muted-foreground">
                  Our team will verify your Ghana Card and motorcycle license to ensure all documents are valid and current.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Attend Brief Onboarding</h3>
                <p className="text-muted-foreground">
                  Participate in a short onboarding session to learn about our platform, delivery processes, and best practices.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Start Receiving Delivery Requests</h3>
                <p className="text-muted-foreground">
                  Once approved, you'll start receiving delivery requests. Accept the ones that work for you and start earning.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/rider/register">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-12">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="earnings">
              <AccordionTrigger>How much can I earn as a rider?</AccordionTrigger>
              <AccordionContent>
                Earnings vary based on the number of deliveries you complete, distance traveled, and time invested. 
                Many riders earn competitive weekly income by accepting multiple delivery requests. Your earnings 
                are transparent and paid directly to your account every week.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="payouts">
              <AccordionTrigger>When and how do I receive payouts?</AccordionTrigger>
              <AccordionContent>
                Payouts are processed weekly and transferred directly to your registered bank account or mobile money 
                account. You'll receive a detailed earnings statement with each payout showing all completed deliveries 
                and corresponding earnings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>What kind of support is available?</AccordionTrigger>
              <AccordionContent>
                We provide comprehensive support through our in-app chat, email, and phone support. Our team is 
                available to help with delivery issues, technical problems, account questions, and any other concerns 
                you may have while working as a rider.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="hours">
              <AccordionTrigger>Are there minimum working hours required?</AccordionTrigger>
              <AccordionContent>
                No, there are no minimum working hours. You have complete flexibility to work as much or as little as 
                you want. Accept delivery requests that fit your schedule and availability.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="documentation">
              <AccordionTrigger>What documentation do I need to provide?</AccordionTrigger>
              <AccordionContent>
                You'll need to provide your Ghana Card details, a valid motorcycle license, and a profile photo. 
                During the registration process, you'll upload a clear image of your motorcycle license. All 
                documents are securely stored and used only for verification purposes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">{APP_NAME}</h3>
              <p className="text-sm text-muted-foreground">
                Connecting communities through fast, reliable delivery services across Ghana.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+233 XX XXX XXXX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.com</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/rider/register" className="text-muted-foreground hover:text-primary transition-colors">
                    Apply Now
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
