"use client";

import "reflect-metadata";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import {
  BookOpen,
  Users,
  DollarSign,
  FileText,
  Star,
  Phone,
  CheckCircle,
  Key,
  Clock,
  Target,
  Utensils,
  TrendingUp,
  Zap,
  Calendar,
  CreditCard,
  BarChart3,
  MessageSquare,
  Globe,
  DollarSign as DollarSignIcon
} from "lucide-react";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const painPoints = [
  {
    title: "Scattered Records",
    description: "Student files scattered across notebooks, files, and random WhatsApp groups",
    icon: BookOpen,
    color: "from-destructive to-destructive/80"
  },
  {
    title: "Late Night Calls",
    description: "Parents calling at midnight asking for updates on their child's status",
    icon: Phone,
    color: "from-chart-4 to-chart-5"
  },
  {
    title: "Messy Attendance",
    description: "Mess attendance tracked on paper scraps leading to food wastage",
    icon: Utensils,
    color: "from-chart-3 to-chart-4"
  },
  {
    title: "Payment Chaos",
    description: "Forgotten payments, mounting dues, and no clear financial records",
    icon: DollarSign,
    color: "from-chart-1 to-chart-2"
  },
  {
    title: "Group Chat Hell",
    description: "Endless group chats where nothing gets tracked or organized",
    icon: MessageSquare,
    color: "from-primary to-primary/80"
  },
];

const solutions = [
  {
    title: "Student Management",
    description: "Store, search, and update student profiles instantly with zero paperwork",
    icon: Users,
    benefit: "Save 2+ hours daily on record keeping",
    color: "from-primary to-primary/80"
  },
  {
    title: "Smart Attendance",
    description: "Digital mess tracking with real-time updates and zero guesswork",
    icon: BarChart3,
    benefit: "Cut food wastage by 40%",
    color: "from-chart-1 to-chart-2"
  },
  {
    title: "Payment Automation",
    description: "Automated billing, payment tracking, and smart reminders for dues",
    icon: CreditCard,
    benefit: "Never miss a payment again",
    color: "from-chart-3 to-chart-4"
  },
  {
    title: "Direct Communication",
    description: "One platform for all student communication, cutting group chat noise",
    icon: MessageSquare,
    benefit: "Organized conversations that actually help",
    color: "from-chart-2 to-chart-3"
  },
  {
    title: "Digital Presence",
    description: "Professional online profile that builds trust with students and parents",
    icon: Globe,
    benefit: "Attract more students automatically",
    color: "from-chart-4 to-chart-5"
  },
];

const benefits = [
  {
    title: "Save Hours Every Week",
    description: "Automate the boring stuff so you can focus on growing your hostel",
    icon: Clock,
    metric: "5+ hours saved weekly",
    color: "from-primary to-primary/80"
  },
  {
    title: "Reduce Errors to Zero",
    description: "No more lost records, forgotten payments, or missed attendance",
    icon: Target,
    metric: "99.9% accuracy",
    color: "from-chart-1 to-chart-2"
  },
  {
    title: "Cut Food Wastage",
    description: "Real-time mess tracking helps plan meals with perfect accuracy",
    icon: Utensils,
    metric: "40% less waste",
    color: "from-chart-3 to-chart-4"
  },
  {
    title: "Boost Your Reputation",
    description: "Professional online presence shows you're organized and trustworthy",
    icon: Star,
    metric: "3x more trust",
    color: "from-chart-4 to-chart-5"
  },
  {
    title: "Scale Without Stress",
    description: "Whether you manage 20 students or 200, the system grows with you",
    icon: TrendingUp,
    metric: "Unlimited growth",
    color: "from-chart-2 to-chart-3"
  },
];

const socialProof = [
  {
    number: "1000+",
    label: "Students Managed Daily",
    description: "Across 50+ hostels nationwide"
  },
  {
    number: "24/7",
    label: "Support Available",
    description: "We're here when you need us"
  },
  {
    number: "99%",
    label: "Satisfaction Rate",
    description: "Hostel owners love our platform"
  },
  {
    number: "5hrs",
    label: "Saved Weekly",
    description: "Average time saved per hostel"
  },
];

