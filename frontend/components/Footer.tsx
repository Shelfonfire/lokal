export default function Footer() {
  return (
    <footer className="bg-warm-cream border-t border-soft-gray-green/20 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <h2 className="font-heading text-2xl font-bold text-forest-green mb-4">Lokal</h2>
          <p className="font-body text-deep-earth-brown/80 text-sm leading-relaxed">
            Connecting you with sustainable local businesses. Discover, support, and grow your community.
          </p>
        </div>
        
        <div className="col-span-1">
          <h3 className="font-heading text-lg font-semibold text-deep-earth-brown mb-4">Platform</h3>
          <ul className="space-y-2">
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">About Us</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">How it Works</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">Business Sign-up</a></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-heading text-lg font-semibold text-deep-earth-brown mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">Terms of Service</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">Privacy Policy</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-sm">Cookie Policy</a></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-heading text-lg font-semibold text-deep-earth-brown mb-4">Connect</h3>
          <div className="flex space-x-4">
            {/* Social Icons Placeholders */}
            <a href="#" className="w-10 h-10 rounded-full bg-sage-green/20 flex items-center justify-center text-forest-green hover:bg-forest-green hover:text-cream transition-all">
              <span className="text-xl">📷</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-sage-green/20 flex items-center justify-center text-forest-green hover:bg-forest-green hover:text-cream transition-all">
              <span className="text-xl">𝕏</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-soft-gray-green/20 text-center">
        <p className="font-body text-deep-earth-brown/50 text-xs">
          © {new Date().getFullYear()} Lokal. All rights reserved.
        </p>
      </div>
    </footer>
  );
}



