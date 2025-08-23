import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GitBranch, FileText, Zap, Github, ArrowRight, Sparkles, Code, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      <nav className="relative px-6 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image 
                src="/randish-logo.png" 
                alt="Randish Logo" 
                width={50} 
                height={50}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Echo
              </span>
              <p className="text-xs text-gray-500 font-medium">by Randish</p>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              How it Works
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Pricing
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Sign In
            </Link>
            <Button asChild className="btn-primary">
              <Link href="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-6 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-rose-100/50 rounded-full blur-3xl transform -translate-y-1/2 scale-150"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600/10 to-rose-600/10 rounded-full border border-pink-200 mb-8">
                <Sparkles className="h-4 w-4 text-pink-600 mr-2" />
                <span className="text-sm font-medium text-pink-800">AI-Powered Documentation Generation</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 bg-clip-text text-transparent block">
                  Code into Docs
                </span>
                <span className="text-4xl md:text-5xl text-gray-600 font-normal">
                  Automatically
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Echo analyzes your GitHub repositories and generates comprehensive, 
                professional documentation using advanced AI. No setup required—just connect and generate.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button size="lg" asChild className="btn-primary group">
                  <Link href="/auth" className="flex items-center text-lg px-8 py-4">
                    <Github className="mr-3 h-6 w-6" />
                    Connect GitHub
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" size="lg" asChild className="border-2 border-gray-300 hover:border-pink-300 text-lg px-8 py-4">
                  <Link href="/demo" className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    View Demo
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Repositories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Developers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">4.9★</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Powerful Features for
                <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"> Modern Teams</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to create, maintain, and share beautiful documentation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="group bg-gradient-to-br from-white to-pink-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-pink-100 card-hover">
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GitBranch className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">GitHub Integration</h3>
                <p className="text-gray-600 leading-relaxed">
                  Seamlessly connect your repositories with secure OAuth. Echo automatically 
                  analyzes your codebase structure, dependencies, and architecture patterns.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-white to-lime-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-lime-100 card-hover">
                <div className="bg-gradient-to-r from-lime-500 to-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">AI-Powered Analysis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced AI understands your code context, identifies patterns, and generates 
                  accurate, contextual documentation tailored to your project's needs.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 card-hover">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Multiple Formats</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate API docs, user guides, internal documentation, and more. 
                  Export in various formats including Markdown, PDF, and HTML.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20 bg-gradient-to-br from-gray-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Documentation in
                <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"> 4 Simple Steps</span>
              </h2>
              <p className="text-xl text-gray-600">
                From code to docs in minutes, not hours
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Connect Repository</h4>
                <p className="text-gray-600 leading-relaxed">
                  Link your GitHub account and select the repositories you want to document
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-r from-lime-500 to-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">AI Analysis</h4>
                <p className="text-gray-600 leading-relaxed">
                  Our AI analyzes your code structure, dependencies, and patterns automatically
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Generate Docs</h4>
                <p className="text-gray-600 leading-relaxed">
                  Choose your documentation type and let Echo generate comprehensive docs
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-2xl">4</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Export & Share</h4>
                <p className="text-gray-600 leading-relaxed">
                  Download your documentation or share it directly with your team
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to Transform Your Documentation?
            </h2>
            <p className="text-xl mb-10 text-pink-100">
              Join thousands of developers who've streamlined their documentation workflow with Echo
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-white text-pink-600 hover:bg-gray-50 text-lg px-8 py-4">
                <Link href="/auth" className="flex items-center">
                  <Github className="mr-3 h-6 w-6" />
                  Start Free Today
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-pink-600 text-lg px-8 py-4">
                <Link href="/demo">
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/randish-logo.png" 
                  alt="Randish Logo" 
                  width={40} 
                  height={40}
                />
                <div>
                  <span className="text-xl font-bold">Echo</span>
                  <p className="text-xs text-gray-400">by Randish</p>
                </div>
              </Link>
              <p className="text-gray-400 max-w-md">
                AI-powered documentation generation for modern development teams. 
                Transform your code into beautiful, comprehensive documentation automatically.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex items-center justify-between">
            <p className="text-gray-400">
              © 2024 Randish. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <Link href="https://github.com/Randish-soft/Echo" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
