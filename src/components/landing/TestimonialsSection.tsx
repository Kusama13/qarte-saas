import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marie Dubois',
    role: 'Propriétaire',
    business: 'Boulangerie La Mie Dorée',
    image: '/images/testimonial-1.jpg',
    content:
      'Depuis que j\'utilise Qarte, je n\'imprime plus de cartes papier. Mes clients adorent scanner le QR code et voir leur progression. Le tableau de bord me permet de voir qui sont mes meilleurs clients.',
    rating: 5,
  },
  {
    name: 'Thomas Martin',
    role: 'Gérant',
    business: 'Café Le Central',
    image: '/images/testimonial-2.jpg',
    content:
      'Installation en 5 minutes, vraiment impressionnant. Le prix est imbattable par rapport à la concurrence. Je recommande à tous les commerçants qui veulent digitaliser leur fidélisation.',
    rating: 5,
  },
  {
    name: 'Sophie Laurent',
    role: 'Directrice',
    business: 'Salon Élégance',
    image: '/images/testimonial-3.jpg',
    content:
      'Mes clientes peuvent enfin suivre leurs points depuis leur téléphone. Fini les cartes oubliées ! Le support est très réactif et m\'a aidée à personnaliser ma page fidélité.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">Ils nous font confiance</h2>
          <p className="section-subtitle">
            Découvrez pourquoi des centaines de commerçants ont choisi Qarte
          </p>
        </div>

        <div className="grid gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card relative">
              <Quote className="absolute w-10 h-10 text-primary-100 top-4 right-4" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              <p className="mb-6 text-gray-600 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full bg-primary">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}, {testimonial.business}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
