import { ArrowRight, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { APP_NAME, APP_TAGLINE } from '@/config/app'
import { Button } from '@/components/ui'

const footerLinks = {
  producto: [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Beneficios', href: '#beneficios' },
    { label: 'Preguntas frecuentes', href: '#faqs' },
  ],
  cuenta: [
    { label: 'Iniciar sesión', to: '/login' },
    { label: 'Crear cuenta', to: '/registro' },
  ],
  contacto: [{ label: 'Contacto', href: '#contacto' }],
}

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-hero-bg text-hero-text">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left">
            <Link to="/" className="flex justify-center lg:justify-start">
              <img
                src={logo}
                alt={APP_NAME}
                className="mx-auto h-14 w-auto object-contain md:h-16 lg:mx-0"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-hero-text/70">
              {APP_TAGLINE}. Capta prospectos, organiza leads, forma equipos y duplica tu
              crecimiento con estructura.
            </p>
            <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link to="/registro" className="w-full sm:w-auto">
                <Button size="sm" className="w-full bg-gold text-hero-bg hover:bg-gold-light sm:w-auto">
                  Comenzar
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 bg-transparent text-hero-text hover:border-teal-accent hover:bg-teal-accent/10 sm:w-auto"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 lg:col-span-7 lg:text-left">
            <div className="flex flex-col items-center lg:items-start">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-teal-accent">
                Producto
              </p>
              <ul className="space-y-3">
                {footerLinks.producto.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-hero-text/75 transition-colors hover:text-gold-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center lg:items-start">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-teal-accent">
                Cuenta
              </p>
              <ul className="space-y-3">
                {footerLinks.cuenta.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-hero-text/75 transition-colors hover:text-gold-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center lg:items-start">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-teal-accent">
                Contacto
              </p>
              <ul className="space-y-3">
                {footerLinks.contacto.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-hero-text/75 transition-colors hover:text-gold-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-hero-text/50">Próximamente contacto oficial</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <p className="text-xs text-hero-text/50">
            © {year} {APP_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-hero-text/40">
            Hecho para líderes que quieren crecer con sistema.
          </p>
        </div>
      </div>
    </footer>
  )
}
