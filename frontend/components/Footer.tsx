export default function Footer() {
  return (
    <footer className="bg-warm-cream border-t border-soft-gray-green/20 py-3 px-6 h-full flex flex-col">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        <div className="col-span-1">
          <h2 className="font-heading text-lg font-bold text-forest-green mb-2">Lokal</h2>
          <p className="font-body text-deep-earth-brown/80 text-xs leading-tight">
            Connecting you with sustainable local businesses.
          </p>
        </div>
        
        <div className="col-span-1">
          <h3 className="font-heading text-sm font-semibold text-deep-earth-brown mb-2">Platform</h3>
          <ul className="space-y-1">
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">About Us</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">How it Works</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">Business Sign-up</a></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-heading text-sm font-semibold text-deep-earth-brown mb-2">Legal</h3>
          <ul className="space-y-1">
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">Terms of Service</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">Privacy Policy</a></li>
            <li><a href="#" className="font-body text-deep-earth-brown/70 hover:text-forest-green transition-colors text-xs">Cookie Policy</a></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-heading text-sm font-semibold text-deep-earth-brown mb-2">Connect</h3>
          <div className="flex space-x-3">
            {/* Social Icons Placeholders */}
            <a href="#" className="w-8 h-8 rounded-full bg-sage-green/20 flex items-center justify-center text-forest-green hover:bg-forest-green hover:text-cream transition-all">
              <span className="text-base">📷</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-sage-green/20 flex items-center justify-center text-forest-green hover:bg-forest-green hover:text-cream transition-all">
              <span className="text-base">𝕏</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-soft-gray-green/20 text-center">
        <p className="font-body text-deep-earth-brown/50 text-xs">
          © {new Date().getFullYear()} Lokal. All rights reserved.
        </p>
      </div>
    </footer>
  );
}