const registrationSteps = [
  {
    number: "01",
    title: "Contact Us",
    description: "Reach out to our team through email or phone to express your interest",
    icon: Phone,
  },
  {
    number: "02",
    title: "Hostel Registration",
    description: "Provide your hostel details and complete the registration process",
    icon: FileText,
  },
  {
    number: "03",
    title: "Verification",
    description: "Our team verifies your hostel details and documentation",
    icon: CheckCircle,
  },
  {
    number: "04",
    title: "Access Granted",
    description: "Receive your login credentials and start managing your hostel",
    icon: Key,
  },
];

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <div className="relative overflow-hidden">


          {/* Hero Section */}
          <Hero />



          <section className="py-20 bg-gradient-to-br from-white to-gray-50">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                    Be Seen. Be Chosen.
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                    "The First Hostel Finder in Pakistan"
                  </h3>
                  <p className="text-xl  max-w-4xl mx-auto leading-relaxed">
                    Until now, hostels lived in the shadows — no listings, no visibility, no easy way for students to find you. <strong>We're changing that.</strong>
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Copy */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  <p className="text-lg  leading-relaxed">
                    For the first time ever, every hostel can have a public digital profile where students and jobians can explore, compare, and choose. No more depending only on word-of-mouth or local posters.
                  </p>

                  <div className="space-y-4">
                    <p className="text-lg  leading-relaxed">
                      With our platform:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex p-2 rounded-lg">
                          <Globe className="w-5 h-5" />
                        </div>
                        <p className="">Your hostel is discoverable online by thousands of seekers.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="inline-flex p-2 rounded-lg">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="">Students can view your rooms, amenities, and mess details before they even visit.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="inline-flex p-2 rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="">More visibility means more trust, more bookings, and more growth for your business.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary p-6 rounded-xl text-primary">
                    <p className="text-xl font-bold text-center">
                      "Your hostel deserves to be on the map — and now it finally is."
                    </p>
                  </div>

                  <div className="text-center pt-4 cursor-pointer">
                    <Link
                      href="/login"
                    >
                      <Button size='lg'>
                        Create Your Free Profile
                      </Button>
                    </Link>
                  </div>
                </motion.div>

                {/* Right Column - Visual */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-white text-center shadow-2xl">
                    <div className="inline-flex p-4 rounded-full text-white mb-4">
                      <Globe className="w-12 h-12" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4">Digital Visibility</h4>
                    <p className="text-gray-300 mb-6">
                      Transform your hostel from invisible to discoverable
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="inline-flex p-2 rounded-lg text-white mb-2">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="font-semibold">Student Reach</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="inline-flex p-2 rounded-lg text-white mb-2">
                          <Star className="w-4 h-4" />
                        </div>
                        <div className="font-semibold">Trust Building</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="inline-flex p-2 rounded-lg text-white mb-2">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="font-semibold">Online Presence</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="inline-flex p-2 rounded-lg text-white mb-2">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="font-semibold">Growth</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating elements for visual appeal */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                    <Star className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Target className="w-6 h-6" />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Main content container */}
          <div className="relative container mx-auto px-4 py-20">

            {/* Section 1: The Pain - Timeline Style */}
            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Hostel Owners Deserve Better Than Chaos
                </h2>
                <p className="text-xl  max-w-3xl mx-auto">
                  Managing a hostel isn't just about providing rooms — it's about keeping everything organized, fair, and transparent. But here's what usually happens:
                </p>
              </motion.div>

              {/* Timeline Layout */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-red-200 via-orange-200 to-yellow-200 rounded-full hidden lg:block"></div>

                <div className="space-y-12">
                  {painPoints.map((point, index) => {
                    const IconComponent = point.icon;
                    const isEven = index % 2 === 0;
                    return (
                      <motion.div
                        key={point.title}
                        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`flex items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col lg:gap-12`}
                      >
                        {/* Content Card */}
                        <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'} text-center lg:text-left bg-secondary  rounded-2xl`}>
                          <div className={`inline-flex items-center gap-4 p-6 rounded-2xl  transform hover:scale-105 transition-all duration-300 bg-secondary`}>
                            <div className="p-2 bg- rounded-lg">
                              <IconComponent className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-2">{point.title}</h3>
                              <p className=" text-lg text-secondary-foreground">{point.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Node */}
                        <div className="hidden lg:flex items-center justify-center w-16 h-16 bg-white border-4 border-gray-200 rounded-full shadow-lg z-10">
                          <div className={`w-8 h-8 rounded-full ${point.color}`}></div>
                        </div>

                        {/* Spacer for alternating layout */}
                        <div className="flex-1"></div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Section 2: The Solution - Feature Grid */}
            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  One Dashboard. Total Control.
                </h2>
                <p className="text-xl  max-w-3xl mx-auto">
                  We built this platform to be your <strong>digital hostel manager</strong>. No more juggling tools — everything you need to run your hostel is inside one secure, easy-to-use dashboard.
                </p>
              </motion.div>

              {/* Feature Grid with Hexagonal Layout */}
              <div className="relative max-w-6xl mx-auto">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="grid grid-cols-6 gap-4 h-full">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="bg-primary rounded-lg"></div>
                    ))}
                  </div>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {solutions.map((solution, index) => {
                    const IconComponent = solution.icon;
                    return (
                      <motion.div
                        key={solution.title}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group relative"
                      >
                        {/* Card */}
                        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                          {/* Icon */}
                          <div className="relative mb-6">
                            <div className={`inline-flex p-4 rounded-2xl ${solution.color} text-primary shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                              <IconComponent className="w-8 h-8" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="relative">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary transition-colors duration-300">
                              {solution.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                              {solution.description}
                            </p>

                            {/* Benefit Badge */}
                              <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></div>
                              <Badge variant='secondary'>
                                {solution.benefit}
                              </Badge>
                          </div>

                          {/* Decorative Elements */}
                          <div className="absolute top-4 right-4 w-8 h-8 border-2 border-gray-200 dark:border-gray-700 rounded-full opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500"></div>
                          <div className="absolute bottom-4 left-4 w-4 h-4 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-200 transition-all duration-700"></div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Section 3: Benefits - Metric Cards */}
            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Why Hostel Owners Love Our Platform
                </h2>
                <p className="text-xl  max-w-3xl mx-auto">
                  Real benefits that translate to real results for your hostel business
                </p>
              </motion.div>

              {/* Metric Cards Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, rotateY: -15 }}
                      whileInView={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="group perspective-1000"
                    >
                      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105 border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {/* Background Pattern */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

                        {/* Metric Display */}
                        <div className="relative mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl  ${benefit.color} text-primary shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">
                                {benefit.metric}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors duration-300">
                            {benefit.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative mt-6">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-secondary transition-all duration-1000 delay-${index * 200}`}
                              style={{ width: `${85 + (index * 3)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-3xl"></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Section 4: Social Proof - Stats Dashboard */}
            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Already Powering Hostels Across the Country
                </h2>
                <p className="text-xl  max-w-3xl mx-auto">
                  From small family-run hostels to large student accommodations, our platform is helping hostel owners simplify management, build trust, and grow.
                </p>
              </motion.div>

              {/* Dashboard Style Layout */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
                {/* Dashboard Header */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-semibold mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Statistics
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Performance Metrics</h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {socialProof.map((proof, index) => (
                    <motion.div
                      key={proof.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative"
                    >
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* Icon/Indicator */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12  rounded-xl flex items-center justify-center text-primary border shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                              {proof.label.split(' ')[0]}
                            </div>
                          </div>
                        </div>

                        {/* Main Number */}
                        <div className="mb-3">
                          <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                            {proof.number}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {proof.description}
                        </div>

                        {/* Progress Indicator */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000"
                              style={{ width: `${75 + (index * 5)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Dashboard Footer */}
                  <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-chart-1/10 dark:bg-chart-1/20 text-chart-1 dark:text-chart-1 rounded-full text-sm font-semibold">
                      <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></div>
                      All systems operational
                    </div>
                  </div>
              </div>
            </section>

            {/* Section 5: Product Screenshots - Showcase Layout */}
            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Clean. Intuitive. Designed for Hostel Owners — Not Techies.
                </h2>
                <p className="text-xl  max-w-3xl mx-auto">
                  See how our platform makes hostel management feel effortless
                </p>
              </motion.div>

              {/* Showcase Layout */}
              <div className="relative max-w-7xl mx-auto">
                {/* Main Showcase Container */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm">
                      hostellizer.com/dashboard
                    </div>
                  </div>

                  {/* Feature Showcase Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dashboard Overview */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      className="group relative"
                    >
                      <div className="bg-gradient-to-br from-primary to-primary/80 h-64 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="grid grid-cols-4 gap-2 h-full">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div key={i} className="bg-white/20 rounded"></div>
                            ))}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <BarChart3 className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <h3 className="text-xl font-bold mb-2">Dashboard Overview</h3>
                          <p className="text-primary/80 text-sm">Real-time insights at a glance</p>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
                      </div>
                    </motion.div>

                    {/* Attendance Panel */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="group relative"
                    >
                      <div className="bg-gradient-to-br from-chart-1 to-chart-2 h-64 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="grid grid-cols-3 gap-3 h-full">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div key={i} className="bg-white/20 rounded-lg"></div>
                            ))}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <Users className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <h3 className="text-xl font-bold mb-2">Attendance Panel</h3>
                          <p className="text-chart-1/80 text-sm">Smart tracking made simple</p>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
                      </div>
                    </motion.div>

                    {/* Payment Management */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="group relative"
                    >
                      <div className="bg-gradient-to-br from-chart-3 to-chart-4 h-64 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="grid grid-cols-2 gap-4 h-full">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="bg-white/20 rounded-xl"></div>
                            ))}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <CreditCard className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <h3 className="text-xl font-bold mb-2">Payment Management</h3>
                          <p className="text-chart-3/80 text-sm">Transparent financial control</p>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom Status Bar */}
                  <div className="mt-8 flex items-center justify-between text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></div>
                      <span>All systems operational</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Last updated: Just now</span>
                      <span>•</span>
                      <span>Version 2.1.0</span>
                    </div>
                  </div>
                </div>

                {/* Floating Action Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                  <Star className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </section>



            {/* Final CTA Section */}
            <section>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center relative overflow-hidden rounded-2xl p-16 border border-border bg-card/40 backdrop-blur-xl"
              >
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                    Your Hostel. Your Rules. Our Technology.
                  </h2>
                  <p className="text-xl  mb-8 max-w-3xl mx-auto">
                    Hostel management doesn't need to be stressful. With our SaaS, you get clarity, control, and confidence — all in one place.
                  </p>
                  <p className="text-lg  mb-10">
                    Stop losing time in spreadsheets and start running your hostel the smart way.
                  </p>
                  <Link
                    href="/login"
                  >
                    <Button size='lg'>
                      <Zap className="w-6 h-6" />
                      Get Started Free
                    </Button>

                  </Link>
                </div>
              </motion.div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-border/10 bg-background/80 ">
        <div className="container mx-auto px-4">
          <p className="text-sm mb-2">© {new Date().getFullYear()} Made with ❤️ by Shan Muhammad. All rights reserved.</p>
          <p className="text-xs ">Hostellizer - Making hostel management simple, one dashboard at a time.</p>
        </div>
      </footer>
    </div>
  );
}
